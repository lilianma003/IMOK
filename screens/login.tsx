// import { useState, useRef } from 'react';
// import {
//   View, Text, TextInput, TouchableOpacity,
//   StyleSheet, Alert, ActivityIndicator
// } from 'react-native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import { sendPhoneOTP, verifyPhoneOTP } from '../src/services/authService';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// type AuthStackParamList = {
//   Welcome: undefined;
//   Login: undefined;
//   Register: undefined;
// };

// type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

// interface Props {
//   navigation: LoginNavigationProp;
// }

// export default function Login({ navigation }: Props): React.JSX.Element {
//   const [phoneNumber, setPhoneNumber] = useState<string>('');
//   const [otpCode, setOtpCode] = useState<string>('');
//   const [confirmation, setConfirmation] = useState<any>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [step, setStep] = useState<1 | 2>(1);

//   const handleSendOTP = async (): Promise<void> => {
//     if (!phoneNumber) {
//       Alert.alert('Error', 'Please enter your phone number');
//       return;
//     }
//     try {
//       setLoading(true);
//       const confirmationResult = await sendPhoneOTP(phoneNumber);
//       setConfirmation(confirmationResult);
//       setStep(2);
//     } catch (error) {
//       Alert.alert('Error', (error as Error).message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOTP = async (): Promise<void> => {
//     if (!otpCode || !confirmation) {
//       Alert.alert('Error', 'Please enter the OTP code');
//       return;
//     }
//     try {
//       setLoading(true);
//       await verifyPhoneOTP(confirmation, otpCode);
//       // onAuthStateChanged in App.tsx handles the redirect automatically
//     } catch (error) {
//       Alert.alert('Login Failed', (error as Error).message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
//         <Text style={styles.backText}>← Back</Text>
//       </TouchableOpacity>

//       <Text style={styles.title}>Login</Text>

//       {step === 1 && (
//         <>
//           <TextInput
//             style={styles.input}
//             placeholder="Phone Number (e.g. +12065550100)"
//             value={phoneNumber}
//             onChangeText={setPhoneNumber}
//             keyboardType="phone-pad"
//           />
//           <TouchableOpacity
//             style={styles.button}
//             onPress={handleSendOTP}
//             disabled={loading}
//           >
//             {loading
//               ? <ActivityIndicator color="#fff" />
//               : <Text style={styles.buttonText}>Send OTP</Text>
//             }
//           </TouchableOpacity>
//         </>
//       )}

//       {step === 2 && (
//         <>
//           <Text style={styles.subtitle}>
//             Enter the OTP sent to {phoneNumber}
//           </Text>
//           <TextInput
//             style={styles.input}
//             placeholder="OTP Code"
//             value={otpCode}
//             onChangeText={setOtpCode}
//             keyboardType="number-pad"
//           />
//           <TouchableOpacity
//             style={styles.button}
//             onPress={handleVerifyOTP}
//             disabled={loading}
//           >
//             {loading
//               ? <ActivityIndicator color="#fff" />
//               : <Text style={styles.buttonText}>Verify & Login</Text>
//             }
//           </TouchableOpacity>
//           <TouchableOpacity onPress={() => setStep(1)}>
//             <Text style={styles.link}>Use a different number</Text>
//           </TouchableOpacity>
//         </>
//       )}

//       <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.link}>Don't have an account? Register</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     padding: 24,
//     backgroundColor: '#fff',
//   },
//   backButton: {
//     position: 'absolute',
//     top: 56,
//     left: 24,
//   },
//   backText: {
//     color: '#1565c0',
//     fontSize: 16,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 32,
//     textAlign: 'center',
//     color: '#1565c0',
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 24,
//     color: '#555',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: '#1565c0',
//     padding: 14,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   link: {
//     textAlign: 'center',
//     color: '#1565c0',
//     fontSize: 14,
//     marginTop: 8,
//   },
// });