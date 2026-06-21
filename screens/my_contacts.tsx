import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Linking, ActivityIndicator, Alert,
  Animated, TouchableWithoutFeedback, Dimensions, Platform
} from 'react-native';
import { auth } from '../src/config/firebaseConfig';
import {
  getContacts, addContact as addContactToFirebase,
  deleteContact as deleteContactFromFirebase, Contact,
} from '../src/services/contactService';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 280;

const INVITE_MESSAGE =
  `Hey! I'm using IMOK, a personal safety app that lets trusted contacts know if I need help. Download it here: https://play.google.com/store/apps/details?id=com.lilianma003.imOK`;

export default function MyContacts(): React.JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);

  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const data = await getContacts(userId);
        setContacts(data);
      } catch {
        Alert.alert('Error', 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const openSheet = () => {
    setSheetOpen(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SHEET_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSheetOpen(false));
  };

  const handleInvitePhone = () => {
    closeSheet();
    const smsUrl = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(INVITE_MESSAGE)}`
      : `sms:?body=${encodeURIComponent(INVITE_MESSAGE)}`;
    Linking.openURL(smsUrl);
  };

  const handleInviteEmail = () => {
    closeSheet();
    const subject = encodeURIComponent('Join me on IMOK');
    const body = encodeURIComponent(INVITE_MESSAGE);
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleAddContact = async (): Promise<void> => {
    if (!name.trim() || !phone.trim() || !email.trim()) return;
    if (!userId) return;
    try {
      setSaving(true);
      await addContactToFirebase(userId, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      const updated = await getContacts(userId);
      setContacts(updated);
      setName('');
      setPhone('');
      setEmail('');
    } catch {
      Alert.alert('Error', 'Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contactId: string): Promise<void> => {
    if (!userId) return;
    try {
      await deleteContactFromFirebase(userId, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Scrollable content */}
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Emergency Contacts</Text>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Email (must have IMOK app)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.addButton} onPress={handleAddContact} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.addButtonText}>Add Contact</Text>
              }
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
              <Text style={item.status === 'linked' ? styles.linked : styles.notLinked}>
                {item.status === 'linked' ? 'Has IMOK app' : 'Not on IMOK'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Text style={styles.actionCall}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL(`sms:${item.phone}`)}>
                <Text style={styles.actionText}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts yet. Add one above.</Text>
        }
      />

      {/* Fixed bottom bar with invite button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.inviteButton} onPress={openSheet}>
          <Text style={styles.inviteButtonText}>+ Invite Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay + bottom sheet */}
      {sheetOpen && (
        <>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlayAnim },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY: sheetAnim }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Choose a method below to invite trusted contacts to the app
            </Text>

            <TouchableOpacity style={styles.methodButton} onPress={handleInvitePhone}>
              <View style={[styles.methodIcon, { backgroundColor: '#E1F5EE' }]}>
                <Text style={{ fontSize: 20 }}>💬</Text>
              </View>
              <View>
                <Text style={styles.methodLabel}>Send via messages</Text>
                <Text style={styles.methodSub}>Opens your messages app</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.methodButton} onPress={handleInviteEmail}>
              <View style={[styles.methodIcon, { backgroundColor: '#E6F1FB' }]}>
                <Text style={{ fontSize: 20 }}>✉️</Text>
              </View>
              <View>
                <Text style={styles.methodLabel}>Send via email</Text>
                <Text style={styles.methodSub}>Opens your email app</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // space for bottom bar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#458cff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  linked: {
    fontSize: 11,
    color: '#0F6E56',
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  notLinked: {
    fontSize: 11,
    color: '#854F0B',
    backgroundColor: '#FAEEDA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCall: {
    color: '#458cff',
    fontWeight: '600',
  },
  actionText: {
    color: '#1565c0',
    fontWeight: '600',
  },
  actionDelete: {
    color: '#c62828',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
    fontSize: 15,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    padding: 12,
    alignItems: 'center',
  },
  inviteButton: {
    backgroundColor: '#1565c0',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  methodSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
});