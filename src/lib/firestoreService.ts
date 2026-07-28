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
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import type { Sp2dRegistration } from "../types";
import { formatDateToIndonesian } from "./sheets";

const COLLECTION_NAME = "sp2d_registrations";

// Helper to sanitize Firestore document data into Sp2dRegistration
export const mapDocToRegistration = (docId: string, data: any, index: number): Sp2dRegistration => {
  const getStr = (val: any) => (val !== null && val !== undefined ? String(val).trim() : '');
  const getNum = (val: any) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  return {
    id: docId,
    no: getNum(data.no) || (index + 1),
    tglAntarBerkas: formatDateToIndonesian(getStr(data.tglAntarBerkas || data['Tanggal Antar Berkas'])),
    noSpm: getStr(data.noSpm || data['No SPM']),
    namaRekanan: getStr(data.namaRekanan || data['Nama Rekanan']),
    nilaiKwitansi: getNum(data.nilaiKwitansi || data['Nilai Kwitansi']),
    bidang: getStr(data.bidang || data['Nama Bidang'] || data['BIDANG']),
    kodeSubKegiatan: getStr(data.kodeSubKegiatan || data['Kode Sub Kegiatan'] || data['Sub Kegiatan']),
    pekerjaan: getStr(data.pekerjaan || data['Keterangan'] || data['Pekerjaan']),
    noSp2d: getStr(data.noSp2d || data['No SP2D']),
    tglCairSp2d: formatDateToIndonesian(getStr(data.tglCairSp2d || data['Tanggal Cair SP2D'])),
  };
};

// 1. Subscribe to Real-Time Updates from Firestore
export function subscribeToRegistrations(
  onData: (registrations: Sp2dRegistration[]) => void,
  onError: (error: Error) => void
) {
  const colRef = collection(db, COLLECTION_NAME);
  // Order by 'no' ascending if present, otherwise fallback
  const q = query(colRef, orderBy("no", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Sp2dRegistration[] = [];
      snapshot.docs.forEach((docSnap, index) => {
        const item = mapDocToRegistration(docSnap.id, docSnap.data(), index);
        items.push(item);
      });
      onData(items);
    },
    (err) => {
      console.error("Firestore subscription error:", err);
      // Fallback query without orderBy if index is missing
      onSnapshot(
        colRef,
        (fallbackSnap) => {
          const items: Sp2dRegistration[] = [];
          fallbackSnap.docs.forEach((docSnap, index) => {
            items.push(mapDocToRegistration(docSnap.id, docSnap.data(), index));
          });
          items.sort((a, b) => a.no - b.no);
          onData(items);
        },
        onError
      );
    }
  );
}

// 2. Fetch All Registrations (One-time)
export async function getRegistrationsFromFirestore(): Promise<Sp2dRegistration[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const items: Sp2dRegistration[] = [];
    snapshot.docs.forEach((docSnap, index) => {
      items.push(mapDocToRegistration(docSnap.id, docSnap.data(), index));
    });
    items.sort((a, b) => a.no - b.no);
    return items;
  } catch (error) {
    console.error("Failed to fetch from Firestore:", error);
    throw error;
  }
}

// 3. Add Single Registration
export async function addRegistrationToFirestore(data: Omit<Sp2dRegistration, 'id' | 'no'>, nextNo?: number) {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const formattedTglAntar = formatDateToIndonesian(data.tglAntarBerkas);
    const formattedTglCair = formatDateToIndonesian(data.tglCairSp2d);

    const docData = {
      no: nextNo || Date.now(),
      tglAntarBerkas: formattedTglAntar,
      noSpm: data.noSpm || '',
      namaRekanan: data.namaRekanan || '',
      nilaiKwitansi: Number(data.nilaiKwitansi) || 0,
      bidang: data.bidang || '',
      kodeSubKegiatan: data.kodeSubKegiatan || '',
      pekerjaan: data.pekerjaan || '',
      noSp2d: data.noSp2d || '',
      tglCairSp2d: formattedTglCair,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(colRef, docData);
    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error("Failed to add to Firestore:", error);
    throw error;
  }
}

// 4. Update Registration
export async function updateRegistrationInFirestore(id: string, data: Partial<Sp2dRegistration>) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updatePayload: any = {
      updatedAt: serverTimestamp(),
    };

    if (data.tglAntarBerkas !== undefined) updatePayload.tglAntarBerkas = formatDateToIndonesian(data.tglAntarBerkas);
    if (data.noSpm !== undefined) updatePayload.noSpm = data.noSpm;
    if (data.namaRekanan !== undefined) updatePayload.namaRekanan = data.namaRekanan;
    if (data.nilaiKwitansi !== undefined) updatePayload.nilaiKwitansi = Number(data.nilaiKwitansi) || 0;
    if (data.bidang !== undefined) updatePayload.bidang = data.bidang;
    if (data.kodeSubKegiatan !== undefined) updatePayload.kodeSubKegiatan = data.kodeSubKegiatan;
    if (data.pekerjaan !== undefined) updatePayload.pekerjaan = data.pekerjaan;
    if (data.noSp2d !== undefined) updatePayload.noSp2d = data.noSp2d;
    if (data.tglCairSp2d !== undefined) updatePayload.tglCairSp2d = formatDateToIndonesian(data.tglCairSp2d);
    if (data.no !== undefined) updatePayload.no = data.no;

    await updateDoc(docRef, updatePayload);
    return { id, success: true };
  } catch (error) {
    console.error("Failed to update in Firestore:", error);
    throw error;
  }
}

// 5. Delete Registration
export async function deleteRegistrationFromFirestore(id: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { id, success: true };
  } catch (error) {
    console.error("Failed to delete from Firestore:", error);
    throw error;
  }
}

// 6. Bulk Import / Seed (Batch Write)
export async function seedRegistrationsToFirestore(items: Sp2dRegistration[]) {
  try {
    const batchSize = 400; // Firestore batch limit is 500
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + batchSize);

      chunk.forEach((item, chunkIdx) => {
        const colRef = collection(db, COLLECTION_NAME);
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          no: item.no || (i + chunkIdx + 1),
          tglAntarBerkas: formatDateToIndonesian(item.tglAntarBerkas),
          noSpm: item.noSpm || '',
          namaRekanan: item.namaRekanan || '',
          nilaiKwitansi: Number(item.nilaiKwitansi) || 0,
          bidang: item.bidang || '',
          kodeSubKegiatan: item.kodeSubKegiatan || '',
          pekerjaan: item.pekerjaan || '',
          noSp2d: item.noSp2d || '',
          tglCairSp2d: formatDateToIndonesian(item.tglCairSp2d),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
    }
    return { success: true, count: items.length };
  } catch (error) {
    console.error("Failed batch seed to Firestore:", error);
    throw error;
  }
}
