import { appConfig } from '../config/appConfig';

let firebaseDb;
let firebaseCollection;
let firebaseAddDoc;
let firebaseGetDoc;
let firebaseSetDoc;
let firebaseUpdateDoc;
let firebaseDeleteDoc;
let firebaseDoc;
let firebaseOnSnapshot;
let firebaseQuery;
let firebaseWhere;
let firebaseOrderBy;

if (!appConfig.USE_MOCKS) {
  const { db } = require('../config/firebase');
  const { collection, addDoc, getDoc, setDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } = require('firebase/firestore');
  firebaseDb = db;
  firebaseCollection = collection;
  firebaseAddDoc = addDoc;
  firebaseGetDoc = getDoc;
  firebaseSetDoc = setDoc;
  firebaseUpdateDoc = updateDoc;
  firebaseDeleteDoc = deleteDoc;
  firebaseDoc = doc;
  firebaseOnSnapshot = onSnapshot;
  firebaseQuery = query;
  firebaseWhere = where;
  firebaseOrderBy = orderBy;
}

import { seedMemoryDb } from './seedMockData';

// Simple in-memory store for mock mode
const memoryDb = {
  menu_categories: [],
  menu: [],
  orders: []
};

function ensureSeeded() {
  if (memoryDb.menu.length === 0 && memoryDb.menu_categories.length === 0) {
    seedMemoryDb(memoryDb);
  }
}

export const firestoreService = {
  subscribeCollection: (collectionName, { conditions = [], order = [], next, error }) => {
    if (appConfig.USE_MOCKS) {
      ensureSeeded();
      const data = memoryDb[collectionName] || [];
      setTimeout(() => next(data), 0);
      return () => {};
    }
    let q = firebaseCollection(firebaseDb, collectionName);
    conditions.forEach((c) => (q = firebaseQuery(q, firebaseWhere(...c))));
    if (order.length > 0) q = firebaseQuery(q, firebaseOrderBy(...order));
    const unsub = firebaseOnSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      next(list);
    }, error);
    return unsub;
  },

  addDocument: async (collectionName, data) => {
    if (appConfig.USE_MOCKS) {
      const id = `mock-${Date.now()}`;
      const item = { id, ...data };
      memoryDb[collectionName] = memoryDb[collectionName] || [];
      memoryDb[collectionName].push(item);
      return { id };
    }
    const ref = await firebaseAddDoc(firebaseCollection(firebaseDb, collectionName), data);
    return { id: ref.id };
  },

  updateDocument: async (collectionName, id, data) => {
    if (appConfig.USE_MOCKS) {
      const list = memoryDb[collectionName] || [];
      const idx = list.findIndex((i) => i.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data };
      }
      return true;
    }
    await firebaseUpdateDoc(firebaseDoc(firebaseDb, `${collectionName}/${id}`), data);
    return true;
  },

  upsertDocument: async (collectionName, id, data) => {
    if (appConfig.USE_MOCKS) {
      memoryDb[collectionName] = memoryDb[collectionName] || [];
      const idx = memoryDb[collectionName].findIndex((i) => i.id === id);
      if (idx >= 0) memoryDb[collectionName][idx] = { ...memoryDb[collectionName][idx], ...data, id };
      else memoryDb[collectionName].push({ id, ...data });
      return true;
    }
    await firebaseSetDoc(firebaseDoc(firebaseDb, `${collectionName}/${id}`), data, { merge: true });
    return true;
  },

  deleteDocument: async (collectionName, id) => {
    if (appConfig.USE_MOCKS) {
      memoryDb[collectionName] = (memoryDb[collectionName] || []).filter((i) => i.id !== id);
      return true;
    }
    await firebaseDeleteDoc(firebaseDoc(firebaseDb, `${collectionName}/${id}`));
    return true;
  },

  getCollectionOnce: async (collectionName, conditions = [], order = []) => {
    if (appConfig.USE_MOCKS) {
      ensureSeeded();
      let data = [...(memoryDb[collectionName] || [])];
      // Apply conditions
      conditions.forEach(([field, op, value]) => {
        if (op === '==') {
          data = data.filter(item => item[field] === value);
        } else if (op === '>') {
          data = data.filter(item => item[field] > value);
        } else if (op === '<') {
          data = data.filter(item => item[field] < value);
        }
      });
      // Apply ordering
      if (order.length > 0) {
        const [field, direction] = order;
        data.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          if (direction === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }
      return data;
    }

    try {
      const { getDocs } = require('firebase/firestore');
      let q = firebaseCollection(firebaseDb, collectionName);
      conditions.forEach((c) => (q = firebaseQuery(q, firebaseWhere(...c))));
      if (order.length > 0) {
        q = firebaseQuery(q, firebaseOrderBy(...order));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error getting collection:', error);
      return [];
    }
  },

  /**
   * Get a single document by ID
   */
  getDocument: async (collectionName, id) => {
    if (appConfig.USE_MOCKS) {
      ensureSeeded();
      const list = memoryDb[collectionName] || [];
      return list.find((item) => item.id === id) || null;
    }

    try {
      const docSnap = await firebaseGetDoc(firebaseDoc(firebaseDb, collectionName, id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  },

  /**
   * Batch write operations
   */
  batchWrite: async (operations) => {
    if (appConfig.USE_MOCKS) {
      // Mock implementation
      operations.forEach((op) => {
        if (op.type === 'set') {
          memoryDb[op.collection] = memoryDb[op.collection] || [];
          const idx = memoryDb[op.collection].findIndex((i) => i.id === op.id);
          if (idx >= 0) {
            memoryDb[op.collection][idx] = { ...memoryDb[op.collection][idx], ...op.data, id: op.id };
          } else {
            memoryDb[op.collection].push({ id: op.id, ...op.data });
          }
        } else if (op.type === 'update') {
          const list = memoryDb[op.collection] || [];
          const idx = list.findIndex((i) => i.id === op.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...op.data };
          }
        } else if (op.type === 'delete') {
          memoryDb[op.collection] = (memoryDb[op.collection] || []).filter((i) => i.id !== op.id);
        }
      });
      return true;
    }

    try {
      const { writeBatch } = require('firebase/firestore');
      const batch = writeBatch(firebaseDb);
      
      operations.forEach((op) => {
        const docRef = firebaseDoc(firebaseDb, op.collection, op.id);
        if (op.type === 'set') {
          batch.set(docRef, op.data, { merge: op.merge || false });
        } else if (op.type === 'update') {
          batch.update(docRef, op.data);
        } else if (op.type === 'delete') {
          batch.delete(docRef);
        }
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error in batch write:', error);
      throw error;
    }
  }
};

