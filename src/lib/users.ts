import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export interface User {
  username: string;
  password?: string;
  role: 'admin' | 'viewer';
  bidang: string;
}

// Temporary for dropdowns until we fetch from DB
export const BINDANG_LIST = [
  'Keuangan', 'Sekretariat', 'Bidang JJ', 'Bidang SDA', 
  'Bidang PLP', 'Bidang GP', 'UPTD Drainase', 'UPTD JJ'
];

export async function getUserByUsername(username: string): Promise<User | null> {
  const usersRef = collection(db, 'users');
  // We query case-insensitive using a specific field if it exists, but since we are doing simple equality, we can fetch all and find, 
  // or store doc ID as lowercase. The easiest is to store doc ID as lowercase and fetch by doc ID.
  try {
    const allUsersSnapshot = await getDocs(usersRef);
    const users: User[] = [];
    allUsersSnapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    
    return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}
