import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const GET_URL = 'https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/getConversation';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  timestamp: string;
  date: string;
  duration: string;
  history: Message[];
};

export default function HistoryScreen() {
  const { email } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GET_URL}?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      } else {
        setError('Failed to load conversations');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>Your past scam call sessions</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {conversations.length === 0 && !error && (
        <Text style={styles.emptyText}>No conversations yet. Start one on the Home tab!</Text>
      )}

      {conversations.map((convo, i) => (
        <TouchableOpacity
          key={convo.timestamp}
          style={styles.card}
          onPress={() => setExpandedIndex(expandedIndex === i ? null : i)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardDate}>{convo.date}</Text>
              <Text style={styles.cardMeta}>
                {convo.history.length / 2} exchanges · {formatDuration(convo.duration)}
              </Text>
            </View>
            <Text style={styles.chevron}>{expandedIndex === i ? '▲' : '▼'}</Text>
          </View>

          {expandedIndex === i && (
            <View style={styles.transcript}>
              {convo.history.map((msg, j) => (
                <View
                  key={j}
                  style={[
                    styles.bubble,
                    msg.role === 'user' ? styles.userBubble : styles.aiBubble
                  ]}
                >
                  <Text style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.userText : styles.aiText
                  ]}>
                    {msg.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4, marginBottom: 24 },
  emptyText: { textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 15 },
  error: { color: 'red', marginBottom: 12 },
  card: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12,
    padding: 16, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardMeta: { fontSize: 13, color: '#999', marginTop: 2 },
  chevron: { fontSize: 12, color: '#999' },
  transcript: { marginTop: 16 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10, marginBottom: 8 },
  userBubble: { backgroundColor: '#f0f0f0', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#111', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 14 },
  userText: { color: '#111' },
  aiText: { color: '#fff' },
});