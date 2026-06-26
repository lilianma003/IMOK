import * as Notifications from 'expo-notifications';
import { doc, updateDoc, getDocs, collection, where, query } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const setupNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,   // replaces shouldShowAlert
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const setupNotificationCategories = async (): Promise<void> => {
  await Notifications.setNotificationCategoryAsync('checkin_response', [
    {
      identifier: 'YES',
      buttonTitle: "Yes, I'm okay",
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'NO',
      buttonTitle: 'No, send help',
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);
};

export const registerFCMToken = async (userId: string): Promise<void> => {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id',  // ← make sure this is set
    });
    console.log('FCM token registered:', token.data);
    await updateDoc(doc(db, 'users', userId), { fcmToken: token.data });
  } catch (error) {
    console.log('Token registration error:', error);
  }
};

export const scheduleCheckinNotification = async (
  secondsFromNow: number
): Promise<string> => {
  await cancelAllCheckinNotifications();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check-in required',
      body: "Are you okay? Tap YES to confirm or NO to alert your emergency contacts.",
      data: { type: 'checkin' },
      categoryIdentifier: 'checkin_response',
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
      repeats: false,
    },
  });

  return id;
};

export const scheduleGraceExpiredNotification = async (
  secondsFromNow: number
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Emergency alert sent',
      body: 'You did not respond in time. Your emergency contacts have been notified.',
      data: { type: 'grace_expired' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
      repeats: false,
    },
  });

  return id;
};

export const sendImmediateNotification = async (
  title: string,
  body: string,
  type: string
): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
  });
};

export const cancelAllCheckinNotifications = async (): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    const type = n.content.data?.type;
    if (type === 'checkin' || type === 'grace_expired') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
};

export const sendEmergencyPush = async (
  fcmTokens: string[],
  senderName: string,
  locationUrl: string | null
): Promise<void> => {
  const messages = fcmTokens.map(token => ({
    to: token,
    sound: 'default',
    title: 'Emergency alert',
    body: `${senderName} may need help!${locationUrl ? ' Tap to see location.' : ''}`,
    data: {
      type: 'emergency_alert',
      senderName,
      locationUrl: locationUrl ?? '',
    },
    priority: 'high',
    channelId: 'emergency_alerts',
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  console.log('Push result:', result);
};