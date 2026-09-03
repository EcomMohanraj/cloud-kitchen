-- ============================================================================
-- YAZHISAI CLOUD KITCHEN - INITIAL DATABASE SEED DATA
-- Default Slots, Sample Dishes Catalog, and Kitchen Settings
-- ============================================================================

-- 1. Initial Kitchen Settings
INSERT INTO public.kitchen_settings (id, is_chef_online, kitchen_status, announcement)
VALUES (1, true, 'OPEN', 'Chef Yazhisai is active & accepting fresh pre-orders!')
ON CONFLICT (id) DO UPDATE SET is_chef_online = true, kitchen_status = 'OPEN';

-- 2. Default South Indian Menu Catalog (16 Authentic Dishes)
INSERT INTO public.menu_items (id, name, tamil_name, description, price, category_slot, is_veg, image_url, prep_time_minutes, is_active) VALUES
-- BREAKFAST
('b1000000-0000-0000-0000-000000000001', 'Chettinad Idli Platter', 'செட்டிநாடு இட்லி பிளேட்டர்', '4 Soft steaming Malligai Idlis served with 3 traditional chutneys & homemade sambar.', 80.00, 'BREAKFAST', true, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 15, true),
('b1000000-0000-0000-0000-000000000002', 'Crispy Ghee Podi Roast Dosa', 'நெய் பொடி தோசை', 'Golden crispy rice crepe sprinkled with hand-ground spicy podi and pure cow ghee.', 110.00, 'BREAKFAST', true, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80', 20, true),
('b1000000-0000-0000-0000-000000000003', 'Medhu Vada Platter (2 Pcs)', 'மெது வடை பிளேட்டர்', 'Crispy golden lentil fritters spiced with black pepper, ginger, and green chillies.', 50.00, 'BREAKFAST', true, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80', 10, true),
('b1000000-0000-0000-0000-000000000004', 'Traditional Rava Kichadi', 'ரவா கிச்சடி', 'Semolina cooked with fresh vegetables, cashews, mustard seeds, and pure ghee.', 75.00, 'BREAKFAST', true, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&auto=format&fit=crop&q=80', 15, true),

-- SNACKS
('s1000000-0000-0000-0000-000000000001', 'Madurai Kara Murukku & Filter Coffee', 'கார முறுக்கு & டிகிரி காபி', 'Crunchy rice flour spiraled savouries paired with aromatic Kumbakonam filter coffee.', 90.00, 'SNACKS', true, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 10, true),
('s1000000-0000-0000-0000-000000000002', 'Hot Onion Bajji with Mint Chutney (4 Pcs)', 'வெங்காய பஜ்ஜி', 'Deep-fried golden gram flour batter coated onion rings served scalding hot.', 60.00, 'SNACKS', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 12, true),
('s1000000-0000-0000-0000-000000000003', 'Sundal Special (Navadhanya)', 'நவதானிய சுண்டல்', 'Boiled legume salad tossed with grated coconut, mustard, curry leaves, and asafoetida.', 55.00, 'SNACKS', true, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80', 5, true),
('s1000000-0000-0000-0000-000000000004', 'Kuzhi Paniyaram (Sweet & Spicy 6 Pcs)', 'குழி பணியாரம்', 'Crispy outside, soft inside fermented rice dumplings cooked in traditional iron cookware.', 85.00, 'SNACKS', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 15, true),

-- LUNCH
('l1000000-0000-0000-0000-000000000001', 'Yazhisai Royal Banana Leaf Meals', 'யாழிசை வாழை இலை விருந்து', 'Traditional feast: Seeraga Samba rice, Sambar, Vatha Kuzhambu, Rasam, Curd, Appalam, Kootu, Poriyal, Payasam.', 160.00, 'LUNCH', true, 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80', 25, true),
('l1000000-0000-0000-0000-000000000002', 'Seeraga Samba Mushroom Biryani', 'காளான் பிரியாணி', 'Fragrant short-grain rice cooked with button mushrooms, aromatic spices, and coconut milk.', 180.00, 'LUNCH', true, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80', 30, true),
('l1000000-0000-0000-0000-000000000003', 'Madurai Style Curd Rice Special', 'தயிர் சாதம்', 'Creamy seasoned rice tempered with mustard, pomegranate, ginger, green chillies & mango pickle.', 90.00, 'LUNCH', true, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80', 10, true),
('l1000000-0000-0000-0000-000000000004', 'Tanjore Sambar Rice & Potato Roast', 'சாம்பார் சாதம் & உருளை வறுவல்', 'Piping hot lentil rice cooked with vegetables and ghee, served with spicy crisp potato fry.', 120.00, 'LUNCH', true, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', 20, true),

-- DINNER
('d1000000-0000-0000-0000-000000000001', 'Soft Ceylon Parotta with Veg Kurma (2 Pcs)', 'சிலோன் பரோட்டா & குருமா', 'Flaky multi-layered hand-tossed flatbread served with aromatic coconut veg kurma.', 120.00, 'DINNER', true, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80', 20, true),
('d1000000-0000-0000-0000-000000000002', 'Kothu Parotta (Vegetable Special)', 'வெஜிடபிள் கொத்து பரோட்டா', 'Shredded Ceylon parotta tossed on hot iron griddle with onions, capsicum, and homemade curry gravy.', 140.00, 'DINNER', true, 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&auto=format&fit=crop&q=80', 25, true),
('d1000000-0000-0000-0000-000000000003', 'Idiyappam with Coconut Milk (4 Pcs)', 'இடியாப்பம் & தேங்காய் பால்', 'Soft steamed rice string hoppers served with cardamom scented sweet coconut milk.', 100.00, 'DINNER', true, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 15, true),
('d1000000-0000-0000-0000-000000000004', 'Special Chappathi Platter with Paneer Butter Masala', 'சப்பாத்தி & பன்னீர் மசாலா', 'Whole wheat chappathis paired with cottage cheese simmered in rich tomato butter gravy.', 130.00, 'DINNER', true, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80', 20, true)
ON CONFLICT (id) DO NOTHING;
