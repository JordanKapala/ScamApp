import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { email, setEmail } = useAuth();

  const handleSignOut = () => {
    setEmail('');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>{email}</Text>

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
  signOutButton: {
    borderWidth: 1, borderColor: '#e53e3e', borderRadius: 10,
    padding: 14, alignItems: 'center',
  },
  signOutText: { color: '#e53e3e', fontSize: 16, fontWeight: '600' },
});