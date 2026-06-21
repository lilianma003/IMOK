import { db } from '../config/firebaseConfig';
import {
  collection, addDoc, getDocs, updateDoc,
  doc, query, where, getDoc, Timestamp,
} from 'firebase/firestore';
import { addContact } from './contactService';

export interface Invite {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  toPhone: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export const createInvite = async (
  fromUserId: string,
  fromUserName: string,
  toEmail: string,
  toPhone: string,
): Promise<string> => {
  // Return existing pending invite if one already exists
  const existing = await getDocs(query(
    collection(db, 'invites'),
    where('fromUserId', '==', fromUserId),
    where('toEmail', '==', toEmail.toLowerCase()),
    where('status', '==', 'pending'),
  ));

  if (!existing.empty) return existing.docs[0].id;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const ref = await addDoc(collection(db, 'invites'), {
    fromUserId,
    fromUserName,
    toEmail: toEmail.toLowerCase(),
    toPhone,
    status: 'pending',
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  return ref.id;
};

// Called on signup — checks if the new user was invited by anyone
export const checkAndAcceptInvites = async (
  newUserId: string,
  newUserEmail: string,
  newUserName: string,
  newUserPhone: string,
): Promise<void> => {
  const q = query(
    collection(db, 'invites'),
    where('toEmail', '==', newUserEmail.toLowerCase()),
    where('status', '==', 'pending'),
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  for (const inviteDoc of snap.docs) {
    const invite = inviteDoc.data() as Omit<Invite, 'id'>;

    // Get inviter's full profile
    const inviterDoc = await getDoc(doc(db, 'users', invite.fromUserId));
    if (!inviterDoc.exists()) continue;

    const inviter = inviterDoc.data();

    // Add new user to inviter's contacts
    await addContact(invite.fromUserId, {
      name: newUserName,
      phone: newUserPhone,
      email: newUserEmail,
    });

    // Add inviter to new user's contacts
    await addContact(newUserId, {
      name: invite.fromUserName,
      phone: inviter.phoneNumber ?? '',
      email: inviter.email ?? '',
    });

    // Mark invite accepted
    await updateDoc(doc(db, 'invites', inviteDoc.id), {
      status: 'accepted',
      acceptedAt: Timestamp.fromDate(new Date()),
      acceptedByUserId: newUserId,
    });
  }
};