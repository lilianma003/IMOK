import { db } from '../config/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

export const getContacts = async (userId: string): Promise<Contact[]> => {
  const snap = await getDocs(collection(db, 'users', userId, 'contacts'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact));
};

export const addContact = async (
  userId: string,
  contact: Omit<Contact, 'id'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'users', userId, 'contacts'), contact);
  return ref.id;
};

export const deleteContact = async (
  userId: string,
  contactId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId, 'contacts', contactId));
};