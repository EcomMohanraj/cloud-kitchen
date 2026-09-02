import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminFromRequest } from '@/lib/auth';
import { menuItemSchema } from '@/lib/validators';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slotCategory = searchParams.get('slot');
    const includeInactive = searchParams.get('all') === 'true';

    const whereClause: any = {};
    if (slotCategory) {
      whereClause.slotCategory = slotCategory;
    }
    if (!includeInactive) {
      whereClause.isAvailable = true;
    }

    const items = await prisma.menuItem.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const validated = menuItemSchema.parse(body);

    const newItem = await prisma.menuItem.create({
      data: validated,
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create menu item' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }

    const updated = await prisma.menuItem.update({
      where: { id: String(id) },
      data,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update menu item' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }

    await prisma.menuItem.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete menu item' }, { status: 400 });
  }
}
