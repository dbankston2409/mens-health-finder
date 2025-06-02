/**
 * Firebase Admin SDK compatibility layer
 * Provides Firebase client SDK-like API using Admin SDK
 */

import * as admin from 'firebase-admin';

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Export db instance
export const db = admin.firestore();

// Wrapper for DocumentSnapshot to provide client-like API
interface CompatDocumentSnapshot {
  exists: () => boolean;
  data: () => any;
  id: string;
  ref: admin.firestore.DocumentReference;
}

// Wrapper for QuerySnapshot to provide client-like API
interface CompatQuerySnapshot {
  empty: boolean;
  size: number;
  docs: CompatDocumentSnapshot[];
  forEach: (callback: (doc: CompatDocumentSnapshot) => void) => void;
}

// Client SDK-like functions
export function collection(firestore: admin.firestore.Firestore, path: string) {
  return firestore.collection(path);
}

export function doc(firestore: admin.firestore.Firestore, path: string, ...pathSegments: string[]) {
  const fullPath = [path, ...pathSegments].join('/');
  return firestore.doc(fullPath);
}

export function query(collectionRef: admin.firestore.CollectionReference, ...queryConstraints: any[]) {
  let query: admin.firestore.Query = collectionRef;
  
  for (const constraint of queryConstraints) {
    if (constraint.type === 'where') {
      query = query.where(constraint.field, constraint.op, constraint.value);
    } else if (constraint.type === 'orderBy') {
      query = query.orderBy(constraint.field, constraint.direction);
    } else if (constraint.type === 'limit') {
      query = query.limit(constraint.value);
    }
  }
  
  return query;
}

export function where(field: string, op: any, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(value: number) {
  return { type: 'limit', value };
}

// Wrap Admin SDK snapshot to provide client-like API
function wrapDocumentSnapshot(snapshot: admin.firestore.DocumentSnapshot): CompatDocumentSnapshot {
  return {
    exists: () => snapshot.exists,
    data: () => snapshot.data(),
    id: snapshot.id,
    ref: snapshot.ref
  };
}

// Wrap Admin SDK query snapshot to provide client-like API
function wrapQuerySnapshot(snapshot: admin.firestore.QuerySnapshot): CompatQuerySnapshot {
  const wrappedDocs = snapshot.docs.map(wrapDocumentSnapshot);
  return {
    empty: snapshot.empty,
    size: snapshot.size,
    docs: wrappedDocs,
    forEach: (callback) => wrappedDocs.forEach(callback)
  };
}

export async function getDocs(query: admin.firestore.Query | admin.firestore.CollectionReference): Promise<CompatQuerySnapshot> {
  const snapshot = await query.get();
  return wrapQuerySnapshot(snapshot);
}

export async function getDoc(docRef: admin.firestore.DocumentReference): Promise<CompatDocumentSnapshot> {
  const snapshot = await docRef.get();
  return wrapDocumentSnapshot(snapshot);
}

export async function updateDoc(docRef: admin.firestore.DocumentReference, data: any) {
  return await docRef.update(data);
}

export async function setDoc(docRef: admin.firestore.DocumentReference, data: any, options?: any) {
  if (options?.merge) {
    return await docRef.set(data, { merge: true });
  }
  return await docRef.set(data);
}

export async function addDoc(collectionRef: admin.firestore.CollectionReference, data: any) {
  const docRef = await collectionRef.add(data);
  return docRef;
}

export async function deleteDoc(docRef: admin.firestore.DocumentReference) {
  return await docRef.delete();
}

export function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

export function arrayUnion(...elements: any[]) {
  return admin.firestore.FieldValue.arrayUnion(...elements);
}

export function arrayRemove(...elements: any[]) {
  return admin.firestore.FieldValue.arrayRemove(...elements);
}

export function increment(n: number) {
  return admin.firestore.FieldValue.increment(n);
}

export function writeBatch(firestore: admin.firestore.Firestore = db) {
  return firestore.batch();
}

// Timestamp type and value
export const Timestamp = admin.firestore.Timestamp;

// FieldPath
export const FieldPath = admin.firestore.FieldPath;

// Real-time listener
export function onSnapshot(
  docRef: admin.firestore.DocumentReference, 
  callback: (snapshot: CompatDocumentSnapshot) => void
): () => void {
  // Return unsubscribe function
  return docRef.onSnapshot(snapshot => {
    callback(wrapDocumentSnapshot(snapshot));
  });
}

// Re-export admin for direct access if needed
export { admin };