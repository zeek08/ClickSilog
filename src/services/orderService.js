import { firestoreService } from './firestoreService';

export const orderService = {
  placeOrder: async (order) => {
    return await firestoreService.addDocument('orders', {
      ...order,
      items: (order.items || []).map((i) => ({
        itemId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
        addOns: (i.addOns || []).map((a) => ({ name: a.name, price: a.price })),
        specialInstructions: i.specialInstructions || '',
        totalItemPrice: i.totalItemPrice || (i.price || 0)
      })),
      subtotal: order.subtotal || order.total || 0,
      discountCode: order.discountCode || null,
      discountAmount: order.discountAmount || 0,
      discountName: order.discountName || null,
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  },

  subscribeOrders: ({ status, next, error }) => {
    const conditions = status ? [['status', '==', status]] : [];
    return firestoreService.subscribeCollection('orders', { conditions, order: ['timestamp', 'asc'], next, error });
  },

  updateStatus: async (orderId, status, extra = {}) => {
    const timeField =
      status === 'preparing' ? 'preparationStartTime' :
      status === 'ready' ? 'readyTime' :
      status === 'completed' ? 'completedTime' : null;
    const payload = { status, ...(timeField ? { [timeField]: new Date().toISOString() } : {}), ...extra };
    return firestoreService.updateDocument('orders', orderId, payload);
  }
};

