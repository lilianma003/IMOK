import { View, Text, StyleSheet } from 'react-native';

export default function Resources() {
  return (
    <View style={styles.container}>
      <Text>Resources</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});