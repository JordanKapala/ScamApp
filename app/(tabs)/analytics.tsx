import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const GET_URL =
  "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/getConversation";
const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 48;
const CHART_HEIGHT = 140;

type Message = { role: "user" | "assistant"; content: string };
type Conversation = {
  timestamp: string;
  date: string;
  duration: string;
  history: Message[];
};

function median(arr: number[]) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function formatSecs(s: number) {
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
}

function groupByDay(convos: Conversation[]) {
  const map: Record<string, number> = {};
  convos.forEach((c) => {
    const label = c.date ?? "Unknown";
    map[label] = (map[label] ?? 0) + 1;
  });
  const entries = Object.entries(map);
  return entries.slice(-7);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BarChart({
  data,
  title,
  unit = "",
}: {
  data: [string, number][];
  title: string;
  unit?: string;
}) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(([, v]) => v), 1);
  const barWidth = Math.min(36, (CHART_WIDTH - 24) / data.length - 8);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartArea}>
        {data.map(([label, value], i) => {
          const barH = Math.max(4, (value / maxVal) * CHART_HEIGHT);
          return (
            <View key={i} style={styles.barGroup}>
              <Text style={styles.barValueLabel}>
                {unit === "s" ? formatSecs(value) : value}
              </Text>
              <View style={[styles.bar, { height: barH, width: barWidth }]} />
              <Text style={styles.barLabel} numberOfLines={1}>
                {label.length > 5 ? label.slice(0, 5) : label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { email } = useAuth();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!email) return;
        setLoading(true);
        setError("");
        try {
          const res = await fetch(
            `${GET_URL}?userEmail=${encodeURIComponent(email)}`
          );
          const data = await res.json();
          if (active) {
            if (data.success) setConvos(data.conversations);
            else setError("Failed to load data");
          }
        } catch {
          if (active) setError("Network error");
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [email])
  );

  const durations = convos.map((c) => parseInt(c.duration ?? "0"));
  const exchanges = convos.map((c) => Math.floor(c.history.length / 2));

  const totalCalls = convos.length;
  const totalTime = durations.reduce((a, b) => a + b, 0);
  const avgDuration = totalCalls ? totalTime / totalCalls : 0;
  const medDuration = median(durations);
  const maxDuration = totalCalls ? Math.max(...durations) : 0;
  const avgExchanges = totalCalls
    ? exchanges.reduce((a, b) => a + b, 0) / totalCalls
    : 0;
  const medExchanges = median(exchanges);
  const maxExchanges = totalCalls ? Math.max(...exchanges) : 0;

  const callsByDay = groupByDay(convos);

  const durationBySession: [string, number][] = convos
    .slice(-10)
    .map((c, i) => [
      `#${convos.length - 10 + i + 1 < 1 ? i + 1 : convos.length - 10 + i + 1}`,
      parseInt(c.duration ?? "0"),
    ]);

  const exchangesBySession: [string, number][] = convos
    .slice(-10)
    .map((c, i) => [
      `#${convos.length - 10 + i + 1 < 1 ? i + 1 : convos.length - 10 + i + 1}`,
      Math.floor(c.history.length / 2),
    ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0095f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (totalCalls === 0) {
    return (
      <View style={styles.centered}>
        <Image
          source={require("../../assets/images/guardiangate.png")}
          style={styles.emptyLogo}
        />
        <Text style={styles.emptyTitle}>No Data Yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete a session on the Home tab to see your mission analytics.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FIXED LOGO: Move outside of KeyboardAvoidingView and ScrollView.
          This ensures position: 'absolute' pins it to the root View, 
          preventing it from moving when internal content is scrolled.
      */}
      <Image
        source={require("../../assets/images/guardiangate.png")}
        style={styles.topLeftLogo}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Protection Performance Metrics</Text>
          </View>

          <Text style={styles.sectionHeader}>MISSION OVERVIEW</Text>
          <View style={styles.statRow}>
            <StatCard label="Total Calls" value={String(totalCalls)} />
            <StatCard label="Total Time" value={formatSecs(totalTime)} />
          </View>

          <Text style={styles.sectionHeader}>CALL DURATION</Text>
          <View style={styles.statRow}>
            <StatCard label="Average" value={formatSecs(avgDuration)} />
            <StatCard label="Median" value={formatSecs(medDuration)} />
            <StatCard label="Longest" value={formatSecs(maxDuration)} />
          </View>

          <BarChart
            data={durationBySession}
            title="Duration per session (last 10)"
            unit="s"
          />

          <Text style={styles.sectionHeader}>EXCHANGES PER CALL</Text>
          <View style={styles.statRow}>
            <StatCard label="Average" value={avgExchanges.toFixed(1)} />
            <StatCard label="Median" value={String(medExchanges)} />
            <StatCard label="Most" value={String(maxExchanges)} />
          </View>

          <BarChart
            data={exchangesBySession}
            title="Exchanges per session (last 10)"
          />

          {callsByDay.length > 1 && (
            <>
              <Text style={styles.sectionHeader}>CALLS OVER TIME</Text>
              <BarChart data={callsByDay} title="Calls per day" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topLeftLogo: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 100,
    height: 100,
    resizeMode: "contain",
    zIndex: 999, // Ensures logo sits above the ScrollView content
    elevation: 10, // Android specific zIndex support
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerContainer: {
    marginTop: 120, // Increased to ensure text starts clearly below fixed logo
    alignItems: "center",
    marginBottom: 28,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00376b",
    fontFamily: Platform.OS === "ios" ? "System" : "serif",
  },
  subtitle: { fontSize: 15, color: "#8e8e8e", marginTop: 4 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00376b",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 16,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#262626" },
  statLabel: {
    fontSize: 12,
    color: "#8e8e8e",
    marginTop: 4,
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#efefef",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 13,
    color: "#8e8e8e",
    marginBottom: 16,
    fontWeight: "600",
  },
  chartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: CHART_HEIGHT + 40,
    gap: 8,
  },
  barGroup: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { backgroundColor: "#0095f6", borderRadius: 4 },
  barLabel: {
    fontSize: 9,
    color: "#8e8e8e",
    marginTop: 6,
    textAlign: "center",
  },
  barValueLabel: {
    fontSize: 9,
    color: "#00376b",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  emptyLogo: { width: 100, height: 100, marginBottom: 20, opacity: 0.5 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00376b",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8e8e8e",
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: { color: "#ed4956", fontSize: 15, fontWeight: "600" },
});
