import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserProfile() {
  const { i18n } = useTranslation();

  const switchLanguage = async (lang: 'en' | 'zh') => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('user_language', lang);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      <Text style={styles.label}>Language / 语言</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.langButton, i18n.language === 'en' && styles.langButtonActive]}
          onPress={() => switchLanguage('en')}
        >
          <Text style={[styles.langText, i18n.language === 'en' && styles.langTextActive]}>
            English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, i18n.language === 'zh' && styles.langButtonActive]}
          onPress={() => switchLanguage('zh')}
        >
          <Text style={[styles.langText, i18n.language === 'zh' && styles.langTextActive]}>
            中文
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 32 },
  label: { fontSize: 16, color: '#666', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', gap: 12 },
  langButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  langButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  langText: { fontSize: 16, color: '#333' },
  langTextActive: { color: '#fff', fontWeight: 'bold' },
});