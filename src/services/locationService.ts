import { db } from '../config/firebaseConfig';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

interface LocationData {
  latitude: number | null;
  longitude: number | null;
  updatedAt: Date | null;
}

export const createLocationDocument = async (
  userId: string
): Promise<void> => {
  await setDoc(doc(db, 'locations', userId), {
    latitude: null,
    longitude: null,
    updatedAt: null,
  });
};

export const updateUserLocation = async (
  userId: string,
  latitude: number,
  longitude: number
): Promise<void> => {
  await updateDoc(doc(db, 'locations', userId), {
    latitude,
    longitude,
    updatedAt: new Date(),
  });
};