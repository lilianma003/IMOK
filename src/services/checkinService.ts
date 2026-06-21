import AsyncStorage from '@react-native-async-storage/async-storage';

const CHECKIN_KEY = 'checkin_state';

export interface CheckinState {
  isActive: boolean;
  endTime: number | null;
  gracePeriodEnd: number | null;
  notificationId: string | null;
  status: 'idle' | 'running' | 'grace' | 'triggered';
}

const DEFAULT_STATE: CheckinState = {
  isActive: false,
  endTime: null,
  gracePeriodEnd: null,
  notificationId: null,
  status: 'idle',
};

export const getCheckinState = async (): Promise<CheckinState> => {
  try {
    const raw = await AsyncStorage.getItem(CHECKIN_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
};

export const saveCheckinState = async (state: CheckinState): Promise<void> => {
  await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(state));
};

export const clearCheckinState = async (): Promise<void> => {
  await AsyncStorage.setItem(CHECKIN_KEY, JSON.stringify(DEFAULT_STATE));
};