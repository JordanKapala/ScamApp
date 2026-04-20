import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const GET_URL =
  "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/getConversation";

type Message = {
  role: "user" | "assistant";
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
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [email])
  );

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${GET_URL}?userEmail=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
      } else {
        setError("Failed to load conversations");
      }
    } catch (e) {
      setError("Network error");
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
        <ActivityIndicator size="large" color="#0095f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Theme Consistency: Top-Left Logo */}
      <Image
        source={require("../../assets/images/guardiangate.png")}
        style={styles.topLeftLogo}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Session History</Text>
          <Text style={styles.subtitle}>
            Review past scam-buster interactions
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {conversations.length === 0 && !error && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No sessions found. Start your first protection call today!
            </Text>
          </View>
        )}

        {conversations.map((convo, i) => (
          <TouchableOpacity
            key={convo.timestamp}
            style={[styles.card, expandedIndex === i && styles.cardExpanded]}
            onPress={() => setExpandedIndex(expandedIndex === i ? null : i)}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardDate}>{convo.date}</Text>
                <Text style={styles.cardMeta}>
                  {convo.history.length / 2} exchanges ·{" "}
                  {formatDuration(convo.duration)}
                </Text>
              </View>
              <Text style={styles.chevron}>
                {expandedIndex === i ? "▲" : "▼"}
              </Text>
            </View>

            {expandedIndex === i && (
              <View style={styles.transcript}>
                <View style={styles.transcriptDivider} />
                {convo.history.map((msg, j) => (
                  <View
                    key={j}
                    style={[
                      styles.bubble,
                      msg.role === "user" ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.role === "user" ? styles.userText : styles.aiText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topLeftLogo: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 100,
    height: 100,
    resizeMode: "contain",
    zIndex: 10,
  },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  headerContainer: {
    marginTop: 40,
    marginBottom: 24,
    alignItems: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00376b",
    fontFamily: Platform.OS === "ios" ? "System" : "serif",
  },
  subtitle: { fontSize: 14, color: "#8e8e8e", marginTop: 4 },
  emptyContainer: { marginTop: 60, alignItems: "center" },
  emptyText: {
    textAlign: "center",
    color: "#8e8e8e",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  error: {
    color: "#ed4956",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardExpanded: {
    borderColor: "#0095f6", // Highlight with brand blue when open
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: { fontSize: 16, fontWeight: "600", color: "#262626" },
  cardMeta: { fontSize: 13, color: "#8e8e8e", marginTop: 4 },
  chevron: { fontSize: 12, color: "#8e8e8e" },
  transcript: { marginTop: 16 },
  transcriptDivider: {
    height: 1,
    backgroundColor: "#efefef",
    marginBottom: 16,
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: "#fff",
    borderColor: "#dbdbdb",
    alignSelf: "flex-end",
  },
  aiBubble: {
    backgroundColor: "#00376b",
    borderColor: "#00376b",
    alignSelf: "flex-start",
  },
  bubbleText: { fontSize: 14, lineHeight: 18 },
  userText: { color: "#262626" },
  aiText: { color: "#fff" },
});
