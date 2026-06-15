import auth from '@react-native-firebase/auth';

export const sendPhoneOTP = async (
  phoneNumber: string
): Promise<any> => {
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
  return confirmation;
};

export const verifyPhoneOTP = async (
  confirmation: any,
  otpCode: string
): Promise<any> => {
  const userCredential = await confirmation.confirm(otpCode);
  return userCredential.user;
};

export const logoutUser = async (): Promise<void> => {
  await auth().signOut();
};