import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function App() {
  const [message, setMessage] = useState('Tap the button');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => setMessage('It works!')}>
        <Text style={styles.buttonText}>Tap me</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, marginBottom: 20 },
  button: { backgroundColor: '#e63946', padding: 16, borderRadius: 8 },
  buttonText: { color: 'white', fontSize: 16 }
});
