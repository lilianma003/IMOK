import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, AppState, AppStateStatus
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { auth } from '../src/config/firebaseConfig';
import {
  getCheckinState,
  saveCheckinState,
  clearCheckinState,
  CheckinState,
} from '../src/services/checkinService';
import {
  setupNotificationHandler,
  requestNotificationPermissions,
  setupNotificationCategories,
  scheduleCheckinNotification,
  scheduleGraceExpiredNotification,
  cancelAllCheckinNotifications,
  sendImmediateNotification,
  sendEmergencyPush,
} from '../src/services/notificationService';
import {
  requestLocationPermissions,
  getCurrentLocation,
} from '../src/services/locationService';
import { getContacts } from '../src/services/contactService';
import { getUserDocument } from '../src/services/userService';
import SOSButton from './sos_button';

setupNotificationHandler();

const GRACE_PERIOD_SECONDS = 15 * 60;

const DURATION_OPTIONS = [
  { label: '1 min', value: 1 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '4 hours', value: 240 },
];

export default function CheckinTimer(): React.JSX.Element {
  const [state, setState] = useState<CheckinState>({
    isActive: false,
    endTime: null,
    gracePeriodEnd: null,
    notificationId: null,
    durationSeconds: null,
    status: 'idle',
  });
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    initializeAsync();

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        syncStateFromStorage();
      }
      appStateRef.current = nextState;
    });

    const notifSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      appStateSub.remove();
      notifSub.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (state.isActive) {
      intervalRef.current = setInterval(updateCountdownDisplay, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  const initializeAsync = async (): Promise<void> => {
    await setupNotificationCategories();
    await requestNotificationPermissions();
    await requestLocationPermissions();
    await syncStateFromStorage();
  };

  const syncStateFromStorage = async (): Promise<void> => {
    const saved = await getCheckinState();
    setState(saved);
  };

  const formatMs = (ms: number): string => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const updateCountdownDisplay = useCallback((): void => {
    setState(current => {
      const now = Date.now();
      if (current.status === 'running' && current.endTime) {
        const diff = current.endTime - now;
        setTimeRemaining(diff > 0 ? formatMs(diff) : 'Awaiting your response...');
      } else if (current.status === 'grace' && current.gracePeriodEnd) {
        const diff = current.gracePeriodEnd - now;
        setTimeRemaining(diff > 0 ? `Grace period: ${formatMs(diff)}` : 'Alerting contacts...');
      }
      return current;
    });
  }, []);

  const handleNotificationResponse = useCallback(async (
    response: Notifications.NotificationResponse
  ): Promise<void> => {
    const actionId = response.actionIdentifier;
    const type = response.notification.request.content.data?.type;
    if (type === 'checkin') {
      if (actionId === 'YES') {
        await handleUserOkay();
      } else if (actionId === 'NO') {
        await handleSendAlert();
      }
    }
  }, []);

  // Starts a fresh timer with the given duration
  const runTimer = async (durationSeconds: number): Promise<void> => {
    await cancelAllCheckinNotifications();

    const endTime = Date.now() + durationSeconds * 1000;
    const gracePeriodEnd = endTime + GRACE_PERIOD_SECONDS * 1000;

    const notificationId = await scheduleCheckinNotification(durationSeconds);
    await scheduleGraceExpiredNotification(durationSeconds + GRACE_PERIOD_SECONDS);

    const newState: CheckinState = {
      isActive: true,
      endTime,
      gracePeriodEnd,
      notificationId,
      durationSeconds,
      status: 'running',
    };

    await saveCheckinState(newState);
    setState(newState);
  };

  const startTimer = async (): Promise<void> => {
    const durationSeconds = selectedMinutes * 60;
    await runTimer(durationSeconds);

    Alert.alert(
      'Timer started',
      `You'll receive a check-in in ${selectedMinutes} minute${selectedMinutes > 1 ? 's' : ''}. ` +
      `If you don't respond within 15 minutes after that, your emergency contacts will be alerted.`
    );
  };

  const stopTimer = async (): Promise<void> => {
    await cancelAllCheckinNotifications();
    await clearCheckinState();
    setState({
      isActive: false,
      endTime: null,
      gracePeriodEnd: null,
      notificationId: null,
      durationSeconds: null,
      status: 'idle',
    });
    setTimeRemaining('');
  };

  const triggerEmergencyAlert = async (): Promise<void> => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const [location, userDoc, contacts] = await Promise.all([
      getCurrentLocation(),
      getUserDocument(userId),
      getContacts(userId),
    ]);

    const tokens = contacts
      .filter(c => c.status === 'linked' && c.fcmToken)
      .map(c => c.fcmToken as string);

    if (tokens.length === 0) {
      Alert.alert(
        'No linked contacts',
        'None of your emergency contacts have the IMOK app installed.'
      );
      return;
    }

    await sendEmergencyPush(
      tokens,
      userDoc?.name ?? 'Someone',
      location?.mapsUrl ?? null
    );

    const triggered: CheckinState = { ...state, status: 'triggered' };
    await saveCheckinState(triggered);
    setState(triggered);

    await cancelAllCheckinNotifications();
    await sendImmediateNotification(
      'Alert sent',
      'Your emergency contacts have been notified.',
      'alert_sent'
    );
  };

  // ── Response handlers ────────────────────────────────────────────

  // Timer ended — user confirms they are fully okay, stops timer
  const handleUserOkay = async (): Promise<void> => {
    await stopTimer();
    Alert.alert("Glad you're okay!", 'Timer has been reset.');
  };

  // Timer ended — user is okay for now, restarts same duration
  const handleOkayForNow = async (): Promise<void> => {
    const duration = state.durationSeconds ?? selectedMinutes * 60;
    await runTimer(duration);
    const minutes = Math.round(duration / 60);
    Alert.alert(
      'Timer restarted',
      `Check-in timer restarted for ${minutes} minute${minutes !== 1 ? 's' : ''}.`
    );
  };

  const handleSendAlert = async (): Promise<void> => {
    Alert.alert(
      'Send emergency alert?',
      'This will notify your emergency contacts with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: triggerEmergencyAlert,
        },
      ]
    );
  };

  // ── Status helpers ───────────────────────────────────────────────

  const statusColor = (): string => {
    switch (state.status) {
      case 'running': return '#1565c0';
      case 'grace': return '#f57c00';
      case 'triggered': return '#c62828';
      default: return '#aaa';
    }
  };

  const statusLabel = (): string => {
    switch (state.status) {
      case 'running': return 'Timer running';
      case 'grace': return 'Awaiting response';
      case 'triggered': return 'Alert triggered';
      default: return 'No active timer';
    }
  };

  // Whether timer has expired and we're waiting for a response
  const isAwaitingResponse = (): boolean =>
    state.status === 'grace' ||
    (state.status === 'running' && !!state.endTime && Date.now() >= state.endTime);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Check-in Timer</Text>
      <Text style={styles.subtitle}>
        Set a timer. If you don't respond when it ends, your emergency contacts will be alerted.
      </Text>

      {/* Status box */}
      <View style={[styles.statusBox, { borderColor: statusColor() }]}>
        <Text style={[styles.statusLabel, { color: statusColor() }]}>
          {statusLabel()}
        </Text>
        {state.isActive && timeRemaining !== '' && (
          <Text style={[styles.countdown, { color: statusColor() }]}>
            {timeRemaining}
          </Text>
        )}
      </View>

      {/* Duration picker — idle only */}
      {!state.isActive && (
        <>
          <Text style={styles.sectionLabel}>Select duration:</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.durationButton,
                  selectedMinutes === opt.value && styles.durationButtonSelected,
                ]}
                onPress={() => setSelectedMinutes(opt.value)}
              >
                <Text style={[
                  styles.durationText,
                  selectedMinutes === opt.value && styles.durationTextSelected,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <Text style={styles.startButtonText}>Start check-in timer</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Active timer controls */}
      {state.isActive && (
        <View style={styles.activeControls}>

          {/* Timer expired response options */}
          {(state.status === 'grace' || isAwaitingResponse()) && (
            <>
              <Text style={styles.responsePrompt}>How are you doing?</Text>

              <TouchableOpacity style={styles.okayButton} onPress={handleUserOkay}>
                <Text style={styles.actionButtonText}>I'm okay</Text>
                <Text style={styles.actionButtonSub}>Stop the timer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.okayForNowButton} onPress={handleOkayForNow}>
                <Text style={styles.actionButtonText}>I'm okay for now</Text>
                <Text style={styles.actionButtonSub}>Repeat timer for same duration</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpButton} onPress={handleSendAlert}>
                <Text style={styles.actionButtonText}>Send alert</Text>
                <Text style={styles.actionButtonSub}>Notify emergency contacts now</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Timer still running controls */}
          {state.status === 'running' && !isAwaitingResponse() && (
            <>
              <TouchableOpacity style={styles.okayButton} onPress={handleUserOkay}>
                <Text style={styles.actionButtonText}>I'm okay</Text>
                <Text style={styles.actionButtonSub}>Stop the timer early</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.helpButton} onPress={handleSendAlert}>
                <Text style={styles.actionButtonText}>Send alert now</Text>
                <Text style={styles.actionButtonSub}>Notify emergency contacts immediately</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Always show cancel */}
          <TouchableOpacity style={styles.cancelButton} onPress={stopTimer}>
            <Text style={styles.cancelButtonText}>
              {state.status === 'triggered' ? 'Reset timer' : 'Cancel timer'}
            </Text>
          </TouchableOpacity>

        </View>
      )}

      <SOSButton onTrigger={triggerEmergencyAlert} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  statusBox: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 28,
    minHeight: 90,
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  durationButton: {
    borderWidth: 2,
    borderColor: '#1565c0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  durationButtonSelected: {
    backgroundColor: '#1565c0',
  },
  durationText: {
    color: '#1565c0',
    fontWeight: '600',
    fontSize: 14,
  },
  durationTextSelected: {
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#1565c0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  activeControls: {
    gap: 12,
  },
  responsePrompt: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  okayButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  okayForNowButton: {
    backgroundColor: '#1565c0',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  helpButton: {
    backgroundColor: '#c62828',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtonSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 3,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: '#aaa',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
});