import { db } from '../config/firebaseConfig';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  updatedAt: Date | null;
  mapsUrl: string | null;
}

// Creates the location subcollection document under the user
export const createLocationDocument = async (userId: string): Promise<void> => {
  await setDoc(doc(db, 'users', userId, 'location', 'current'), {
    latitude: null,
    longitude: null,
    updatedAt: null,
    mapsUrl: null,
  });
};

// Saves current GPS position to Firestore — overwrites last known location
export const saveLocationToFirestore = async (userId: string): Promise<void> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    await setDoc(doc(db, 'users', userId, 'location', 'current'), {
      latitude,
      longitude,
      updatedAt: new Date(),
      mapsUrl,
    });
  } catch (error) {
    console.log('Failed to save location to Firestore:', error);
  }
};

// Gets last known location from Firestore
export const getLastKnownLocation = async (userId: string): Promise<{
  latitude: number;
  longitude: number;
  mapsUrl: string;
  updatedAt: Date;
} | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'location', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data.latitude || !data.longitude) return null;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      mapsUrl: data.mapsUrl ?? `https://maps.google.com/?q=${data.latitude},${data.longitude}`,
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
    };
  } catch {
    return null;
  }
};

export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

// Gets current GPS position live (for immediate use)
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
  mapsUrl: string;
} | null> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

    return { latitude, longitude, mapsUrl };
  } catch {
    return null;
  }
};