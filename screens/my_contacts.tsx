import { View, Text, StyleSheet } from 'react-native';

export default function MyContacts() {
  return (
    <View style={styles.container}>
      <Text>My Contacts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});