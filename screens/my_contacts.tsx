import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Linking, ActivityIndicator, Alert
} from 'react-native';
import { auth } from '../src/config/firebaseConfig';
import {
  getContacts,
  addContact as addContactToFirebase,
  deleteContact as deleteContactFromFirebase,
  Contact,
} from '../src/services/contactService';

export default function MyContacts(): React.JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const userId = auth.currentUser?.uid;

  // Load contacts from Firebase on mount
  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const data = await getContacts(userId);
        setContacts(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to load contacts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleAddContact = async (): Promise<void> => {
    if (!name.trim() || !phone.trim()) return;
    if (!userId) return;
    try {
      setSaving(true);
      const id = await addContactToFirebase(userId, {
        name: name.trim(),
        phone: phone.trim(),
      });
      setContacts(prev => [...prev, { id, name: name.trim(), phone: phone.trim() }]);
      setName('');
      setPhone('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contactId: string): Promise<void> => {
    if (!userId) return;
    try {
      await deleteContactFromFirebase(userId, contactId);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const callContact = (phone: string): void => {
    Linking.openURL(`tel:${phone}`);
  };

  const textContact = (phone: string): void => {
    Linking.openURL(`sms:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#458cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddContact}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.addButtonText}>Add Contact</Text>
        }
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => callContact(item.phone)}>
                <Text style={styles.actionCall}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => textContact(item.phone)}>
                <Text style={styles.actionText}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteContact(item.id)}>
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts yet. Add one above.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});