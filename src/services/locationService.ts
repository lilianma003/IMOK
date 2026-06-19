import { db } from '../config/firebaseConfig';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import * as Location from 'expo-location';

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

export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

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