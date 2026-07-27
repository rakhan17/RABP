import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Sp2dRegistration } from '../types';

const COLLECTION_NAME = 'registrations';

export async function getRegistrations(): Promise<Sp2dRegistration[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy('no', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sp2dRegistration));
}

export async function addRegistration(data: Omit<Sp2dRegistration, 'id' | 'no' | 'createdAt'>): Promise<void> {
  // Get the latest 'no'
  const q = query(collection(db, COLLECTION_NAME), orderBy('no', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  let nextNo = 1;
  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0].data() as Sp2dRegistration;
    nextNo = (lastDoc.no || 0) + 1;
  }

  const newData: Omit<Sp2dRegistration, 'id'> = {
    ...data,
    no: nextNo,
    createdAt: Date.now()
  };

  await addDoc(collection(db, COLLECTION_NAME), newData);
}

export async function updateRegistration(id: string, data: Partial<Sp2dRegistration>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, data);
}

export async function deleteRegistration(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}
