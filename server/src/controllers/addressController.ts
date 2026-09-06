import { Request, Response } from 'express';
import { prisma } from '../config/db';

// Helper to find user by phone
async function getUserByPhone(phone: string) {
  if (!phone) return null;
  const cleanPhone = String(phone).trim();
  return prisma.user.findUnique({
    where: { phone: cleanPhone },
  });
}

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const phone = (req.query.phone as string) || (req.body?.phone as string);
    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.json({ success: true, addresses: [] });
    }

    let addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Backward compatibility auto-migration:
    // If no Address rows exist but user has an existing single address string, migrate it to an Address row
    if (addresses.length === 0 && user.address && user.address.trim()) {
      const migrated = await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Default Address',
          fullAddress: user.address.trim(),
          isDefault: true,
        },
      });
      addresses = [migrated];
    }

    return res.json({
      success: true,
      addresses,
    });
  } catch (error: any) {
    console.error('❌ Error fetching addresses:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch addresses' });
  }
};

export const createAddress = async (req: Request, res: Response) => {
  try {
    const { phone, label, fullAddress, latitude, longitude, isDefault } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }
    if (!fullAddress || !fullAddress.trim()) {
      return res.status(400).json({ error: 'Full address text is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const existingAddressesCount = await prisma.address.count({
      where: { userId: user.id },
    });

    const setAsDefault = isDefault || existingAddressesCount === 0;

    if (setAsDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        label: label ? String(label).trim() : 'Home',
        fullAddress: String(fullAddress).trim(),
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        isDefault: setAsDefault,
      },
    });

    if (setAsDefault) {
      await prisma.user.update({
        where: { id: user.id },
        data: { address: newAddress.fullAddress },
      });
    }

    console.log('✅ Created new address for user:', user.phone, newAddress);

    return res.json({
      success: true,
      address: newAddress,
    });
  } catch (error: any) {
    console.error('❌ Error creating address:', error);
    return res.status(500).json({ error: error.message || 'Failed to create address' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone, label, fullAddress, latitude, longitude, isDefault } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }
    if (!fullAddress || !fullAddress.trim()) {
      return res.status(400).json({ error: 'Full address text is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    // Verify address belongs to requesting user
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        label: label ? String(label).trim() : existing.label,
        fullAddress: String(fullAddress).trim(),
        latitude: latitude != null ? Number(latitude) : existing.latitude,
        longitude: longitude != null ? Number(longitude) : existing.longitude,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault,
      },
    });

    if (updated.isDefault) {
      await prisma.user.update({
        where: { id: user.id },
        data: { address: updated.fullAddress },
      });
    }

    console.log('✅ Updated address:', updated.id);

    return res.json({
      success: true,
      address: updated,
    });
  } catch (error: any) {
    console.error('❌ Error updating address:', error);
    return res.status(500).json({ error: error.message || 'Failed to update address' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const phone = (req.query.phone as string) || (req.body?.phone as string);

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    // Verify address belongs to requesting user
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }

    const wasDefault = existing.isDefault;

    await prisma.address.delete({
      where: { id },
    });

    if (wasDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { address: nextDefault.fullAddress },
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { address: '' },
        });
      }
    }

    console.log('✅ Deleted address:', id);

    return res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting address:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete address' });
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    // Verify address belongs to requesting user
    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Address not found or unauthorized' });
    }

    // Unset all default addresses for user
    await prisma.address.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { address: updated.fullAddress },
    });

    console.log('✅ Set default address for user:', user.phone, updated.id);

    return res.json({
      success: true,
      address: updated,
    });
  } catch (error: any) {
    console.error('❌ Error setting default address:', error);
    return res.status(500).json({ error: error.message || 'Failed to set default address' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Customer phone number is required' });
    }

    const user = await getUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ? String(name).trim() : user.name,
      },
    });

    return res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};
