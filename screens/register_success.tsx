import { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Pressable
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>Registration Successful!</Text>
      <Text style={styles.subtitle}>Your account has been created.</Text>

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
          Continue to Login
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
    color: '#1565c0',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1565c0',
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
    backgroundColor: '#1565c0',
    borderColor: '#1565c0',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderColor: '#1565c0',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSolid: {
    color: '#fff',
  },
  buttonTextOutline: {
    color: '#1565c0',
  },
});