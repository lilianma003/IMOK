// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
// import { app } from '../firebaseConfig'; // adjust path if needed

// const auth = getAuth(app);

// export const loginUser = async (
//   email: string,
//   password: string
// ): Promise<any> => {
//   const userCredential = await signInWithEmailAndPassword(auth, email, password);
//   return userCredential.user;
// };

// export const registerUser = async (
//   email: string,
//   password: string
// ): Promise<any> => {
//   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//   return userCredential.user;
// };

// export const logoutUser = async (): Promise<void> => {
//   await signOut(auth);
// };