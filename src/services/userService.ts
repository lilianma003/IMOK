import { db } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

interface UserData {
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: Date;
}

export const createUserDocument = async (
  userId: string,
  userData: Pick<UserData, 'name' | 'email' | 'phoneNumber'>
): Promise<void> => {
  await setDoc(doc(db, 'users', userId), {
    name: userData.name,
    email: userData.email,
    phoneNumber: userData.phoneNumber ?? '',
    createdAt: new Date(),
  });
};

export const getUserDocument = async (
  userId: string
): Promise<UserData | undefined> => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.data() as UserData | undefined;
};

export const updateUserDocument = async (
  userId: string,
  data: Partial<UserData>
): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), data);
};