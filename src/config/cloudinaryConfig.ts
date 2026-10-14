import Constants from 'expo-constants';
export const CLOUDINARY_CLOUD_NAME = Constants.expoConfig?.extra?.cloudinaryCloudName;
export const CLOUDINARY_UPLOAD_PRESET = Constants.expoConfig?.extra?.cloudinaryUploadPreset;
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;