import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { email, setEmail } = useAuth();

  const handleSignOut = () => {
    setEmail("");
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* FIXED LOGO: Standardized 120x120 pinned logo */}
      <Image
        source={require("../../assets/images/guardiangate.png")}
        style={styles.topLeftLogo}
      />

      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your protection profile</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Account Email</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.versionText}>Guardian Gate v1.0.4</Text>
          <Text style={styles.footerTagline}>
            Defending the vulnerable since 2026.
          </Text>
        </View>
      </View>
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
    zIndex: 999,
    elevation: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 110, // Matching the start point of other pages
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#00376b",
    fontFamily: Platform.OS === "ios" ? "System" : "serif",
  },
  subtitle: {
    fontSize: 15,
    color: "#8e8e8e",
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#efefef",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00376b",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  emailText: {
    fontSize: 16,
    color: "#262626",
    fontWeight: "500",
  },
  section: {
    marginTop: 10,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#dbdbdb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  signOutText: {
    color: "#ed4956", // Keeping the red specifically for destructive actions
    fontSize: 16,
    fontWeight: "600",
  },
  footerInfo: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: "#dbdbdb",
    fontWeight: "600",
  },
  footerTagline: {
    fontSize: 12,
    color: "#dbdbdb",
    marginTop: 4,
  },
});
