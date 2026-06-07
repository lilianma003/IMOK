import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Section = {
  title: string;
  content: string[];
};

const sections: Section[] = [
  {
    title: '🛡️ Rights Regardless of Immigration Status',
    content: [
      'You have the right to remain silent. You do not have to answer questions about where you were born, how you entered the country, or your immigration status.',
      'You have the right to refuse to sign any documents without speaking to a lawyer first.',
      'You have the right to speak with a lawyer before answering questions. If you cannot afford one, you can ask for a public defender.',
      'You have the right to be free from unreasonable searches and seizures.',
      'You do not have to open your door unless officers have a warrant signed by a judge.',
    ],
  },
  {
    title: '🚪 If ICE Comes to Your Door',
    content: [
      'Do not open the door. You can speak through the door and ask them to show their warrant.',
      'Ask if they have a judicial warrant signed by a judge. An ICE administrative warrant does NOT give them the right to enter your home.',
      'If they do not have a judicial warrant, wcalmly say: "I do not consent to your entry."',
      'Do not lie or provide false documents.',
      'If they force their way in, do not resist. Clearly state: "I do not consent to this search."',
      'Stay calm and memorize or write down the officers\' names and badge numbers.',
    ],
  },
  {
    title: '🚔 If Stopped by Police',
    content: [
      'Stay calm and keep your hands visible.',
      'You have the right to remain silent. Say clearly: "I am exercising my right to remain silent."',
      'You do not have to consent to a search. Say: "I do not consent to this search."',
      'If you are driving, you must provide your license, registration, and proof of insurance.',
      'Do not physically resist, even if you believe the stop is unlawful.',
      'You have the right to ask: "Am I free to go?" If yes, calmly walk away.',
      'If arrested, say: "I want a lawyer." Do not answer questions until your lawyer is present.',
    ],
  },
];

export default function Resources() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Know Your Rights</Text>
      <Text style={styles.subheader}>
        These rights apply to everyone in the United States, regardless of immigration status.
      </Text>

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