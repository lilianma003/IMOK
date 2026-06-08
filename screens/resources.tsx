import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

type Section = {
  title: string;
  content: string[];
};

export default function Resources() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<number | null>(null);

  const sections = t('resources.sections', { returnObjects: true }) as Section[];

  const toggle = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{t('resources.title')}</Text>
      <Text style={styles.subheader}>{t('resources.subheader')}</Text>

      {sections.map((section, index) => (
        <View key={index} style={styles.card}>
          <TouchableOpacity onPress={() => toggle(index)} style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.chevron}>{expanded === index ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {expanded === index && (
            <View style={styles.cardBody}>
              {section.content.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  subheader: { fontSize: 14, color: '#555', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, color: '#1a1a1a' },
  chevron: { fontSize: 12, color: '#888', marginLeft: 8 },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
  bulletRow: { flexDirection: 'row', marginBottom: 8 },
  bullet: { fontSize: 14, marginRight: 8, color: '#a0a9f7' },
  bulletText: { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
});