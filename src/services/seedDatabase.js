// Firestore seeding scaffold (for Real Mode). Not used in Mock Mode.
// Fill menuItems array with the same data as in seedMockData if needed.

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export const seedDatabase = async () => {
  const categories = [
    {
      categoryId: 'silog_meals',
      name: 'Silog Meals',
      description: 'Traditional Filipino silog meals with garlic rice and egg',
      active: true,
      sortOrder: 1,
      createdAt: serverTimestamp()
    },
    {
      categoryId: 'snacks',
      name: 'Snacks',
      description: 'Quick bites and appetizers',
      active: true,
      sortOrder: 2,
      createdAt: serverTimestamp()
    },
    {
      categoryId: 'drinks',
      name: 'Drinks & Beverages',
      description: 'Refreshments and beverages',
      active: true,
      sortOrder: 3,
      createdAt: serverTimestamp()
    }
  ];

  const menuItems = [];

  for (const category of categories) {
    await setDoc(doc(db, 'menu_categories', category.categoryId), category);
  }

  for (const item of menuItems) {
    await setDoc(doc(db, 'menu', item.itemId), item);
  }
};

