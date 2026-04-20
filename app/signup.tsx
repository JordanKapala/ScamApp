import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useAuth } from "./context/AuthContext";

const SIGNUP_URL =
  "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com/signup";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setEmail: setAuthEmail } = useAuth();

  const handleSignup = async () => {
    setError("");

    if (!email || !password || !confirm) {
      setError("All fields are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(SIGNUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setAuthEmail(email);
        router.replace("/(tabs)/home");
      } else {
        setError(data.message || "Signup failed");
      }
    } catch (e) {
      setError("Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Floating Top-Left Logo */}
      <Image
        source={require("../assets/images/guardiangate.png")}
        style={styles.topLeftLogo}
      />

      <View style={styles.inner}>
        {/* Left Side: Brand Text Section */}
        <View style={styles.leftSection}>
          <Text style={styles.logoText}>Guardian Gate</Text>
          <Text style={styles.tagline}>Protecting Conversations</Text>
        </View>

        {/* Right Side: Signup Box Section */}
        <View style={styles.rightSection}>
          <View style={styles.formCard}>
            <Text style={styles.loginHeader}>Create your Account</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.primaryButton, loading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Creating account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <TouchableOpacity onPress={() => router.push("/")}>
          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Text style={styles.loginLinkText}>Log in.</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topLeftLogo: {
    position: "absolute",
    top: 40,
    left: 40,
    width: 150,
    height: 150,
    resizeMode: "contain",
    zIndex: 10,
  },
  inner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingRight: 40,
  },
  rightSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 56,
    fontFamily: Platform.OS === "ios" ? "System" : "serif",
    fontWeight: "700",
    color: "#00376b",
  },
  tagline: {
    fontSize: 18,
    color: "#8e8e8e",
    marginTop: 8,
    fontWeight: "400",
  },
  formCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#262626",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#efefef",
    borderRadius: 5,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: "#262626",
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#0095f6",
    borderRadius: 5,
    padding: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  error: {
    color: "#ed4956",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
    width: "100%",
  },
  footerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#dbdbdb",
    marginBottom: 20,
  },
  footerText: {
    color: "#8e8e8e",
    fontSize: 14,
  },
  loginLinkText: {
    color: "#0095f6",
    fontWeight: "600",
  },
});
