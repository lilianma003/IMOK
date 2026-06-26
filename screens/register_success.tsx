import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Pressable
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  RegisterSuccess: undefined;
};

type RegisterSuccessNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterSuccess'>;

interface Props {
  navigation: RegisterSuccessNavigationProp;
}

export default function RegisterSuccess({ navigation }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>{t('registerSuccess.title')}</Text>
      <Text style={styles.subtitle}>{t('registerSuccess.subtitle')}</Text>

      <Pressable
        onPressIn={() => setHovered(true)}
        onPressOut={() => setHovered(false)}
        onPress={() => navigation.navigate('Login')}
        style={[
          styles.button,
          hovered ? styles.buttonOutline : styles.buttonSolid
        ]}
      >
        <Text style={[
          styles.buttonText,
          hovered ? styles.buttonTextOutline : styles.buttonTextSolid
        ]}>
          {t('registerSuccess.continueButton')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  checkmark: {
    fontSize: 64,
    color: '#38b6ff',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5170ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 48,
    textAlign: 'center',
  },
  button: {
    padding: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonSolid: {
    backgroundColor: '#5170ff',
    borderColor: '#5170ff',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderColor: '#5170ff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSolid: {
    color: '#fff',
  },
  buttonTextOutline: {
    color: '#5170ff',
  },
});