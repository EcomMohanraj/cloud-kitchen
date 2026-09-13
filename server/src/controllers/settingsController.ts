import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getStoreSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['defaultDeliveryFee', 'enableDeliveryFee', 'defaultPackingFee', 'enablePackingFee', 'minOrderValue'],
        },
      },
    });

    const map = new Map(settings.map((s) => [s.key, s.value]));

    const defaultDeliveryFee = map.has('defaultDeliveryFee') ? parseFloat(map.get('defaultDeliveryFee')!) : 40;
    const enableDeliveryFee = map.has('enableDeliveryFee') ? map.get('enableDeliveryFee') === 'true' : true;
    const defaultPackingFee = map.has('defaultPackingFee') ? parseFloat(map.get('defaultPackingFee')!) : 15;
    const enablePackingFee = map.has('enablePackingFee') ? map.get('enablePackingFee') === 'true' : true;
    const minOrderValue = map.has('minOrderValue') ? parseFloat(map.get('minOrderValue')!) : 100;

    return res.json({
      defaultDeliveryFee: isNaN(defaultDeliveryFee) ? 40 : defaultDeliveryFee,
      enableDeliveryFee,
      defaultPackingFee: isNaN(defaultPackingFee) ? 15 : defaultPackingFee,
      enablePackingFee,
      minOrderValue: isNaN(minOrderValue) ? 100 : minOrderValue,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch store settings' });
  }
};

export const updateStoreSettings = async (req: Request, res: Response) => {
  try {
    const { defaultDeliveryFee, enableDeliveryFee, defaultPackingFee, enablePackingFee, minOrderValue } = req.body;

    const updates: Promise<any>[] = [];

    if (defaultDeliveryFee !== undefined && !isNaN(Number(defaultDeliveryFee))) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'defaultDeliveryFee' },
          update: { value: String(Math.max(0, Number(defaultDeliveryFee))) },
          create: { key: 'defaultDeliveryFee', value: String(Math.max(0, Number(defaultDeliveryFee))) },
        })
      );
    }

    if (enableDeliveryFee !== undefined) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'enableDeliveryFee' },
          update: { value: String(Boolean(enableDeliveryFee)) },
          create: { key: 'enableDeliveryFee', value: String(Boolean(enableDeliveryFee)) },
        })
      );
    }

    if (defaultPackingFee !== undefined && !isNaN(Number(defaultPackingFee))) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'defaultPackingFee' },
          update: { value: String(Math.max(0, Number(defaultPackingFee))) },
          create: { key: 'defaultPackingFee', value: String(Math.max(0, Number(defaultPackingFee))) },
        })
      );
    }

    if (enablePackingFee !== undefined) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'enablePackingFee' },
          update: { value: String(Boolean(enablePackingFee)) },
          create: { key: 'enablePackingFee', value: String(Boolean(enablePackingFee)) },
        })
      );
    }

    if (minOrderValue !== undefined && !isNaN(Number(minOrderValue))) {
      updates.push(
        prisma.settings.upsert({
          where: { key: 'minOrderValue' },
          update: { value: String(Math.max(0, Number(minOrderValue))) },
          create: { key: 'minOrderValue', value: String(Math.max(0, Number(minOrderValue))) },
        })
      );
    }

    await Promise.all(updates);

    return getStoreSettings(req, res);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update store settings' });
  }
};
