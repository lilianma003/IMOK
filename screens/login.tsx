import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { loginWithEmail } from '../src/services/authService';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginNavigationProp;
}

export default function Login({ navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const getAuthErrorMessage = (error: Error): string => {
    const code = (error as any)?.code as string | undefined;
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return t('auth.errorInvalidCredential');
      case 'auth/user-not-found':
        return t('auth.errorUserNotFound');
      case 'auth/invalid-email':
        return t('auth.errorInvalidEmail');
      case 'auth/too-many-requests':
        return t('auth.errorTooManyRequests');
      case 'auth/network-request-failed':
        return t('auth.errorNetwork');
      default:
        return t('auth.errorGeneric');
    }
  };

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert(t('auth.errorTitle'), t('auth.fillAllFields'));
      return;
    }
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      // onAuthStateChanged in App.tsx handles redirect automatically
    } catch (error) {
      Alert.alert(t('auth.loginFailedTitle'), getAuthErrorMessage(error as Error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('auth.loginTitle')}</Text>

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
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{t('auth.loginButton')}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>{t('auth.noAccount')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#38b6ff',
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
    color: '#38b6ff',
    fontSize: 14,
    marginTop: 8,
  },
});