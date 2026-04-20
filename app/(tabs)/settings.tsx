import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

const VOICES = [
  { label: 'Joanna (Female)', value: 'Joanna' },
  { label: 'Matthew (Male)', value: 'Matthew' },
  { label: 'Ruth (Female)', value: 'Ruth' },
  { label: 'Stephen (Male)', value: 'Stephen' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { email, setEmail, voice, setVoice } = useAuth();

  const handleSignOut = () => {
    setEmail('');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>{email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PERSONA</Text>
        {VOICES.map((v) => (
          <TouchableOpacity
            key={v.value}
            style={[styles.voiceOption, voice === v.value && styles.voiceOptionSelected]}
            onPress={() => setVoice(v.value)}
          >
            <Text style={[styles.voiceLabel, voice === v.value && styles.voiceLabelSelected]}>
              {v.label}
            </Text>
            {voice === v.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 16, color: '#999', marginTop: 4 },
  section: { marginTop: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#bbb', letterSpacing: 1.5, marginBottom: 12 },
  voiceOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee', borderRadius: 10,
    padding: 14, marginBottom: 8,
  },
  voiceOptionSelected: { borderColor: '#111', backgroundColor: '#f9f9f9' },
  voiceLabel: { fontSize: 15, color: '#666' },
  voiceLabelSelected: { color: '#111', fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#111' },
  signOutButton: {
    borderWidth: 1, borderColor: '#e53e3e', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  signOutText: { color: '#e53e3e', fontSize: 16, fontWeight: '600' },
});