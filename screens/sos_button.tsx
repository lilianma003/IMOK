import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

type SOSButtonProps = {
  onTrigger: () => Promise<void> | void;
  disabled?: boolean;
};

export default function SOSButton({ onTrigger, disabled }: SOSButtonProps) {
  const [sending, setSending] = useState(false);

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Send SOS Alert?',
      'This will immediately notify your emergency contacts with your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Now',
          style: 'destructive',
          onPress: async () => {
            try {
              setSending(true);
              await onTrigger();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              Alert.alert('Failed to send alert', 'Please try again.');
              console.error('SOS trigger failed:', err);
            } finally {
              setSending(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || sending}
      accessibilityRole="button"
      accessibilityLabel="Send SOS emergency alert"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        (disabled || sending) && styles.buttonDisabled,
      ]}
    >
      {sending ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <Text style={styles.buttonText}>SOS</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonPressed: {
    backgroundColor: '#B71C1C',
  },
  buttonDisabled: {
    backgroundColor: '#E0A8A8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
});