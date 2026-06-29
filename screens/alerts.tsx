import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../src/config/firebaseConfig';
import { format } from 'date-fns';
import { EmergencyProfile } from '../src/services/userService';

interface AlertLog {
  id: string;
  senderId: string;
  senderName: string;
  recipientIds: string[];
  timestamp: any;
  type: 'emergency_alert' | 'grace_expired';
  locationUrl?: string;
  emergencyProfile?: EmergencyProfile;
}

export default function AlertsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'alerts'),
      where('involvedUserIds', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: AlertLog[] = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as AlertLog);
      });
      setAlerts(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching alerts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const renderItem = ({ item }: { item: AlertLog }) => {
    const isSentByMe = item.senderId === userId;
    const date = item.timestamp?.toDate ? item.timestamp.toDate() : new Date();
    const formattedDate = format(date, 'MMM d, h:mm a');

    return (
      <View style={[
        styles.bubbleContainer,
        isSentByMe ? styles.sentContainer : styles.receivedContainer
      ]}>
        <View style={[
          styles.bubble,
          isSentByMe ? styles.sentBubble : styles.receivedBubble
        ]}>
          <Text style={styles.senderName}>
            {isSentByMe ? t('alerts.me') : item.senderName}
          </Text>
          <Text style={styles.messageText}>
            {item.type === 'emergency_alert'
              ? t('alerts.emergencyMessage')
              : t('alerts.graceExpiredMessage')}
          </Text>
          {item.emergencyProfile && (
            <View style={styles.profileContainer}>
              <Text style={styles.profileText}>Nationality: {item.emergencyProfile.nationality}</Text>
              <Text style={styles.profileText}>Languages: {item.emergencyProfile.languages}</Text>
              <Text style={styles.profileText}>Medical: {item.emergencyProfile.medicalInfo}</Text>
              <Text style={styles.profileText}>Attorney: {item.emergencyProfile.attorneyContact}</Text>
              {item.emergencyProfile.iceCaseNumber ? (
                <Text style={styles.profileText}>ICE #: {item.emergencyProfile.iceCaseNumber}</Text>
              ) : null}
            </View>
          )}
          {item.locationUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(item.locationUrl!)}>
              <Text style={styles.locationLink}>{t('alerts.locationShared')}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.timestamp}>{formattedDate}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5170ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        inverted
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('alerts.empty')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bubbleContainer: {
    marginVertical: 4,
    flexDirection: 'row',
    width: '100%',
  },
  sentContainer: {
    justifyContent: 'flex-end',
  },
  receivedContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sentBubble: {
    backgroundColor: '#38b6ff',
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#d6d6d6',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: 'rgba(0,0,0,0.5)',
  },
  messageText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  profileContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  profileText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  sentBubbleText: {
    color: '#ffffff',
  },
  locationLink: {
    fontSize: 13,
    color: '#5170ff',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
});
