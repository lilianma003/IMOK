import React, { useState, useEffect, useRef } from 'react';
import {
  Pressable, Text, StyleSheet, ActivityIndicator,
  Modal, View, TouchableOpacity, Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

type SOSButtonProps = {
  onTrigger: () => Promise<void> | void;
  disabled?: boolean;
};

const COUNTDOWN_SECONDS = 5;

export default function SOSButton({ onTrigger, disabled }: SOSButtonProps) {
  const { t } = useTranslation();

  const [sending, setSending] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_SECONDS);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Start countdown and progress bar when modal opens
  useEffect(() => {
    if (modalVisible) {
      setCountdown(COUNTDOWN_SECONDS);
      progressAnim.setValue(1);

      // Animate progress bar from full to empty over 5 seconds
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: COUNTDOWN_SECONDS * 1000,
        useNativeDriver: false,
      }).start();

      // Tick countdown every second
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Time's up — dismiss without doing anything
            handleCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [modalVisible]);

  const clearCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    progressAnim.stopAnimation();
  };

  const handleCancel = () => {
    clearCountdown();
    setModalVisible(false);
  };

  const handleConfirm = async () => {
    clearCountdown();
    setModalVisible(false);
    try {
      setSending(true);
      await onTrigger();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('SOS trigger failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handlePress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setModalVisible(true);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={disabled || sending}
        accessibilityRole="button"
        accessibilityLabel={t('sos.accessibilityLabel')}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (disabled || sending) && styles.buttonDisabled,
        ]}
      >
        {sending ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.buttonText}>{t('sos.button')}</Text>
        )}
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressBar, { width: progressWidth }]}
              />
            </View>

            {/* Countdown instruction */}
            <Text style={styles.countdownText}>
              {t('sos.countdownPrefix')}{' '}
              <Text style={styles.countdownNumber}>{countdown}</Text>
              {' '}{t('sos.countdownSuffix', { count: countdown })}
            </Text>

            <Text style={styles.title}>{t('sos.confirmTitle')}</Text>
            <Text style={styles.body}>
              {t('sos.body')}
            </Text>

            {/* Confirm button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>{t('sos.sendNow')}</Text>
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>{t('sos.cancel')}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
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

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 2,
  },

  // Countdown
  countdownText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D32F2F',
    fontVariant: ['tabular-nums'],
  },

  // Content
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },

  // Buttons
  confirmButton: {
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
});