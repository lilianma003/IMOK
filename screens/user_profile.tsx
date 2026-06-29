import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../src/config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

interface EmergencyProfile {
  name: string;
  nationality: string;
  languages: string;
  medicalInfo: string;
  attorneyContact: string;
}

export default function UserProfile() {
  const { t } = useTranslation();

  const [profile, setProfile] = useState<EmergencyProfile>({
    name: '',
    nationality: '',
    languages: '',
    medicalInfo: '',
    attorneyContact: '',
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
      Alert.alert(t('profile.notLoggedInTitle'), t('profile.notLoggedInMessage'));
      return;
    }
    try {
      setSaving(true);
      await setDoc(doc(db, 'users', user.uid), { emergencyProfile: profile }, { merge: true });
      setSaved(true);
    } catch (error) {
      Alert.alert(t('profile.errorTitle'), t('profile.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

return (
  
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={20}
  >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
    <LanguageToggle />
      <Text style={styles.heading}>{t('profile.heading')}</Text>

      <Text style={styles.subheading}>
        {t('profile.subheading')}
      </Text>

      <Field label={t('profile.fullName')}>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={v => handleChange('name', v)}
          placeholder={t('profile.fullNamePlaceholder')}
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label={t('profile.nationality')}>
        <TextInput
          style={styles.input}
          value={profile.nationality}
          onChangeText={v => handleChange('nationality', v)}
          placeholder={t('profile.nationalityPlaceholder')}
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label={t('profile.languages')}>
        <TextInput
          style={styles.input}
          value={profile.languages}
          onChangeText={v => handleChange('languages', v)}
          placeholder={t('profile.languagesPlaceholder')}
          placeholderTextColor="#aaa"
        />
      </Field>

      <Field label={t('profile.medicalInfo')}>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={profile.medicalInfo}
          onChangeText={v => handleChange('medicalInfo', v)}
          placeholder={t('profile.medicalInfoPlaceholder')}
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
        />
      </Field>

      <Field label={t('profile.attorneyContact')}>
        <TextInput
          style={styles.input}
          value={profile.attorneyContact}
          onChangeText={v => handleChange('attorneyContact', v)}
          placeholder={t('profile.attorneyContactPlaceholder')}
          placeholderTextColor="#aaa"
        />
      </Field>

      <TouchableOpacity
        style={[styles.button, saved && styles.buttonSaved]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {saved ? t('profile.saved') : t('profile.saveButton')}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'user_language';

function LanguageToggle() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  const toggleLanguage = async () => {
    const newLang = isZh ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
    await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
  };

  return (
    <TouchableOpacity onPress={toggleLanguage} style={toggleStyles.toggle}>
      <Text style={[toggleStyles.option, !isZh && toggleStyles.active]}>EN</Text>
      <Text style={toggleStyles.divider}>|</Text>
      <Text style={[toggleStyles.option, isZh && toggleStyles.active]}>中文</Text>
    </TouchableOpacity>
  );
}

const toggleStyles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  option: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
  },
  active: {
    color: '#38b6ff',
  },
  divider: {
    marginHorizontal: 6,
    color: '#ccc',
  },
});

const styles = StyleSheet.create({
  container: {
  flexGrow: 1,
  backgroundColor: '#fff',
  paddingHorizontal: 24,
  paddingTop: 20,
  paddingBottom: 48,
},
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#5170ff',
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
    backgroundColor: '#5170ff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
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