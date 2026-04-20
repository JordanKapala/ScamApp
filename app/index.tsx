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

const API_URL_BASE = "https://ipq6ad0enh.execute-api.us-east-1.amazonaws.com";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setEmail: setAuthEmail } = useAuth();

  const API_URL = API_URL_BASE + "/login";

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        setAuthEmail(email);
        router.replace("/(tabs)/home");
      } else {
        setError(data.message || "Invalid email or password");
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

        {/* Right Side: Login Box Section */}
        <View style={styles.rightSection}>
          <View style={styles.formCard}>
            <Text style={styles.loginHeader}>Login into Guardian Gate</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "Logging in..." : "Log In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.footerText}>
            Don't have an account?{" "}
            <Text style={styles.signUpText}>Sign up.</Text>
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
    width: 150, // Significantly larger size
    height: 150,
    resizeMode: "contain", // Scale uniformly
    zIndex: 10,
  },
  inner: {
    flex: 1,
    flexDirection: "row", // Horizontal side-by-side layout
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
    maxWidth: 380, // Card width
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbdbdb", // Subtle border
    borderRadius: 8,
    padding: 28,
    // Shadow/Elevation for "Box" look
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
    marginBottom: 24, // Space above inputs
    textAlign: "center",
  },
  passwordContainer: {
    width: "100%",
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    color: "#00376b",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: "#0095f6", // Brand blue
    borderRadius: 5,
    padding: 12,
    alignItems: "center",
    width: "100%",
  },
  loginButtonText: {
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
  signUpText: {
    color: "#0095f6",
    fontWeight: "600",
  },
});
