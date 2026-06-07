import { View, Text, StyleSheet } from 'react-native';

export default function CheckinTimer() {
  return (
    <View style={styles.container}>
      <Text>Check In Timer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});