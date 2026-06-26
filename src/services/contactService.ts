import { db } from '../config/firebaseConfig';
import {
  collection, addDoc, getDocs,
  deleteDoc, doc, query, where, updateDoc
} from 'firebase/firestore';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  linkedUserId: string | null;
  fcmToken: string | null;
  status: 'linked' | 'not_found';
}

export const getContacts = async (userId: string): Promise<Contact[]> => {
  const snap = await getDocs(collection(db, 'users', userId, 'contacts'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact));
};

export const addContact = async (
  userId: string,
  contact: { name: string; phone: string; email: string }
): Promise<string> => {
  // Look up contact by email in Firestore
  const q = query(
    collection(db, 'users'),
    where('email', '==', contact.email.toLowerCase())
  );
  const snap = await getDocs(q);

  let linkedUserId: string | null = null;
  let fcmToken: string | null = null;
  let status: 'linked' | 'not_found' = 'not_found';

  if (!snap.empty) {
    const contactUser = snap.docs[0];
    linkedUserId = contactUser.id;
    fcmToken = contactUser.data().fcmToken ?? null;
    status = 'linked';
  }

  const ref = await addDoc(collection(db, 'users', userId, 'contacts'), {
    name: contact.name,
    phone: contact.phone,
    email: contact.email.toLowerCase(),
    linkedUserId,
    fcmToken,
    status,
  });

  return ref.id;
};

export const deleteContact = async (
  userId: string,
  contactId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId, 'contacts', contactId));
};

export const refreshContactStatuses = async (userId: string): Promise<void> => {
  const contacts = await getContacts(userId);

  for (const contact of contacts) {
    const q = query(
      collection(db, 'users'),
      where('email', '==', contact.email.toLowerCase())
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const found = snap.docs[0];
      const fcmToken = found.data().fcmToken ?? null;
      const linkedUserId = found.id;

      // Only update if something changed
      if (
        contact.status !== 'linked' ||
        contact.fcmToken !== fcmToken ||
        contact.linkedUserId !== linkedUserId
      ) {
        await updateDoc(doc(db, 'users', userId, 'contacts', contact.id), {
          linkedUserId,
          fcmToken,
          status: 'linked',
        });
      }
    }
  }
};