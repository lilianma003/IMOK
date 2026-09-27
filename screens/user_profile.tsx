import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, ScrollView,
  Alert, ActivityIndicator, Platform, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../src/config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserDocument, uploadProfilePicture } from '../src/services/userService';

const LANGUAGE_KEY = 'user_language';

const LANGUAGES: { code: 'en' | 'zh' | 'es'; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'ES' },
];

interface EmergencyProfile {
  name: string;
  nationality: string;
  languages: string;
  medicalInfo: string;
  attorneyContact: string;
}

export default function UserProfile(): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState<EmergencyProfile>({
    name: '',
    nationality: '',
    languages: '',
    medicalInfo: '',
    attorneyContact: '',
  });
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Load existing profile + picture on mount
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) { setLoadingProfile(false); return; }
      try {
        const userDoc = await getUserDocument(user.uid);
        if (userDoc) {
          setProfilePicture(userDoc.profilePicture ?? '');
          if (userDoc.emergencyProfile) {
            setProfile(userDoc.emergencyProfile);
          }
        }
      } catch (error) {
        console.log('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof EmergencyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (): Promise<void> => {
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

  const handlePickPhoto = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      setUploadingPhoto(true);
      const uri = result.assets[0].uri;
      const url = await uploadProfilePicture(user.uid, uri);
      setProfilePicture(url);
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      console.log('Photo upload error:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleTakePhoto = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    try {
      setUploadingPhoto(true);
      const uri = result.assets[0].uri;
      const url = await uploadProfilePicture(user.uid, uri);
      setProfilePicture(url);
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoPress = (): void => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickPhoto },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const selectLanguage = async (code: 'en' | 'zh' | 'es'): Promise<void> => {
    i18n.changeLanguage(code);
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
  };

  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5170ff" />
      </View>
    );
  }

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
        {/* Language toggle */}
        <View style={toggleStyles.toggle}>
          {LANGUAGES.map(({ code, label }, index) => (
            <React.Fragment key={code}>
              {index > 0 && <Text style={toggleStyles.divider}>|</Text>}
              <TouchableOpacity onPress={() => selectLanguage(code)}>
                <Text style={[
                  toggleStyles.option,
                  i18n.language === code && toggleStyles.active,
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.heading}>{t('profile.heading')}</Text>
        <Text style={styles.subheading}>{t('profile.subheading')}</Text>

        {/* Profile picture */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePhotoPress}
          disabled={uploadingPhoto}
          activeOpacity={0.8}
        >
          {uploadingPhoto ? (
            <View style={styles.avatarPlaceholder}>
              <ActivityIndicator color="#5170ff" size="large" />
            </View>
          ) : profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {profile.name ? profile.name[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change photo</Text>

        {/* Emergency profile fields */}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    marginBottom: 24,
    lineHeight: 20,
  },

  // Avatar
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#5170ff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f4ff',
    borderWidth: 3,
    borderColor: '#5170ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#5170ff',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5170ff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarBadgeText: {
    color: '#fff',
    fontSize: 14,
  },
  avatarHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
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