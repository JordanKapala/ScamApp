import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const CONVERSE_URL = 'https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/converse';
const SAVE_URL = 'https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/saveConversation';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ConversationState = 'idle' | 'recording' | 'processing' | 'speaking';

export default function HomeScreen() {
  const { email, voice } = useAuth();
  const [state, setState] = useState<ConversationState>('idle');
  const [history, setHistory] = useState<Message[]>([]);
  const [error, setError] = useState('');
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
      setError('');
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
      setState('recording');
    } catch (e) {
      setError('Could not start recording');
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recordingRef.current) return;
    setState('processing');

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
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch(CONVERSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, history, voice }),
      });
      const data = await res.json();

      // --- BROWSER CONSOLE LOGGING FOR DEMO ---
      if (typeof window !== 'undefined' && window.console) {
        console.group("--- EDNA INTELLIGENCE REPORT ---");
        console.log("%cRaw AI Thought:", "color: #4CAF50; font-weight: bold;", data.ai_text);
        console.log("%cSSML Voice Adaptation:", "color: #2196F3;", data.ssml_text);
        console.log("%cCurrent Ruleset:", "color: #d46b0f;", data.active_rules);
        console.groupEnd();
      }

      if (!data.success) {
        setError(data.message || 'Something went wrong');
        setState('idle');
        return;
      }

      setHistory(data.history);

      setState('speaking');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${data.audio}` },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setState('idle');
          sound.unloadAsync();
        }
      });
    } catch (e) {
      setError('Network error, please try again');
      setState('idle');
    }
  };

  const handleButton = () => {
    if (state === 'idle') startRecording();
    else if (state === 'recording') stopRecordingAndSend();
  };

  const endConversation = async () => {
    if (history.length === 0) return;

    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    try {
      await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, history, duration }),
      });
    } catch (e) {
      console.error('Failed to save conversation:', e);
    }

    setHistory([]);
    setError('');
    setState('idle');
    startTimeRef.current = null;
  };

  const buttonLabel = {
    idle: 'Tap to Speak',
    recording: 'Tap to Stop',
    processing: 'Processing...',
    speaking: 'Speaking...',
  }[state];

  const buttonColor = {
    idle: '#111',
    recording: '#e53e3e',
    processing: '#999',
    speaking: '#999',
  }[state];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scam Simulator</Text>
      <Text style={styles.subtitle}>Talk to Edna, our AI scam-buster</Text>

      <ScrollView
        ref={scrollRef}
        style={styles.transcript}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
      >
        {history.length === 0 && (
          <Text style={styles.emptyText}>Press the button to start a conversation</Text>
        )}
        {history.map((msg, i) => (
          <View
            key={i}
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
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.recordButton, { backgroundColor: buttonColor }]}
        onPress={handleButton}
        disabled={state === 'processing' || state === 'speaking'}
      >
        {state === 'processing'
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={styles.recordButtonText}>{buttonLabel}</Text>
        }
      </TouchableOpacity>

      {history.length > 0 && state === 'idle' && (
        <TouchableOpacity style={styles.resetButton} onPress={endConversation}>
          <Text style={styles.resetText}>End Conversation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  transcript: { flex: 1, marginBottom: 20 },
  emptyText: { textAlign: 'center', color: '#bbb', marginTop: 40, fontSize: 15 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 10 },
  userBubble: { backgroundColor: '#f0f0f0', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#111', alignSelf: 'flex-start' },
  bubbleText: { fontSize: 15 },
  userText: { color: '#111' },
  aiText: { color: '#fff' },
  error: { color: 'red', textAlign: 'center', marginBottom: 12 },
  recordButton: {
    borderRadius: 60, width: 120, height: 120,
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, elevation: 4,
  },
  recordButtonText: { color: '#fff', fontWeight: '600', fontSize: 15, textAlign: 'center' },
  resetButton: { alignSelf: 'center', marginBottom: 32 },
  resetText: { color: '#999', fontSize: 14 },
});