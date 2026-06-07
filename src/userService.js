import { db } from 'src/config/firebaseConfig.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const createUserDocument = async(userId, userData) => {
  await setDoc(doc(db, 'users', userId), {
    name: userData.name,
    createdAt: new Date(),
    number: userData.number
  });
}

export const getUserDocument = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.data();
};