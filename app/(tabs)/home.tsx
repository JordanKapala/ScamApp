import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const CONVERSE_URL =
  "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/converse";
const SAVE_URL =
  "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/saveConversation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ConversationState = "idle" | "recording" | "processing" | "speaking";

export default function HomeScreen() {
  const { email } = useAuth();
  const [state, setState] = useState<ConversationState>("idle");
  const [history, setHistory] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    Audio.requestPermissionsAsync();
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError("");
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setState("recording");
    } catch (e) {
      setError("Could not start recording");
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recordingRef.current) return;
    setState("processing");

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      const response = await fetch(uri!);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch(CONVERSE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, history }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Something went wrong");
        setState("idle");
        return;
      }

      setHistory(data.history);

      setState("speaking");
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${data.audio}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState("idle");
          sound.unloadAsync();
        }
      });
    } catch (e) {
      setError("Network error, please try again");
      setState("idle");
    }
  };

  const handleButton = () => {
    if (state === "idle") startRecording();
    else if (state === "recording") stopRecordingAndSend();
  };

  const endConversation = async () => {
    if (history.length === 0) return;

    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    try {
      await fetch(SAVE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email, history, duration }),
      });
    } catch (e) {
      console.error("Failed to save conversation:", e);
    }

    setHistory([]);
    setError("");
    setState("idle");
    startTimeRef.current = null;
  };

  const buttonLabel = {
    idle: "Tap to Speak",
    recording: "Stop Recording",
    processing: "Analyzing...",
    speaking: "Edna is Speaking...",
  }[state];

  const buttonColor = {
    idle: "#0095f6", // Guardian Blue
    recording: "#ed4956", // Instagram/Guardian Red
    processing: "#8e8e8e",
    speaking: "#00376b",
  }[state];

  return (
    <View style={styles.container}>
      {/* Floating Logo to maintain theme consistency */}
      <Image
        source={require("../../assets/images/guardiangate.png")}
        style={styles.topLeftLogo}
      />

      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Guardian Gate</Text>
        <Text style={styles.subtitle}>Conversation Protection Active</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        contentContainerStyle={styles.transcriptContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        {history.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Initiate a call to begin scambaiting.
            </Text>
          </View>
        )}
        {history.map((msg, i) => (
          <View
            key={i}
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
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: buttonColor }]}
          onPress={handleButton}
          disabled={state === "processing" || state === "speaking"}
        >
          {state === "processing" ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.recordButtonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>

        {history.length > 0 && state === "idle" && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={endConversation}
          >
            <Text style={styles.resetText}>End & Save Conversation</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 40,
  },
  topLeftLogo: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 100,
    height: 100,
    resizeMode: "contain",
    zIndex: 10,
  },
  headerTextContainer: {
    marginTop: 20,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00376b",
    fontFamily: Platform.OS === "ios" ? "System" : "serif",
  },
  subtitle: {
    fontSize: 14,
    color: "#8e8e8e",
    marginTop: 4,
  },
  transcript: {
    flex: 1,
    marginTop: 20,
    backgroundColor: "#fafafa", // Match the input background from login
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#efefef",
  },
  transcriptContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    textAlign: "center",
    color: "#8e8e8e",
    fontSize: 15,
    fontWeight: "500",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: "#fff",
    borderColor: "#dbdbdb",
    alignSelf: "flex-end",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiBubble: {
    backgroundColor: "#00376b",
    borderColor: "#00376b",
    alignSelf: "flex-start",
  },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  userText: { color: "#262626" },
  aiText: { color: "#fff" },
  error: {
    color: "#ed4956",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  controls: {
    paddingVertical: 30,
    backgroundColor: "#fff",
  },
  recordButton: {
    borderRadius: 8, // Changed to match form card corners
    width: "80%",
    height: 50,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  resetButton: {
    alignSelf: "center",
    marginTop: 20,
  },
  resetText: {
    color: "#0095f6",
    fontSize: 14,
    fontWeight: "600",
  },
});
