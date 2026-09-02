import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (date) {
      const slots = await prisma.slotsSchedule.findMany({
        where: { date },
      });
      return NextResponse.json({ date, slots });
    }

    // Fetch all schedules ordered by date and slotType
    const schedules = await prisma.slotsSchedule.findMany({
      orderBy: [{ date: 'asc' }, { slotType: 'asc' }],
    });

    // Group by date
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
        isAvailable: item.isAvailable ?? item.isActive,
      };
      if (item.isActive && item.isAvailable) {
        dateMap[item.date].isDateActive = true;
      }
    });

    return NextResponse.json({ schedule: Object.values(dateMap) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const slotTypes = ['BREAKFAST', 'SNACKS', 'LUNCH', 'DINNER'];

    // 1. Toggle entire date ON or OFF
    if (body.action === 'TOGGLE_DATE') {
      const { date, isActive } = body;
      const targetState = Boolean(isActive);

      for (const slotType of slotTypes) {
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
      // 2. Toggle individual meal slot
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

    // Fetch refreshed full schedule list
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
      dateMap[item.date].slots[item.slotType] = item;
      if (item.isActive && item.isAvailable) {
        dateMap[item.date].isDateActive = true;
      }
    });

    return NextResponse.json({
      success: true,
      schedule: Object.values(dateMap),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update schedule' }, { status: 400 });
  }
}
