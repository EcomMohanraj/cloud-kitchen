import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';

type Db = Prisma.TransactionClient | typeof prisma;

// Online orders awaiting Razorpay payment hold a seat for this long; after that
// they stop counting even if the abandoned-order cleanup cron hasn't run yet.
const PAYMENT_HOLD_MINUTES = 15;

/**
 * Orders that occupy slot capacity: everything except cancelled / failed-payment
 * orders and stale unpaid online orders. Derived from the Order table on every
 * read so it can never drift out of sync the way a running counter can.
 */
function bookedOrderWhere(extra: Prisma.OrderWhereInput): Prisma.OrderWhereInput {
  const holdCutoff = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60 * 1000);
  return {
    ...extra,
    orderStatus: { notIn: ['CANCELLED', 'PAYMENT_FAILED'] },
    NOT: { orderStatus: 'PAYMENT_PENDING', createdAt: { lt: holdCutoff } },
  };
}

export async function countBookedOrders(db: Db, date: string, slotType: string): Promise<number> {
  return db.order.count({ where: bookedOrderWhere({ bookingDate: date, slotType }) });
}

/** Booked counts keyed by `${date}|${slotType}` for every slot on or after `fromDate`. */
export async function getBookedCountsFrom(fromDate: string): Promise<Map<string, number>> {
  const groups = await prisma.order.groupBy({
    by: ['bookingDate', 'slotType'],
    where: bookedOrderWhere({ bookingDate: { gte: fromDate } }),
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [`${g.bookingDate}|${g.slotType}`, g._count._all]));
}
