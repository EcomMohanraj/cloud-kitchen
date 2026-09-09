import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getDeliveryFee = async (req: Request, res: Response) => {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'defaultDeliveryFee' },
    });

    const fee = setting ? parseFloat(setting.value) : 40;

    return res.json({ defaultDeliveryFee: isNaN(fee) ? 40 : fee });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch delivery fee setting' });
  }
};

export const updateDeliveryFee = async (req: Request, res: Response) => {
  try {
    const { defaultDeliveryFee } = req.body;

    if (defaultDeliveryFee === undefined || defaultDeliveryFee === null || isNaN(Number(defaultDeliveryFee))) {
      return res.status(400).json({ error: 'Valid defaultDeliveryFee numeric value is required' });
    }

    const feeNum = Math.max(0, Number(defaultDeliveryFee));

    const updated = await prisma.settings.upsert({
      where: { key: 'defaultDeliveryFee' },
      update: { value: String(feeNum) },
      create: { key: 'defaultDeliveryFee', value: String(feeNum) },
    });

    return res.json({
      success: true,
      defaultDeliveryFee: parseFloat(updated.value),
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Failed to update delivery fee setting' });
  }
};
