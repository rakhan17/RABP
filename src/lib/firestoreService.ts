import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export function subscribeToCollection<T>(
  collectionName: string,
  onData: (items: T[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: T[] = [];
      snapshot.docs.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      onData(items);
    },
    (err) => {
      console.error(`Firestore subscription error for ${collectionName}:`, err);
      // Fallback
      onSnapshot(
        colRef,
        (fallbackSnap) => {
          const items: T[] = [];
          fallbackSnap.docs.forEach((docSnap) => {
            items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
          });
          onData(items);
        },
        onError
      );
    }
  );
}

export async function getFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.docs.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
    });
    return items;
  } catch (error) {
    console.error(`Failed to fetch from ${collectionName}:`, error);
    throw error;
  }
}

export async function addToFirestore(collectionName: string, data: any) {
  try {
    const colRef = collection(db, collectionName);
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(colRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error(`Failed to add to ${collectionName}:`, error);
    throw error;
  }
}

export async function updateInFirestore(collectionName: string, id: string, data: any) {
  try {
    const docRef = doc(db, collectionName, id);
    const updatePayload = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    // remove id if present
    if (updatePayload.id) delete updatePayload.id;

    await updateDoc(docRef, updatePayload);
    return { id, success: true };
  } catch (error) {
    console.error(`Failed to update in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteFromFirestore(collectionName: string, id: string) {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { id, success: true };
  } catch (error) {
    console.error(`Failed to delete from ${collectionName}:`, error);
    throw error;
  }
}
