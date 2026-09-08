import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const prisma = new PrismaClient();

function getLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  console.log('Seeding Yazhisai Cloud Kitchen database...');

  // 1. Create Admin User (Using upsert so existing users remain untouched)
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      phone: '9876543210',
      name: 'Chef Yazhisai Admin',
      address: '12 Emerald Salai, Chennai',
    },
  });

  await prisma.admin.upsert({
    where: { email: 'admin@yazhisai.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@yazhisai.com',
      password: passwordHash,
    },
  });

  console.log('Admin account verified: admin@yazhisai.com / admin123');

  // 1b. Create Test DeliveryPartner (Using upsert so existing rider accounts remain untouched)
  const riderPasswordHash = await bcrypt.hash('rider123', 10);
  await prisma.deliveryPartner.upsert({
    where: { phone: '9999999999' },
    update: { password: riderPasswordHash },
    create: {
      name: 'Test Rider',
      phone: '9999999999',
      password: riderPasswordHash,
      isActive: true,
      isOnline: false,
    },
  });
  console.log('DeliveryPartner test account verified: 9999999999 / rider123');

  // 2. Generate 7-Day Dynamic Schedule starting TODAY (Preserve existing Admin toggles)
  const today = new Date();
  const dateList = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dateList.push({
      date: getLocalDateString(d),
      active: i !== 2 && i !== 5, // Default day off on 3rd and 6th day if new
    });
  }

  const slots = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
  const orderCutoffMap: Record<string, string> = {
    BREAKFAST: '06:00 AM',
    LUNCH: '11:00 AM',
    SNACKS: '03:30 PM',
    DINNER: '06:00 PM',
  };

  for (const d of dateList) {
    for (const slot of slots) {
      const isSlotActive = d.active;

      await prisma.slotsSchedule.upsert({
        where: {
          date_slotType: {
            date: d.date,
            slotType: slot,
          },
        },
        update: {}, // Keep existing slot status if already present in database
        create: {
          date: d.date,
          slotType: slot,
          isActive: isSlotActive,
          isAvailable: isSlotActive,
          maxOrders: 50,
          currentOrders: 0,
          cutoffTime: slot === 'BREAKFAST' ? '10:30 AM' : slot === 'LUNCH' ? '03:30 PM' : slot === 'SNACKS' ? '06:30 PM' : '10:00 PM',
          orderCutoffTime: orderCutoffMap[slot] || '06:00 AM',
        },
      });
    }
  }
  console.log('Granular schedule dates seeded.');

  // 3. Re-seed Signature Menu Items (Preserve existing items and availability toggles)
  const menuItems = [
    // BREAKFAST
    {
      name: 'Yazhisai Ghee Podi Mini Idli Combo',
      nameTamil: 'யாழிசை நெய் பொடி மினி இட்லி',
      description: '14 bite-sized button idlis tossed in pure cow ghee and aromatic spicy gunpowder (podi). Served with piping hot drumstick sambar & 3 homemade chutneys.',
      price: 140,
      slotCategory: 'BREAKFAST',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Rice, Urad Dal, Pure Cow Ghee, Gunpowder Podi, Coconut, Tomatoes',
      prepTimeMinutes: 15,
    },
    {
      name: 'Mysore Masala Dosa & Medu Vadai',
      nameTamil: 'மைசூர் மசாலா தோசை & வடை',
      description: 'Crispy golden crepe lined with spicy red chili garlic chutney, filled with potato masala. Served with crunchy Medu Vadai, Sambar & Coconut Chutney.',
      price: 130,
      slotCategory: 'BREAKFAST',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Fermented Batter, Potato, Red Chili Chutney, Curry Leaves, Mustard',
      prepTimeMinutes: 20,
    },
    {
      name: 'Organic Millet Ven Pongal & Vadai Set',
      nameTamil: 'திணை வெண் பொங்கல் & வடை',
      description: 'Nutritious Foxtail millet cooked with moong dal, black pepper, cumin, cashew nuts and generous cow ghee. Accompanied by crispy Vadai and Tomato Chutney.',
      price: 150,
      slotCategory: 'BREAKFAST',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Foxtail Millet, Moong Dal, Ghee, Cashews, Pepper, Cumin, Ginger',
      prepTimeMinutes: 15,
    },

    // SNACKS
    {
      name: 'Kumbakonam Degree Filter Coffee & Bajji Platter',
      nameTamil: 'டிகிரி காபி & பஜ்ஜி பிளேட்டர்',
      description: 'Hot foaming traditional South Indian filter coffee in chicory aroma served with an assortment of Onion, Potato and Green Chili Bajjis (6 pcs).',
      price: 90,
      slotCategory: 'SNACKS',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Pure Milk, Coffee Chicory Extract, Besan Flour, Onions, Green Chillies',
      prepTimeMinutes: 12,
    },
    {
      name: 'Chettinad Kara Paniyaram (8 Pcs)',
      nameTamil: 'காரக் குழிப் பணியாரம்',
      description: 'Golden crispy exterior and soft sponge interior paniyaram seasoned with mustard, curry leaves, onions & green chillies. Served with spicy Kara Chutney.',
      price: 110,
      slotCategory: 'SNACKS',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Rice Batter, Shallots, Mustard Seeds, Curry Leaves, Red Chutney',
      prepTimeMinutes: 15,
    },
    {
      name: 'Spicy Samosa & Masala Chai Combo',
      nameTamil: 'சமோசா & மசாலா டீ',
      description: '2 large Punjabi style potato cashew samosas served with mint-coriander chutney and 1 cup of hot brewed ginger cardamom tea.',
      price: 85,
      slotCategory: 'SNACKS',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Potatoes, Maida, Green Peas, Spices, Milk, Tea Leaves, Ginger',
      prepTimeMinutes: 10,
    },

    // LUNCH
    {
      name: 'Yazhisai Special Banana Leaf Meals',
      nameTamil: 'யாழிசை வாழை இலை விருந்து',
      description: 'Authentic grand feast served in eco-friendly banana leaf: Steamed Ponni Rice, Drumstick Sambar, Pepper Rasam, Kara Kuzhambu, Poriyal, Kootu, Appalam & Sweet Payasam.',
      price: 220,
      slotCategory: 'LUNCH',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Ponni Rice, Lentils, Fresh Vegetables, Tamarind, Spices, Ghee, Coconut',
      prepTimeMinutes: 25,
    },
    {
      name: 'Seeraga Samba Mutton Biryani',
      nameTamil: 'சீரக சம்பா ஆட்டுக்கறி பிரியாணி',
      description: 'Traditional Dindigul style Mutton Biryani cooked with fragrant Seeraga Samba rice, tender meat chunks, whole spices, onion raita & brinjal salna.',
      price: 340,
      slotCategory: 'LUNCH',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Seeraga Samba Rice, Tender Mutton, Cow Ghee, Mint, Curd, Whole Spices',
      prepTimeMinutes: 30,
    },
    {
      name: 'Thalappakatti Chicken Biryani & Egg',
      nameTamil: 'தலப்பாக்கட்டி சிக்கன் பிரியாணி',
      description: 'Aromatic woodfire-style chicken biryani packed with herbs & tender chicken pieces, hard boiled egg, spicy chicken gravy & chilled onion pachadi.',
      price: 280,
      slotCategory: 'LUNCH',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Basmati Rice, Farm Chicken, Boiled Egg, Yogurt, Mint, Coriander, Spices',
      prepTimeMinutes: 25,
    },

    // DINNER
    {
      name: 'Madurai Bun Parotta & Spicy Chicken Salna',
      nameTamil: 'மதுரை பன் பரோட்டா & சிக்கன் சால்னா',
      description: '3 multi-layered thick fluffy Madurai style Bun Parottas golden-fried to perfection, paired with rich aromatic spicy chicken salna gravy.',
      price: 180,
      slotCategory: 'DINNER',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Maida, Oil, Milk, Chicken Gravy, Fennel, Whole Spices',
      prepTimeMinutes: 20,
    },
    {
      name: 'Ceylon Street Egg Kothu Parotta',
      nameTamil: 'சிலோன் முட்டை கொத்து பரோட்டா',
      description: 'Flaky parottas shredded on hot iron tava with double eggs, crunchy onions, curry leaves, green chillies and spicy salna sauce.',
      price: 160,
      slotCategory: 'DINNER',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Parotta, Farm Eggs, Shallots, Chillies, Salna Gravy, Pepper',
      prepTimeMinutes: 15,
    },
    {
      name: 'Ghee Onion Podi Uthappam & Chutney Trio',
      nameTamil: 'நெய் வெங்காயப் பொடி ஊத்தப்பம்',
      description: '2 thick soft uthappams heavily topped with caramelized onions, coriander, spicy podi powder and drizzled with melted cow ghee.',
      price: 140,
      slotCategory: 'DINNER',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
      ingredients: 'Fermented Batter, Shallots, Ghee, Podi Powder, Tomato Chutney',
      prepTimeMinutes: 15,
    },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: {
        name: item.name,
        slotCategory: item.slotCategory,
      },
    });

    if (!existing) {
      await prisma.menuItem.create({
        data: item,
      });
    }
  }

  console.log('Yazhisai menu items seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
