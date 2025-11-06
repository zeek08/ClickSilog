export function seedMemoryDb(memoryDb) {
  if (!memoryDb) return;
  const now = new Date().toISOString();

  const categories = [
    { id: 'silog_meals', name: 'Silog Meals', description: 'Traditional Filipino silog meals with garlic rice and egg', active: true, sortOrder: 1, createdAt: now },
    { id: 'snacks', name: 'Snacks', description: 'Quick bites and appetizers', active: true, sortOrder: 2, createdAt: now },
    { id: 'drinks', name: 'Drinks & Beverages', description: 'Refreshments and beverages', active: true, sortOrder: 3, createdAt: now }
  ];

  const silog = [
    { id: 'tapsilog_001', name: 'Tapsilog', categoryId: 'silog_meals', price: 75, available: true, description: 'Beef tapa with garlic rice and fried egg', ingredients: ['Beef', 'Garlic Rice', 'Egg', 'Marinade'], preparationTime: 15, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'bangsilog_002', name: 'Bangsilog', categoryId: 'silog_meals', price: 69, available: true, description: 'Bangus with garlic rice and fried egg', ingredients: ['Bangus', 'Garlic Rice', 'Egg'], preparationTime: 12, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'porksilog_003', name: 'Porkchopsilog', categoryId: 'silog_meals', price: 69, available: true, description: 'Pork chop with garlic rice and fried egg', ingredients: ['Pork Chop', 'Garlic Rice', 'Egg'], preparationTime: 15, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'tocilog_004', name: 'Tocilog', categoryId: 'silog_meals', price: 65, available: true, description: 'Tocino with garlic rice and fried egg', ingredients: ['Pork Tocino', 'Garlic Rice', 'Egg'], preparationTime: 10, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'chicksilog_005', name: 'Chicksilog', categoryId: 'silog_meals', price: 69, available: true, description: 'Chicken with garlic rice and fried egg', ingredients: ['Chicken', 'Garlic Rice', 'Egg'], preparationTime: 12, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'baconsilog_006', name: 'Baconsilog', categoryId: 'silog_meals', price: 65, available: true, description: 'Bacon with garlic rice and fried egg', ingredients: ['Bacon', 'Garlic Rice', 'Egg'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'lechonsilog_007', name: 'Lechonsilog', categoryId: 'silog_meals', price: 69, available: true, description: 'Lechon kawali with garlic rice and fried egg', ingredients: ['Lechon Kawali', 'Garlic Rice', 'Egg'], preparationTime: 10, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'bbq_rice_008', name: 'BBQ with Rice', categoryId: 'silog_meals', price: 60, available: true, description: 'Pork barbecue with rice', ingredients: ['Pork BBQ', 'Rice'], preparationTime: 12, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'shanghai_silog_009', name: 'Shanghai Silog', categoryId: 'silog_meals', price: 55, available: true, description: 'Pork spring rolls with garlic rice and fried egg', ingredients: ['Pork Shanghai', 'Garlic Rice', 'Egg'], preparationTime: 10, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'hungarian_010', name: 'Hungarian Silog', categoryId: 'silog_meals', price: 70, available: true, description: 'Hungarian sausage with garlic rice and fried egg', ingredients: ['Hungarian Sausage', 'Garlic Rice', 'Egg'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'embosilog_011', name: 'Embosilog', categoryId: 'silog_meals', price: 55, available: true, description: 'Embutido with garlic rice and fried egg', ingredients: ['Embutido', 'Garlic Rice', 'Egg'], preparationTime: 10, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'hotsilog_012', name: 'Hotsilog', categoryId: 'silog_meals', price: 40, available: true, description: 'Hotdog with garlic rice and fried egg', ingredients: ['Hotdog', 'Garlic Rice', 'Egg'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'longsilog_013', name: 'Longsilog', categoryId: 'silog_meals', price: 55, available: true, description: 'Longganisa with garlic rice and fried egg', ingredients: ['Longganisa', 'Garlic Rice', 'Egg'], preparationTime: 10, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'hamsilog_014', name: 'Hamsilog', categoryId: 'silog_meals', price: 40, available: true, description: 'Ham with garlic rice and fried egg', ingredients: ['Ham', 'Garlic Rice', 'Egg'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'spamsilog_015', name: 'Spamsilog', categoryId: 'silog_meals', price: 50, available: true, description: 'Spam with garlic rice and fried egg', ingredients: ['Spam', 'Garlic Rice', 'Egg'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now }
  ];

  const snacks = [
    { id: 'fries_cup_016', name: 'Fries in a Cup', categoryId: 'snacks', price: 50, available: true, description: 'French fries served in a cup', ingredients: ['Potato Fries'], preparationTime: 5, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'nachos_017', name: 'Nachos', categoryId: 'snacks', price: 50, available: true, description: 'Crispy tortilla chips with cheese', ingredients: ['Tortilla Chips', 'Cheese'], preparationTime: 5, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'cheese_sticks_018', name: 'Cheese Sticks', categoryId: 'snacks', price: 50, available: true, description: 'Breaded mozzarella cheese sticks', ingredients: ['Mozzarella Cheese', 'Bread Crumbs'], preparationTime: 8, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'corndog_classic_019', name: 'Classic Corndog', categoryId: 'snacks', price: 60, available: true, description: 'Classic hotdog coated in cornmeal batter', ingredients: ['Hotdog', 'Cornmeal Batter'], preparationTime: 7, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'corndog_cheddar_020', name: 'Cheddar Corndog', categoryId: 'snacks', price: 60, available: true, description: 'Hotdog with cheddar cheese coating', ingredients: ['Hotdog', 'Cheddar Cheese', 'Cornmeal Batter'], preparationTime: 7, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'corndog_classic_mozza_021', name: 'Classic Mozza Corndog', categoryId: 'snacks', price: 70, available: true, description: 'Classic corndog with mozzarella', ingredients: ['Hotdog', 'Mozzarella Cheese', 'Cornmeal Batter'], preparationTime: 7, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'corndog_full_mozza_022', name: 'Full Mozza Corndog', categoryId: 'snacks', price: 75, available: true, description: 'Corndog with extra mozzarella cheese', ingredients: ['Hotdog', 'Extra Mozzarella Cheese', 'Cornmeal Batter'], preparationTime: 7, imageUrl: '', createdAt: now, updatedAt: now },
    { id: 'corndog_potato_023', name: 'Potato Corndog', categoryId: 'snacks', price: 75, available: true, description: 'Corndog with potato coating', ingredients: ['Hotdog', 'Potato Coating'], preparationTime: 7, imageUrl: '', createdAt: now, updatedAt: now }
  ];

  const drinksBase = [
    { id: 'cucumber_lemonade_s_024', name: 'Cucumber Lemonade (Small)', price: 25, desc: 'Refreshing cucumber lemonade' },
    { id: 'cucumber_lemonade_l_025', name: 'Cucumber Lemonade (Large)', price: 35, desc: 'Large refreshing cucumber lemonade' },
    { id: 'lemon_ice_tea_s_026', name: 'Lemon Ice Tea (Small)', price: 25, desc: 'Cold lemon-flavored iced tea' },
    { id: 'lemon_ice_tea_l_027', name: 'Lemon Ice Tea (Large)', price: 35, desc: 'Large cold lemon-flavored iced tea' },
    { id: 'blue_lemonade_s_028', name: 'Blue Lemonade (Small)', price: 25, desc: 'Blue-colored lemonade drink' },
    { id: 'blue_lemonade_l_029', name: 'Blue Lemonade (Large)', price: 35, desc: 'Large blue-colored lemonade drink' },
    { id: 'red_ice_tea_s_030', name: 'Red Ice Tea (Small)', price: 25, desc: 'Red-colored iced tea' },
    { id: 'red_ice_tea_l_031', name: 'Red Ice Tea (Large)', price: 35, desc: 'Large red-colored iced tea' }
  ];

  const drinksSoft = [
    { name: 'Mountain Dew', price: 22, id: 'soft_drink_032' },
    { name: 'Coke', price: 22, id: 'soft_drink_033' },
    { name: 'Sprite', price: 22, id: 'soft_drink_034' },
    { name: 'Royal', price: 22, id: 'soft_drink_035' }
  ];

  const drinks = [
    ...drinksBase.map((d) => ({ id: d.id, name: d.name, categoryId: 'drinks', price: d.price, available: true, description: d.desc, ingredients: [], preparationTime: 3, imageUrl: '', createdAt: now, updatedAt: now })),
    ...drinksSoft.map((d) => ({ id: d.id, name: d.name, categoryId: 'drinks', price: d.price, available: true, description: `${d.name} soft drink`, ingredients: [d.name], preparationTime: 1, imageUrl: '', createdAt: now, updatedAt: now })),
    { id: 'mineral_water_036', name: 'Mineral Water', categoryId: 'drinks', price: 12, available: true, description: 'Bottled mineral water', ingredients: ['Water'], preparationTime: 1, imageUrl: '', createdAt: now, updatedAt: now }
  ];

  memoryDb.menu_categories = categories;
  memoryDb.menu = [...silog, ...snacks, ...drinks];
  memoryDb.orders = memoryDb.orders || [];

  // Add-ons
  memoryDb.add_ons = [
    // Rice
    { id: 'rice_plain', name: 'Plain Rice', price: 0, category: 'rice', available: true, createdAt: now },
    { id: 'rice_java', name: 'Java Rice', price: 15, category: 'rice', available: true, createdAt: now },
    { id: 'rice_garlic', name: 'Garlic Rice', price: 0, category: 'rice', available: true, createdAt: now },
    // Drink
    { id: 'drink_plain', name: 'Plain Water', price: 0, category: 'drink', available: true, createdAt: now },
    { id: 'drink_ice', name: 'Ice Water', price: 5, category: 'drink', available: true, createdAt: now },
    // Extra
    { id: 'extra_egg', name: 'Extra Egg', price: 10, category: 'extra', available: true, createdAt: now },
    { id: 'extra_rice', name: 'Extra Rice', price: 15, category: 'extra', available: true, createdAt: now }
  ];

  // menu_addons mapping
  const allRice = ['rice_plain', 'rice_java', 'rice_garlic'];
  const allDrink = ['drink_plain', 'drink_ice'];
  const allExtras = ['extra_egg', 'extra_rice'];

  const silogIds = silog.map((i) => i.id);
  const snackIds = snacks.map((i) => i.id);
  const drinkIds = drinks.map((i) => i.id);

  const mappings = [];
  // Silog: rice + drink + extras
  silogIds.forEach((menuItemId) => {
    [...allRice, ...allDrink, ...allExtras].forEach((addOnId, idx) => mappings.push({ id: `${menuItemId}_${addOnId}`, menuItemId, addOnId, sortOrder: idx, createdAt: now }));
  });
  // Drinks: drink only
  drinkIds.forEach((menuItemId) => {
    allDrink.forEach((addOnId, idx) => mappings.push({ id: `${menuItemId}_${addOnId}`, menuItemId, addOnId, sortOrder: idx, createdAt: now }));
  });
  // Snacks: extras only (optional)
  snackIds.forEach((menuItemId) => {
    allExtras.forEach((addOnId, idx) => mappings.push({ id: `${menuItemId}_${addOnId}`, menuItemId, addOnId, sortOrder: idx, createdAt: now }));
  });

  memoryDb.menu_addons = mappings;
}


