import { db } from 'src/config/firebaseConfig.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const createLocationDocument = async(userId) => {
  await setDoc(doc(db, 'users', userId), {
    locationUpdatedAt: null,
    latitude: null,
    longitude: null
  });
};

const updateUserLocation = async(userId, latitude, longitude) => {
  await updateDoc(doc(db, 'users', userId), {
    latitude: latitude,
    longitude: longitude,
    locationUpdatedAt: new Date(),
  });
}

export const getUserLocation = async(userId) => {
	const snap = await getDoc(db, 'location', userId)
	return snap.data();
}