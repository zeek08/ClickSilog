import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { appConfig } from '../config/appConfig';
import { firestoreService } from '../services/firestoreService';

export const useRealTimeCollection = (collectionName, conditions = [], order = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (appConfig.USE_MOCKS) {
      const unsub = firestoreService.subscribeCollection(collectionName, {
        conditions,
        order,
        next: (list) => {
          setData(list);
          setLoading(false);
        },
        error: (err) => {
          setError(err);
          setLoading(false);
        }
      });
      return () => unsub();
    }

    let q = collection(db, collectionName);
    conditions.forEach((c) => {
      q = query(q, where(...c));
    });
    if (order.length > 0) {
      q = query(q, orderBy(...order));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setData(newData);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(conditions), JSON.stringify(order)]);

  return { data, loading, error };
};

