import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Image,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../src/stores";
import { AuthService } from "../../src/services/auth.service";
import { UserRepository } from "../../src/repositories";
import type { User } from "../../src/types";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "\u232b", "0", ""];

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithBiometric } = useAuthStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    UserRepository.getFirst().then(setUser);
    AuthService.isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    Animated.sequence([
      Animated.timing(errorOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(errorOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setError(""));
  };

  const shake = () => {
    Vibration.vibrate([0, 40, 40, 40]);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = (key: string) => {
    if (isLoading) return;
    if (key === "\u232b") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "" || pin.length >= PIN_LENGTH) return;
    const newPin = pin + key;
    setPin(newPin);
    if (newPin.length === PIN_LENGTH) setTimeout(() => attemptLogin(newPin), 80);
  };

  const attemptLogin = async (p: string) => {
    setIsLoading(true);
    const ok = await login(p);
    setIsLoading(false);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      shake();
      showError("PIN incorrect — réessayez");
      setPin("");
    }
  };

  const handleBiometric = async () => {
    const ok = await loginWithBiometric();
    if (ok) router.replace("/(tabs)");
    else Alert.alert("Échec biométrique", "Utilisez votre PIN à la place.");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SafeAreaView style={s.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* Top section */}
      <View style={s.top}>
        {/* Avatar */}
        <View style={s.avatarRing}>
          <View style={s.avatarCircle}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarText}>{initials}</Text>
            )}
          </View>
        </View>

        <Text style={s.greeting}>Bon retour 👋</Text>
        <Text style={s.name}>{user?.name ?? "TontinePlus"}</Text>
        <Text style={s.sub}>Entrez votre code PIN pour continuer</Text>
      </View>

      {/* PIN dots */}
      <Animated.View style={[s.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[s.dot, i < pin.length && s.dotFilled]}>
            {i < pin.length && <View style={s.dotInner} />}
          </View>
        ))}
      </Animated.View>

      {/* Error */}
      <Animated.View style={[s.errorWrap, { opacity: errorOpacity }]}>
        <Text style={s.errorText}>{error}</Text>
      </Animated.View>

      {/* Keypad */}
      <View style={s.keypad}>
        {KEYS.map((key, i) => {
          const isEmpty = key === "";
          const isBack = key === "\u232b";
          return (
            <TouchableOpacity
              key={i}
              style={[
                s.key,
                isEmpty && s.keyEmpty,
                isBack && s.keyBack,
                isLoading && s.keyDisabled,
              ]}
              onPress={() => handleKey(key)}
              disabled={isEmpty || isLoading}
              activeOpacity={0.5}
            >
              {isBack ? (
                <Text style={s.backIcon}>⌫</Text>
              ) : (
                <Text style={[s.keyText, isEmpty && { opacity: 0 }]}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Biometric */}
      {biometricAvailable && (
        <TouchableOpacity style={s.bioBtn} onPress={handleBiometric} activeOpacity={0.7}>
          <View style={s.bioBadge}>
            <Text style={s.bioIcon}>🔐</Text>
          </View>
          <Text style={s.bioText}>Connexion biométrique</Text>
        </TouchableOpacity>
      )}

      {/* Loading overlay dots */}
      {isLoading && (
        <View style={s.loadingRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.loadingDot, { opacity: 0.4 + i * 0.2 }]} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A3D2E",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 24,
  },

  // Top
  top: { alignItems: "center", paddingTop: 8 },
  avatarRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: "#D4AF3760",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 34, fontWeight: "800", color: "#0A3D2E" },
  greeting: { color: "#D4AF3799", fontSize: 13, letterSpacing: 0.5, marginBottom: 6 },
  name: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginBottom: 6, letterSpacing: -0.3 },
  sub: { color: "#ffffff55", fontSize: 13, letterSpacing: 0.2 },

  // Dots
  dotsRow: {
    flexDirection: "row",
    gap: 18,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D4AF3780",
    justifyContent: "center",
    alignItems: "center",
  },
  dotFilled: { borderColor: "#D4AF37", backgroundColor: "#D4AF37" },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0A3D2E",
  },

  // Error
  errorWrap: {
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B6B50",
    minHeight: 34,
    justifyContent: "center",
  },
  errorText: { color: "#FF8A8A", fontSize: 13, textAlign: "center" },

  // Keypad
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: width * 0.78,
    gap: 17,
    justifyContent: "center",
  },
  key: {
    width: (width * 0.58 - 14 * 2) / 3,
    height: (width * 0.58 - 14 * 2) / 3,
    maxWidth: 88,
    maxHeight: 88,
    borderRadius: 999,
    backgroundColor: "#ffffff0E",
    borderWidth: 1,
    borderColor: "#ffffff15",
    justifyContent: "center",
    alignItems: "center",
  },
  keyBack: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyEmpty: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyDisabled: { opacity: 0.4 },
  keyText: { color: "#FFFFFF", fontSize: 26, fontWeight: "400", letterSpacing: 0.5 },
  backIcon: { color: "#D4AF37", fontSize: 22 },

  // Biometric
  bioBtn: { alignItems: "center", gap: 6 },
  bioBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D4AF3720",
    borderWidth: 1,
    borderColor: "#D4AF3740",
    justifyContent: "center",
    alignItems: "center",
  },
  bioIcon: { fontSize: 20 },
  bioText: { color: "#D4AF37", fontSize: 12, letterSpacing: 0.3 },

  // Loading
  loadingRow: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    gap: 6,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D4AF37",
  },
});