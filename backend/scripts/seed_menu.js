const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../Config/db');

const Category = require('../Models/Category');
const Item = require('../Models/Item');
const ModifierGroup = require('../Models/ModifierGroup');
const Combo = require('../Models/Combo');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Category.deleteMany({});
    await Item.deleteMany({});
    await ModifierGroup.deleteMany({});
    await Combo.deleteMany({});

    console.log('Seeding Categories...');
    const categoriesData = [
      { name: 'Appetizers', image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=800', description: 'Start your meal with these tasty treats' },
      { name: 'Main Course', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800', description: 'Hearty and delicious entrees' },
      { name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?auto=format&fit=crop&q=80&w=800', description: 'Refreshing drinks' },
      { name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800', description: 'Sweet endings' },
      { name: 'Pizzas', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', description: 'Authentic Italian style pizzas' },
      { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', description: 'Juicy burgers with fresh ingredients' },
      { name: 'Salads', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', description: 'Fresh and healthy greens' },
      { name: 'Pasta', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=800', description: 'Classic pasta dishes' },
      { name: 'Seafood', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800', description: 'Fresh from the ocean' },
      { name: 'Sides', image: 'https://images.unsplash.com/photo-1573082883907-809da0ad314d?auto=format&fit=crop&q=80&w=800', description: 'Perfect accompaniments' },
      { name: 'Breakfast', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=800', description: 'Start your day right' },
      { name: 'Sandwiches', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800', description: 'Quick and tasty' },
      { name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800', description: 'Exquisite Japanese sushi' },
      { name: 'Steaks', image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?auto=format&fit=crop&q=80&w=800', description: 'Premium cuts of meat' },
      { name: 'Soups', image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800', description: 'Warm and comforting' }
    ];
    const categories = await Category.insertMany(categoriesData);

    console.log('Seeding Modifier Groups...');
    const modifierGroupsData = [
      {
        name: 'Extra Toppings',
        selectionType: 'Multiple',
        options: [
          { name: 'Cheese', price: 20 },
          { name: 'Olives', price: 15 },
          { name: 'Mushrooms', price: 25 }
        ]
      },
      {
        name: 'Size',
        selectionType: 'Single',
        isRequired: true,
        options: [
          { name: 'Regular', price: 0, isDefault: true },
          { name: 'Large', price: 50 }
        ]
      },
      {
        name: 'Spice Level',
        selectionType: 'Single',
        options: [
          { name: 'Mild', price: 0, isDefault: true },
          { name: 'Medium', price: 0 },
          { name: 'Hot', price: 0 }
        ]
      },
      {
        name: 'Drink Size',
        selectionType: 'Single',
        options: [
          { name: 'Small', price: 0, isDefault: true },
          { name: 'Medium', price: 20 },
          { name: 'Large', price: 40 }
        ]
      },
      {
        name: 'Extra Sauce',
        selectionType: 'Multiple',
        options: [
          { name: 'Mayo', price: 10 },
          { name: 'Ketchup', price: 5 },
          { name: 'Barbecue', price: 15 }
        ]
      },
      {
        name: 'Bread Type',
        selectionType: 'Single',
        options: [
          { name: 'White', price: 0, isDefault: true },
          { name: 'Whole Wheat', price: 10 },
          { name: 'Gluten Free', price: 30 }
        ]
      },
      {
        name: 'Add-ons',
        selectionType: 'Multiple',
        options: [
          { name: 'Avocado', price: 40 },
          { name: 'Bacon', price: 50 },
          { name: 'Egg', price: 20 }
        ]
      },
      {
        name: 'Milk Choice',
        selectionType: 'Single',
        options: [
          { name: 'Full Cream', price: 0, isDefault: true },
          { name: 'Soy', price: 20 },
          { name: 'Almond', price: 30 }
        ]
      },
      {
        name: 'Sweetness',
        selectionType: 'Single',
        options: [
          { name: 'Normal', price: 0, isDefault: true },
          { name: 'Less Sugar', price: 0 },
          { name: 'No Sugar', price: 0 }
        ]
      },
      {
        name: 'Salad Dressing',
        selectionType: 'Single',
        options: [
          { name: 'Caesar', price: 0 },
          { name: 'Vinaigrette', price: 0 },
          { name: 'Ranch', price: 0 }
        ]
      }
    ];
    const modifierGroups = await ModifierGroup.insertMany(modifierGroupsData);

    console.log('Seeding Items...');
    const itemsData = [
      {
        name: 'Margherita Pizza',
        category: categories.find(c => c.name === 'Pizzas')._id,
        basePrice: 250,
        originalPrice: 299,
        foodType: 'Veg',
        modifiers: [modifierGroups[0]._id, modifierGroups[1]._id],
        description: 'Classic tomato and mozzarella',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800',
        sku: 'PIZ-MARG-001',
        preparationTime: 15
      },
      {
        name: 'Cheeseburger',
        category: categories.find(c => c.name === 'Burgers')._id,
        basePrice: 180,
        originalPrice: 220,
        foodType: 'Non-Veg',
        modifiers: [modifierGroups[4]._id, modifierGroups[6]._id],
        description: 'Juicy beef patty with extra cheese',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
        sku: 'BRG-CHSE-001',
        preparationTime: 12
      },
      {
        name: 'Pasta Carbonara',
        category: categories.find(c => c.name === 'Pasta')._id,
        basePrice: 320,
        originalPrice: 380,
        foodType: 'Non-Veg',
        description: 'Creamy pasta with bacon',
        image: 'https://images.unsplash.com/photo-1612450844944-1b3ca8a996a1?auto=format&fit=crop&q=80&w=800',
        sku: 'PST-CARB-001',
        preparationTime: 20
      },
      {
        name: 'Coke',
        category: categories.find(c => c.name === 'Beverages')._id,
        basePrice: 40,
        originalPrice: 45,
        foodType: 'Veg',
        modifiers: [modifierGroups[3]._id],
        description: 'Chilled soft drink',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
        sku: 'BEV-COKE-001',
        preparationTime: 2
      },
      {
        name: 'French Fries',
        category: categories.find(c => c.name === 'Sides')._id,
        basePrice: 100,
        originalPrice: 120,
        foodType: 'Veg',
        modifiers: [modifierGroups[4]._id],
        description: 'Crispy golden fries',
        image: 'https://images.unsplash.com/photo-1573082883907-809da0ad314d?auto=format&fit=crop&q=80&w=800',
        sku: 'SID-FRIE-001',
        preparationTime: 8
      },
      {
        name: 'Chocolate Lava Cake',
        category: categories.find(c => c.name === 'Desserts')._id,
        basePrice: 150,
        originalPrice: 180,
        foodType: 'Veg',
        description: 'Warm cake with gooey center',
        image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800',
        sku: 'DES-LAVA-001',
        preparationTime: 10
      },
      {
        name: 'Greek Salad',
        category: categories.find(c => c.name === 'Salads')._id,
        basePrice: 220,
        originalPrice: 260,
        foodType: 'Veg',
        modifiers: [modifierGroups[9]._id],
        description: 'Fresh vegetables with feta cheese',
        image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800',
        sku: 'SAL-GREK-001',
        preparationTime: 7
      },
      {
        name: 'Salmon Nigiri',
        category: categories.find(c => c.name === 'Sushi')._id,
        basePrice: 400,
        originalPrice: 450,
        foodType: 'Non-Veg',
        description: 'Fresh salmon on rice',
        image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&q=80&w=800',
        sku: 'SUS-SALM-001',
        preparationTime: 15
      },
      {
        name: 'Club Sandwich',
        category: categories.find(c => c.name === 'Sandwiches')._id,
        basePrice: 200,
        originalPrice: 240,
        foodType: 'Non-Veg',
        modifiers: [modifierGroups[5]._id],
        description: 'Triple layer sandwich',
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800',
        sku: 'SND-CLUB-001',
        preparationTime: 12
      },
      {
        name: 'T-Bone Steak',
        category: categories.find(c => c.name === 'Steaks')._id,
        basePrice: 850,
        originalPrice: 999,
        foodType: 'Non-Veg',
        description: 'Premium cut steak',
        image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?auto=format&fit=crop&q=80&w=800',
        sku: 'STK-TBON-001',
        preparationTime: 25
      },
      {
        name: 'Cappuccino',
        category: categories.find(c => c.name === 'Beverages')._id,
        basePrice: 120,
        originalPrice: 150,
        foodType: 'Veg',
        modifiers: [modifierGroups[7]._id, modifierGroups[8]._id],
        description: 'Hot coffee with foam',
        image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=800',
        sku: 'BEV-CAPU-001',
        preparationTime: 5
      },
      {
        name: 'Tomato Soup',
        category: categories.find(c => c.name === 'Soups')._id,
        basePrice: 130,
        originalPrice: 160,
        foodType: 'Veg',
        description: 'Rich and creamy tomato soup',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800',
        sku: 'SOP-TOMA-001',
        preparationTime: 10
      },
      {
        name: 'Pancakes',
        category: categories.find(c => c.name === 'Breakfast')._id,
        basePrice: 180,
        originalPrice: 220,
        foodType: 'Veg',
        description: 'Fluffy pancakes with syrup',
        image: 'https://images.unsplash.com/photo-1528207772081-da120488f2be?auto=format&fit=crop&q=80&w=800',
        sku: 'BKF-PANC-001',
        preparationTime: 12
      },
      {
        name: 'Chicken Wings',
        category: categories.find(c => c.name === 'Appetizers')._id,
        basePrice: 280,
        originalPrice: 350,
        foodType: 'Non-Veg',
        modifiers: [modifierGroups[2]._id],
        description: 'Spicy buffalo wings',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800',
        sku: 'APP-WING-001',
        preparationTime: 15
      },
      {
        name: 'Garlic Bread',
        category: categories.find(c => c.name === 'Sides')._id,
        basePrice: 90,
        originalPrice: 110,
        foodType: 'Veg',
        description: 'Toasted bread with garlic butter',
        image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=800',
        sku: 'SID-GARL-001',
        preparationTime: 5
      },
      {
        name: 'Iced Tea',
        category: categories.find(c => c.name === 'Beverages')._id,
        basePrice: 60,
        originalPrice: 80,
        foodType: 'Veg',
        modifiers: [modifierGroups[8]._id],
        description: 'Refreshing peach iced tea',
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800',
        sku: 'BEV-ICE-001',
        preparationTime: 3
      },
      {
        name: 'Veggie Burger',
        category: categories.find(c => c.name === 'Burgers')._id,
        basePrice: 160,
        originalPrice: 200,
        foodType: 'Veg',
        modifiers: [modifierGroups[4]._id],
        description: 'Plant-based patty burger',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        sku: 'BRG-VEGG-001',
        preparationTime: 12
      },
      {
        name: 'Fish & Chips',
        category: categories.find(c => c.name === 'Seafood')._id,
        basePrice: 350,
        originalPrice: 420,
        foodType: 'Non-Veg',
        description: 'Battered fish with fries',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800',
        sku: 'SEA-FISH-001',
        preparationTime: 18
      },
      {
        name: 'Caesar Salad',
        category: categories.find(c => c.name === 'Salads')._id,
        basePrice: 240,
        originalPrice: 280,
        foodType: 'Veg',
        modifiers: [modifierGroups[9]._id],
        description: 'Classic Caesar salad',
        image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800',
        sku: 'SAL-CAES-001',
        preparationTime: 10
      },
      {
        name: 'California Roll',
        category: categories.find(c => c.name === 'Sushi')._id,
        basePrice: 380,
        originalPrice: 450,
        foodType: 'Non-Veg',
        description: 'Crab and avocado roll',
        image: 'https://images.unsplash.com/photo-1559466273-d95e72debaf8?auto=format&fit=crop&q=80&w=800',
        sku: 'SUS-CALI-001',
        preparationTime: 15
      }
    ];
    const items = await Item.insertMany(itemsData);

    console.log('Seeding Combos...');
    const combosData = [
      {
        name: 'Burger & Fries Combo',
        description: 'Classic Cheeseburger with a side of fries',
        price: 250,
        originalPrice: 280,
        image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Cheeseburger')._id, quantity: 1 },
          { item: items.find(i => i.name === 'French Fries')._id, quantity: 1 }
        ]
      },
      {
        name: 'Pizza Party Pack',
        description: '2 Margherita Pizzas and 1 Large Coke',
        price: 550,
        originalPrice: 650,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Margherita Pizza')._id, quantity: 2 },
          { item: items.find(i => i.name === 'Coke')._id, quantity: 1 }
        ]
      },
      {
        name: 'Healthy Lunch',
        description: 'Greek Salad and Iced Tea',
        price: 260,
        originalPrice: 300,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Greek Salad')._id, quantity: 1 },
          { item: items.find(i => i.name === 'Iced Tea')._id, quantity: 1 }
        ]
      },
      {
        name: 'Breakfast Special',
        description: 'Pancakes and Cappuccino',
        price: 280,
        originalPrice: 320,
        image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Pancakes')._id, quantity: 1 },
          { item: items.find(i => i.name === 'Cappuccino')._id, quantity: 1 }
        ]
      },
      {
        name: 'Sushi Platter',
        description: 'Salmon Nigiri and California Roll',
        price: 700,
        originalPrice: 850,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Salmon Nigiri')._id, quantity: 1 },
          { item: items.find(i => i.name === 'California Roll')._id, quantity: 1 }
        ]
      },
      {
        name: 'Dinner for Two',
        description: '2 Pasta Carbonara and 2 Chocolate Lava Cakes',
        price: 850,
        originalPrice: 1000,
        image: 'https://images.unsplash.com/photo-1612450844944-1b3ca8a996a1?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Pasta Carbonara')._id, quantity: 2 },
          { item: items.find(i => i.name === 'Chocolate Lava Cake')._id, quantity: 2 }
        ]
      },
      {
        name: 'Steak & Soup Night',
        description: 'T-Bone Steak and Tomato Soup',
        price: 900,
        originalPrice: 1100,
        image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'T-Bone Steak')._id, quantity: 1 },
          { item: items.find(i => i.name === 'Tomato Soup')._id, quantity: 1 }
        ]
      },
      {
        name: 'Wings & Beer (Soda)',
        description: 'Chicken Wings and 2 Cokes',
        price: 350,
        originalPrice: 420,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Chicken Wings')._id, quantity: 1 },
          { item: items.find(i => i.name === 'Coke')._id, quantity: 2 }
        ]
      },
      {
        name: 'Veggie Delight Combo',
        description: 'Veggie Burger and Greek Salad',
        price: 350,
        originalPrice: 400,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Veggie Burger')._id, quantity: 1 },
          { item: items.find(i => i.name === 'Greek Salad')._id, quantity: 1 }
        ]
      },
      {
        name: 'Quick Snack',
        description: 'Club Sandwich and French Fries',
        price: 280,
        originalPrice: 340,
        image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=800',
        items: [
          { item: items.find(i => i.name === 'Club Sandwich')._id, quantity: 1 },
          { item: items.find(i => i.name === 'French Fries')._id, quantity: 1 }
        ]
      }
    ];
    await Combo.insertMany(combosData);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
