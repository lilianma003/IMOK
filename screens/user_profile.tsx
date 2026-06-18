import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Alert, ActivityIndicator, Platform
} from 'react-native';
import { db, auth } from '../src/config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

interface EmergencyProfile {
  name: string;
  nationality: string;
  languages: string;
  medicalInfo: string;
  attorneyContact: string;
  iceCaseNumber: string;
}

export default function UserProfile() {
  const [profile, setProfile] = useState<EmergencyProfile>({
    name: '',
    nationality: '',
    languages: '',
    medicalInfo: '',
    attorneyContact: '',
    iceCaseNumber: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: keyof EmergencyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not logged in', 'Please log in to save your profile.');
      return;
    }
    try {
      setSaving(true);
      await setDoc(doc(db, 'users', user.uid), { emergencyProfile: profile }, { merge: true });
      setSaved(true);
    } catch (error) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Emergency Profile</Text>
      <Text style={styles.subheading}>
        This information will be shared with your emergency contacts if you trigger SOS.
      </Text>

      <Field label="Full Name" placeholder="Your legal name">
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={v => handleChange('name', v)}
          placeholder="Your legal name"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="Nationality" placeholder="e.g. Chinese, Mexican">
        <TextInput
          style={styles.input}
          value={profile.nationality}
          onChangeText={v => handleChange('nationality', v)}
          placeholder="e.g. Chinese, Mexican"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="Languages Spoken" placeholder="e.g. Mandarin, Spanish, English">
        <TextInput
          style={styles.input}
          value={profile.languages}
          onChangeText={v => handleChange('languages', v)}
          placeholder="e.g. Mandarin, Spanish, English"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="Medical Information" placeholder="Allergies, conditions, medications">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={profile.medicalInfo}
          onChangeText={v => handleChange('medicalInfo', v)}
          placeholder="Allergies, conditions, medications"
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
        />
      </Field>

      <Field label="Attorney Contact" placeholder="Name and phone number">
        <TextInput
          style={styles.input}
          value={profile.attorneyContact}
          onChangeText={v => handleChange('attorneyContact', v)}
          placeholder="Name and phone number"
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label="ICE Case Number" placeholder="Leave blank if unknown">
        <TextInput
          style={styles.input}
          value={profile.iceCaseNumber}
          onChangeText={v => handleChange('iceCaseNumber', v)}
          placeholder="Leave blank if unknown"
          placeholderTextColor="#aaa"
        />
      </Field>

      <TouchableOpacity
        style={[styles.button, saved && styles.buttonSaved]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{saved ? '✓ Saved' : 'Save Profile'}</Text>
        }
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
    marginTop: 16,
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
    lineHeight: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1565c0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSaved: {
    backgroundColor: '#2e7d32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});