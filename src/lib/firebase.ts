import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { PRODUCTS, MOCK_ORDERS } from '../data/mockData';
import { Product, OrderStatus } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Connect to the specific named Firestore database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

/**
 * Seeds initial products into Firestore if the collection is empty.
 */
export async function seedInitialProductsIfNeeded(): Promise<Product[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
      console.log('Seeding initial products into Firestore...');
      const seedPromises = PRODUCTS.map((product) => {
        const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
        return setDoc(docRef, product);
      });
      await Promise.all(seedPromises);

      // Seed initial orders as well if empty
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const ordersSnapshot = await getDocs(ordersRef);
      if (ordersSnapshot.empty) {
        const orderPromises = MOCK_ORDERS.map((order) => {
          const docRef = doc(db, ORDERS_COLLECTION, order.id);
          return setDoc(docRef, { ...order, createdAt: serverTimestamp() });
        });
        await Promise.all(orderPromises);
      }

      return PRODUCTS;
    }

    const products: Product[] = [];
    snapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product);
    });

    return products;
  } catch (error) {
    console.error('Error in seedInitialProductsIfNeeded:', error);
    return PRODUCTS;
  }
}

/**
 * Subscribe to real-time product updates from Firestore
 */
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const productsRef = collection(db, PRODUCTS_COLLECTION);

  return onSnapshot(
    productsRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If empty, trigger seed and notify
        seedInitialProductsIfNeeded().then((prods) => callback(prods));
      } else {
        const products: Product[] = [];
        snapshot.forEach((docSnapshot) => {
          products.push({ id: docSnapshot.id, ...docSnapshot.data() } as Product);
        });
        callback(products);
      }
    },
    (error) => {
      console.error('Firestore products subscription error:', error);
      callback(PRODUCTS);
    }
  );
}

/**
 * Subscribe to real-time order status updates from Firestore
 */
export function subscribeToOrders(callback: (orders: OrderStatus[]) => void) {
  const ordersRef = collection(db, ORDERS_COLLECTION);

  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders: OrderStatus[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        orders.push({
          id: docSnapshot.id,
          orderNumber: data.orderNumber || docSnapshot.id,
          customerName: data.customerName || '',
          phone: data.phone || '',
          governorate: data.governorate || '',
          address: data.address || '',
          items: data.items || [],
          totalPriceYER: data.totalPriceYER || 0,
          status: data.status || 'processing',
          statusLabel: data.statusLabel || 'جاري معالجة الطلب ⏳',
          date: data.date || new Date().toLocaleDateString('ar-EG'),
          paymentMethod: data.paymentMethod || 'الدفع عند الاستلام'
        } as OrderStatus);
      });
      callback(orders);
    },
    (error) => {
      console.error('Firestore orders subscription error:', error);
      callback(MOCK_ORDERS);
    }
  );
}

/**
 * Create a new order in Firestore
 */
export async function createFirestoreOrder(orderData: Omit<OrderStatus, 'id'>): Promise<string> {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const newDoc = await addDoc(ordersRef, {
      ...orderData,
      createdAt: serverTimestamp()
    });
    return newDoc.id;
  } catch (error) {
    console.error('Error creating order in Firestore:', error);
    throw error;
  }
}

/**
 * Save or update a product in Firestore
 */
export async function saveFirestoreProduct(product: Product): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(docRef, product, { merge: true });
  } catch (error) {
    console.error('Error saving product in Firestore:', error);
    throw error;
  }
}

/**
 * Delete a product from Firestore
 */
export async function deleteFirestoreProduct(productId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product in Firestore:', error);
    throw error;
  }
}

/**
 * Update an order's status in Firestore
 */
export async function updateFirestoreOrderStatus(
  orderId: string,
  status: OrderStatus['status'],
  statusLabel: string
): Promise<void> {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status, statusLabel });
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
    throw error;
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteFirestoreOrder(orderId: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting order in Firestore:', error);
    throw error;
  }
}

