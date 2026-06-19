import * as Notifications from 'expo-notifications';

export const setupNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
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
      buttonTitle: "✅ Yes, I'm okay",
      options: { opensAppToForeground: false },
    },
    {
      identifier: 'NO',
      buttonTitle: '🆘 No, send help',
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);
};

// Schedules the "are you okay?" notification at exact future time
// Uses Android AlarmManager internally for precision
export const scheduleCheckinNotification = async (
  secondsFromNow: number
): Promise<string> => {
  await cancelAllCheckinNotifications();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ Check-in Required',
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

// Schedules the grace period expiry notification
export const scheduleGraceExpiredNotification = async (
  secondsFromNow: number
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🆘 Emergency Alert Sent',
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