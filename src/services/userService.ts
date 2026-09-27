import { db } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '../config/cloudinaryConfig';

export interface UserData {
  name: string;
  email: string;
  phoneNumber: string;
  profilePicture: string;
  createdAt: Date;
  emergencyProfile?: EmergencyProfile;
}

export interface EmergencyProfile {
  name: string;
  nationality: string;
  languages: string;
  medicalInfo: string;
  attorneyContact: string;
}

export const createUserDocument = async (
  userId: string,
  userData: Pick<UserData, 'name' | 'email' | 'phoneNumber'>
): Promise<void> => {
  await setDoc(doc(db, 'users', userId), {
    name: userData.name,
    email: userData.email.toLowerCase(),
    phoneNumber: userData.phoneNumber ?? '',
    profilePicture: '',
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

export const getEmergencyProfile = async (
  userId: string
): Promise<EmergencyProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return snap.data()?.emergencyProfile ?? null;
  } catch {
    return null;
  }
};

export const uploadProfilePicture = async (
  userId: string,
  localUri: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: 'image/jpeg',
    name: `profile_${userId}.jpg`,
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('public_id', `profile_${userId}`);
  formData.append('overwrite', 'true');

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }

  const data = await response.json();
  const downloadUrl: string = data.secure_url;

  await updateDoc(doc(db, 'users', userId), {
    profilePicture: downloadUrl,
  });

  return downloadUrl;
};