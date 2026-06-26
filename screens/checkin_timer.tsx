import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, AppState, AppStateStatus,
  Modal, FlatList, Animated, Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
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
const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const SECONDS = Array.from({ length: 60 }, (_, i) => i);

// Pad single digits with leading zero
const pad = (n: number): string => String(n).padStart(2, '0');

interface WheelPickerProps {
  data: number[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
}

function WheelPicker({ data, selectedIndex, onChange, label }: WheelPickerProps): React.JSX.Element {
  const flatListRef = useRef<FlatList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: selectedIndex,
        animated: false,
      });
    }, 100);
  }, []);

  const handleMomentumEnd = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    onChange(clamped);
    flatListRef.current?.scrollToOffset({
      offset: clamped * ITEM_HEIGHT,
      animated: true,
    });
  };

  const paddedData = [
    ...Array(2).fill(null),
    ...data,
    ...Array(2).fill(null),
  ];

  return (
    <View style={pickerStyles.column}>
      <FlatList
        ref={flatListRef}
        data={paddedData}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        style={{ height: PICKER_HEIGHT }}
        renderItem={({ item, index }) => {
          const dataIndex = index - 2;
          const isSelected = dataIndex === selectedIndex;
          const isNull = item === null;
          return (
            <View style={pickerStyles.item}>
              <Text style={[
                pickerStyles.itemText,
                isSelected && pickerStyles.itemTextSelected,
                isNull && pickerStyles.itemTextNull,
              ]}>
                {isNull ? '' : pad(item)}
              </Text>
            </View>
          );
        }}
      />
      <Text style={pickerStyles.label}>{label}</Text>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  column: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  itemTextSelected: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '500',
  },
  itemTextNull: {
    color: 'transparent',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 6,
  },
});

export default function CheckinTimer(): React.JSX.Element {
  const { t } = useTranslation();

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
  const [settingsVisible, setSettingsVisible] = useState<boolean>(false);

  // Picker state
  const [pickerHours, setPickerHours] = useState<number>(0);
  const [pickerMinutes, setPickerMinutes] = useState<number>(30);
  const [pickerSeconds, setPickerSeconds] = useState<number>(0);

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
    if (h > 0) return `${h}${t('checkin.unitH')} ${m}${t('checkin.unitM')} ${s}${t('checkin.unitS')}`;
    if (m > 0) return `${m}${t('checkin.unitM')} ${s}${t('checkin.unitS')}`;
    return `${s}${t('checkin.unitS')}`;
  };

  const updateCountdownDisplay = useCallback((): void => {
    setState(current => {
      const now = Date.now();
      if (current.status === 'running' && current.endTime) {
        const diff = current.endTime - now;
        setTimeRemaining(diff > 0 ? formatMs(diff) : t('checkin.awaitingResponse'));
      } else if (current.status === 'grace' && current.gracePeriodEnd) {
        const diff = current.gracePeriodEnd - now;
        setTimeRemaining(diff > 0 ? `${t('checkin.gracePeriodPrefix')}${formatMs(diff)}` : t('checkin.alertingContacts'));
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
      if (actionId === 'YES') await handleUserOkay();
      else if (actionId === 'NO') await handleSendAlert();
    }
  }, []);

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
    const durationSeconds = pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds;
    if (durationSeconds === 0) {
      Alert.alert(t('checkin.invalidDurationTitle'), t('checkin.invalidDurationMessage'));
      return;
    }
    await runTimer(durationSeconds);
    const h = pickerHours > 0 ? `${pickerHours}${t('checkin.unitH')} ` : '';
    const m = pickerMinutes > 0 ? `${pickerMinutes}${t('checkin.unitM')} ` : '';
    const s = pickerSeconds > 0 ? `${pickerSeconds}${t('checkin.unitS')}` : '';
    Alert.alert(
      t('checkin.timerStartedTitle'),
      t('checkin.timerStartedMessage', { duration: `${h}${m}${s}` })
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
      Alert.alert(t('checkin.noLinkedContactsTitle'), t('checkin.noLinkedContactsMessage'));
      return;
    }
    await sendEmergencyPush(tokens, userDoc?.name ?? t('checkin.someoneDefaultName'), location?.mapsUrl ?? null);
    const triggered: CheckinState = { ...state, status: 'triggered' };
    await saveCheckinState(triggered);
    setState(triggered);
    await cancelAllCheckinNotifications();
    await sendImmediateNotification(t('checkin.alertSentTitle'), t('checkin.alertSentMessage'), 'alert_sent');
  };

  const handleUserOkay = async (): Promise<void> => {
    await stopTimer();
    Alert.alert(t('checkin.gladOkayTitle'), t('checkin.gladOkayMessage'));
  };

  const handleOkayForNow = async (): Promise<void> => {
    const duration = state.durationSeconds ?? (pickerHours * 3600 + pickerMinutes * 60 + pickerSeconds);
    await runTimer(duration);
    Alert.alert(t('checkin.timerRestartedTitle'), t('checkin.timerRestartedMessage', { duration: formatMs(duration * 1000) }));
  };

  const handleSendAlert = async (): Promise<void> => {
    Alert.alert(
      t('checkin.sendAlertConfirmTitle'),
      t('checkin.sendAlertConfirmMessage'),
      [
        { text: t('checkin.modalCancel'), style: 'cancel' },
        { text: t('checkin.sendAlertConfirmButton'), style: 'destructive', onPress: triggerEmergencyAlert },
      ]
    );
  };

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
      case 'running': return t('checkin.statusRunning');
      case 'grace': return t('checkin.statusGrace');
      case 'triggered': return t('checkin.statusTriggered');
      default: return t('checkin.statusIdle');
    }
  };

  const isAwaitingResponse = (): boolean =>
    state.status === 'grace' ||
    (state.status === 'running' && !!state.endTime && Date.now() >= state.endTime);

  const selectedDurationLabel = (): string => {
    const parts = [];
    if (pickerHours > 0) parts.push(`${pickerHours}${t('checkin.unitH')}`);
    if (pickerMinutes > 0) parts.push(`${pickerMinutes}${t('checkin.unitM')}`);
    if (pickerSeconds > 0) parts.push(`${pickerSeconds}${t('checkin.unitS')}`);
    return parts.length > 0 ? parts.join(' ') : `0${t('checkin.unitS')}`;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header row with settings button */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('checkin.title')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}
            disabled={state.isActive}
          >
            <Text style={[styles.settingsIcon, state.isActive && styles.settingsIconDisabled]}>
              ⏱
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {t('checkin.subtitle')}
        </Text>

        {/* Selected duration display when idle */}
        {!state.isActive && (
          <TouchableOpacity
            style={styles.durationDisplay}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.durationDisplayLabel}>{t('checkin.durationLabel')}</Text>
            <Text style={styles.durationDisplayValue}>{selectedDurationLabel()}</Text>
            <Text style={styles.durationDisplayEdit}>{t('checkin.tapToChange')}</Text>
          </TouchableOpacity>
        )}

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

        {/* Start button — idle only */}
        {!state.isActive && (
          <TouchableOpacity style={styles.startButton} onPress={startTimer}>
            <Text style={styles.startButtonText}>{t('checkin.startButton')}</Text>
          </TouchableOpacity>
        )}

        {/* Active timer controls */}
        {state.isActive && (
          <View style={styles.activeControls}>
            {(state.status === 'grace' || isAwaitingResponse()) && (
              <>
                <Text style={styles.responsePrompt}>{t('checkin.howAreYou')}</Text>
                <TouchableOpacity style={styles.okayButton} onPress={handleUserOkay}>
                  <Text style={styles.actionButtonText}>{t('checkin.imOkay')}</Text>
                  <Text style={styles.actionButtonSub}>{t('checkin.stopTimer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.okayForNowButton} onPress={handleOkayForNow}>
                  <Text style={styles.actionButtonText}>{t('checkin.imOkayForNow')}</Text>
                  <Text style={styles.actionButtonSub}>{t('checkin.repeatTimer')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.helpButton} onPress={handleSendAlert}>
                  <Text style={styles.actionButtonText}>{t('checkin.sendAlert')}</Text>
                  <Text style={styles.actionButtonSub}>{t('checkin.notifyNow')}</Text>
                </TouchableOpacity>
              </>
            )}
            {state.status === 'running' && !isAwaitingResponse() && (
              <>
                <TouchableOpacity style={styles.okayButton} onPress={handleUserOkay}>
                  <Text style={styles.actionButtonText}>{t('checkin.imOkay')}</Text>
                  <Text style={styles.actionButtonSub}>{t('checkin.stopTimerEarly')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.helpButton} onPress={handleSendAlert}>
                  <Text style={styles.actionButtonText}>{t('checkin.sendAlertNow')}</Text>
                  <Text style={styles.actionButtonSub}>{t('checkin.notifyImmediately')}</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={stopTimer}>
              <Text style={styles.cancelButtonText}>
                {state.status === 'triggered' ? t('checkin.resetTimer') : t('checkin.cancelTimer')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <SOSButton onTrigger={triggerEmergencyAlert} />
      </ScrollView>

      {/* iOS-style duration picker modal */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        />
        <View style={styles.modalSheet}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalCancel}>{t('checkin.modalCancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('checkin.modalTitle')}</Text>
            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.modalDone}>{t('checkin.modalDone')}</Text>
            </TouchableOpacity>
          </View>

          {/* Picker wheels */}
          <View style={styles.pickerContainer}>
            {/* Selection highlight */}
            <View pointerEvents="none" style={styles.selectionHighlight} />

            <WheelPicker
              data={HOURS}
              selectedIndex={pickerHours}
              onChange={setPickerHours}
              label={t('checkin.hours')}
            />
            <WheelPicker
              data={MINUTES}
              selectedIndex={pickerMinutes}
              onChange={setPickerMinutes}
              label={t('checkin.min')}
            />
            <WheelPicker
              data={SECONDS}
              selectedIndex={pickerSeconds}
              onChange={setPickerSeconds}
              label={t('checkin.sec')}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5170ff',
  },
  settingsButton: {
    padding: 6,
  },
  settingsIcon: {
    fontSize: 26,
  },
  settingsIconDisabled: {
    opacity: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  durationDisplay: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#5170ff',
  },
  durationDisplayLabel: {
    fontSize: 12,
    color: '#5170ff',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  durationDisplayValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#5170ff',
    fontVariant: ['tabular-nums'],
  },
  durationDisplayEdit: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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
  startButton: {
    backgroundColor: '#5170ff',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
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
    backgroundColor: '#5170ff',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  modalCancel: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
  },
  modalDone: {
    fontSize: 17,
    color: '#5170ff',
    fontWeight: '600',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 16 + ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
  },
});