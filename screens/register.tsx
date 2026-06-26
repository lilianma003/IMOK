import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { registerWithEmail } from '../src/services/authService';
import { createUserDocument } from '../src/services/userService';
import { createLocationDocument } from '../src/services/locationService';
import { auth } from '../src/config/firebaseConfig';
import { checkAndAcceptInvites } from '../src/services/inviteService';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  RegisterSuccess: undefined;
};
type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterNavigationProp;
}

export default function Register({ navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const getAuthErrorMessage = (error: Error): string => {
    const code = (error as any)?.code as string | undefined;
    switch (code) {
      case 'auth/email-already-in-use':
        return t('auth.errorEmailInUse');
      case 'auth/invalid-email':
        return t('auth.errorInvalidEmail');
      case 'auth/weak-password':
        return t('auth.errorWeakPassword');
      case 'auth/network-request-failed':
        return t('auth.errorNetwork');
      default:
        return t('auth.errorGeneric');
    }
  };

  const handleRegister = async (): Promise<void> => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('auth.errorTitle'), t('auth.fillRequiredFields'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('auth.errorTitle'), t('auth.passwordMismatch'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('auth.errorTitle'), t('auth.passwordTooShort'));
      return;
    }
    try {
      setLoading(true);
      const user = await registerWithEmail(email, password);
      await createUserDocument(user.uid, { name, email, phoneNumber });
      await createLocationDocument(user.uid);

      // Check if this email was invited by anyone and auto-link contacts
      await checkAndAcceptInvites(user.uid, email, name, phoneNumber);

      await auth.signOut();
      navigation.navigate('RegisterSuccess');
    } catch (error) {
      Alert.alert(t('auth.registrationFailedTitle'), getAuthErrorMessage(error as Error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('auth.registerTitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.fullNamePlaceholder')}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.emailPlaceholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.phoneNumberPlaceholder')}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{t('auth.registerButton')}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>{t('auth.hasAccount')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  backText: {
    color: '#5170ff',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    color: '#5170ff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#5170ff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    textAlign: 'center',
    color: '#5170ff',
    fontSize: 14,
    marginTop: 8,
  },
});