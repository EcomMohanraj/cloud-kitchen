import { Request, Response } from 'express';
import { prisma } from '../config/db';

const SLOT_TYPES = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const defaultCutoffMap: Record<string, string> = {
  BREAKFAST: '10:30 AM',
  LUNCH: '03:30 PM',
  SNACKS: '06:30 PM',
  DINNER: '10:00 PM',
};

const defaultOrderCutoffMap: Record<string, string> = {
  BREAKFAST: '06:00 AM',
  LUNCH: '11:00 AM',
  SNACKS: '03:30 PM',
  DINNER: '06:00 PM',
};

/**
 * Helper to ensure initial 7-day schedule exists in DB from today onwards
 */
async function ensureScheduleSeed() {
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = getLocalDateString(d);

    for (const slotType of SLOT_TYPES) {
      const expectedCutoff = defaultCutoffMap[slotType] || '10:30 AM';
      const expectedOrderCutoff = defaultOrderCutoffMap[slotType] || '06:00 AM';
      const existing = await prisma.slotsSchedule.findUnique({
        where: { date_slotType: { date: dateStr, slotType } },
      });

      if (!existing) {
        await prisma.slotsSchedule.create({
          data: {
            date: dateStr,
            slotType,
            isActive: true,
            isAvailable: true,
            maxOrders: 50,
            cutoffTime: expectedCutoff,
            orderCutoffTime: expectedOrderCutoff,
          },
        });
      } else if (!existing.orderCutoffTime) {
        await prisma.slotsSchedule.update({
          where: { date_slotType: { date: dateStr, slotType } },
          data: { orderCutoffTime: expectedOrderCutoff },
        });
      } else if (!existing.cutoffTime || ['06:30 AM', '11:00 AM', '10:00 AM', '05:30 PM', '09:00 AM', '04:00 PM', '11:30 AM'].includes(existing.cutoffTime)) {
        await prisma.slotsSchedule.update({
          where: { date_slotType: { date: dateStr, slotType } },
          data: { cutoffTime: expectedCutoff },
        });
      }
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

    const todayStr = getLocalDateString(new Date());
    const schedules = await prisma.slotsSchedule.findMany({
      where: {
        date: { gte: todayStr },
      },
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

    const todayStr = getLocalDateString(new Date());
    const schedules = await prisma.slotsSchedule.findMany({
      where: {
        date: { gte: todayStr },
      },
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
