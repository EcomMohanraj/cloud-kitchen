import { Request, Response } from 'express';
import { prisma } from '../config/db';

const SLOT_TYPES = ['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER'];

/**
 * Helper to ensure initial 7-day schedule exists in DB
 */
async function ensureScheduleSeed() {
  const count = await prisma.slotsSchedule.count();
  if (count > 0) return;

  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    for (const slotType of SLOT_TYPES) {
      await prisma.slotsSchedule.upsert({
        where: { date_slotType: { date: dateStr, slotType } },
        update: {},
        create: {
          date: dateStr,
          slotType,
          isActive: true,
          isAvailable: true,
          maxOrders: 50,
          cutoffTime: slotType === 'BREAKFAST' ? '09:00 AM' : slotType === 'SNACKS' ? '04:00 PM' : slotType === 'LUNCH' ? '11:30 AM' : '06:30 PM',
        },
      });
    }
  }
}

export const getSchedule = async (req: Request, res: Response) => {
  try {
    await ensureScheduleSeed();

    const { date } = req.query;

    if (date && typeof date === 'string') {
      const slots = await prisma.slotsSchedule.findMany({
        where: { date },
      });
      return res.json({ date, slots });
    }

    const schedules = await prisma.slotsSchedule.findMany({
      orderBy: [{ date: 'asc' }, { slotType: 'asc' }],
    });

    const dateMap: Record<
      string,
      {
        date: string;
        isDateActive: boolean;
        slots: Record<string, any>;
      }
    > = {};

    schedules.forEach((item) => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = {
          date: item.date,
          isDateActive: false,
          slots: {},
        };
      }
      dateMap[item.date].slots[item.slotType] = {
        ...item,
        isAvailable: Boolean(item.isAvailable && item.isActive),
      };
    });

    // Compute master date availability: ON if at least one slot is active & available
    Object.values(dateMap).forEach((dateObj) => {
      dateObj.isDateActive = Object.values(dateObj.slots).some(
        (s: any) => s.isActive && (s.isAvailable ?? true)
      );
    });

    return res.json({ schedule: Object.values(dateMap) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch schedule' });
  }
};

export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.action === 'TOGGLE_DATE') {
      const { date, isActive } = body;
      const targetState = Boolean(isActive);

      for (const slotType of SLOT_TYPES) {
        await prisma.slotsSchedule.upsert({
          where: { date_slotType: { date, slotType } },
          update: {
            isActive: targetState,
            isAvailable: targetState,
          },
          create: {
            date,
            slotType,
            isActive: targetState,
            isAvailable: targetState,
            maxOrders: 50,
            cutoffTime: '09:00 AM',
          },
        });
      }
    } else {
      const { date, slotType, isActive, maxCapacity, cutoffTime } = body;
      const targetState = Boolean(isActive);

      await prisma.slotsSchedule.upsert({
        where: {
          date_slotType: {
            date,
            slotType,
          },
        },
        update: {
          isActive: targetState,
          isAvailable: targetState,
          ...(maxCapacity !== undefined && { maxOrders: Number(maxCapacity) }),
          ...(cutoffTime !== undefined && { cutoffTime: String(cutoffTime) }),
        },
        create: {
          date,
          slotType,
          isActive: targetState,
          isAvailable: targetState,
          maxOrders: maxCapacity ? Number(maxCapacity) : 50,
          cutoffTime: cutoffTime ? String(cutoffTime) : '09:00 AM',
        },
      });
    }

    const schedules = await prisma.slotsSchedule.findMany({
      orderBy: [{ date: 'asc' }, { slotType: 'asc' }],
    });

    const dateMap: Record<string, any> = {};
    schedules.forEach((item) => {
      if (!dateMap[item.date]) {
        dateMap[item.date] = {
          date: item.date,
          isDateActive: false,
          slots: {},
        };
      }
      dateMap[item.date].slots[item.slotType] = {
        ...item,
        isAvailable: Boolean(item.isAvailable && item.isActive),
      };
    });

    Object.values(dateMap).forEach((dateObj: any) => {
      dateObj.isDateActive = Object.values(dateObj.slots).some(
        (s: any) => s.isActive && (s.isAvailable ?? true)
      );
    });

    return res.json({
      success: true,
      schedule: Object.values(dateMap),
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update schedule' });
  }
};
