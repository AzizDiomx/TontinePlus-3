// app/settings/change-pin.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  StatusBar,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useAuthStore } from "../../src/stores";
import { Colors } from "../../src/constants/theme";

type Step = "current" | "new" | "confirm";

const STEP_CONFIG: Record<Step, { title: string; sub: string; icon: string }> =
  {
    current: {
      title: "PIN actuel",
      sub: "Entrez votre PIN actuel",
      icon: "lock-closed-outline",
    },
    new: {
      title: "Nouveau PIN",
      sub: "Choisissez un nouveau PIN à 4 chiffres",
      icon: "key-outline",
    },
    confirm: {
      title: "Confirmer le PIN",
      sub: "Répétez votre nouveau PIN",
      icon: "shield-checkmark-outline",
    },
  };

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export default function ChangePINScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { updatePin } = useAuthStore();
  const C = theme.colors;

  const [step, setStep] = useState<Step>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const shakeX = useRef(new Animated.Value(0)).current;
  const errorOp = useRef(new Animated.Value(0)).current;
  const [errorMsg, setErrorMsg] = useState("");

  const showError = (msg: string) => {
    setErrorMsg(msg);
    Vibration.vibrate([0, 40, 40, 40]);
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: -12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 12,
        duration: 55,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.timing(errorOp, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(1600),
      Animated.timing(errorOp, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setErrorMsg(""));
  };

  const getPin = () =>
    step === "current" ? currentPin : step === "new" ? newPin : confirmPin;
  const setPin = (v: string) => {
    if (step === "current") setCurrentPin(v);
    else if (step === "new") setNewPin(v);
    else setConfirmPin(v);
  };

  const handleKey = async (key: string) => {
    const cur = getPin();
    if (key === "⌫") {
      setPin(cur.slice(0, -1));
      return;
    }
    if (key === "" || cur.length >= 4) return;
    const next = cur + key;
    setPin(next);
    if (next.length === 4) setTimeout(() => handleComplete(next), 120);
  };

  const handleComplete = async (pin: string) => {
    if (step === "current") {
      setStep("new");
      return;
    }
    if (step === "new") {
      setStep("confirm");
      return;
    }
    if (pin !== newPin) {
      showError("Les PINs ne correspondent pas");
      setNewPin("");
      setConfirmPin("");
      setStep("new");
      return;
    }
    const ok = await updatePin(currentPin, pin);
    if (ok) {
      Alert.alert("PIN modifié", "Votre PIN a été mis à jour avec succès.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } else {
      showError("PIN actuel incorrect");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setStep("current");
    }
  };

  const cur = getPin();
  const stepIndex = step === "current" ? 0 : step === "new" ? 1 : 2;
  const cfg = STEP_CONFIG[step];

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Changer le PIN</Text>
          <View style={s.iconBtn} />
        </View>
      </SafeAreaView>

      <View style={s.body}>
        {/* Step progress */}
        <View style={s.stepsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                s.stepPill,
                { backgroundColor: i <= stepIndex ? C.primary : C.border },
                i === stepIndex && { width: 28 },
              ]}
            />
          ))}
        </View>

        {/* Icon */}
        <View
          style={[
            s.iconBubble,
            {
              backgroundColor: C.primary + "20",
              borderColor: C.primary + "40",
            },
          ]}
        >
          <Ionicons name={cfg.icon as any} size={36} color={C.primary} />
        </View>

        <Text style={[s.stepTitle, { color: C.text }]}>{cfg.title}</Text>
        <Text style={[s.stepSub, { color: C.textSecondary }]}>{cfg.sub}</Text>

        {/* Dots */}
        <Animated.View
          style={[s.dotsRow, { transform: [{ translateX: shakeX }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                s.dot,
                { borderColor: C.primary },
                i < cur.length && { backgroundColor: C.primary },
              ]}
            >
              {i < cur.length && (
                <View style={[s.dotInner, { backgroundColor: C.background }]} />
              )}
            </View>
          ))}
        </Animated.View>

        {/* Error */}
        <Animated.View
          style={[
            s.errorWrap,
            {
              opacity: errorOp,
              backgroundColor: C.error + "18",
              borderColor: C.error + "40",
            },
          ]}
        >
          <Text style={[s.errorText, { color: C.error }]}>{errorMsg}</Text>
        </Animated.View>

        {/* Keypad */}
        <View style={s.keypad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={s.keyRow}>
              {row.map((k, ki) => {
                const isEmpty = k === "";
                const isBack = k === "⌫";
                return (
                  <TouchableOpacity
                    key={ki}
                    style={[
                      s.key,
                      {
                        backgroundColor: isEmpty
                          ? "transparent"
                          : isBack
                          ? C.error + "18"
                          : C.surface,
                      },
                      {
                        borderColor: isEmpty
                          ? "transparent"
                          : isBack
                          ? C.error + "30"
                          : C.border,
                      },
                    ]}
                    onPress={() => handleKey(k)}
                    disabled={isEmpty}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[s.keyText, { color: isBack ? C.error : C.text }]}
                    >
                      {k}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerBg: { backgroundColor: "#0A3D2E" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  stepsRow: { flexDirection: "row", gap: 8 },
  stepPill: { height: 6, width: 8, borderRadius: 3 },
  iconBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  stepSub: { fontSize: 14, textAlign: "center" },
  dotsRow: { flexDirection: "row", gap: 20 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotInner: { width: 10, height: 10, borderRadius: 5 },
  errorWrap: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  errorText: { fontSize: 13, textAlign: "center", fontWeight: "600" },
  keypad: { gap: 12, width: "100%", maxWidth: 300 },
  keyRow: { flexDirection: "row", justifyContent: "center", gap: 16 },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 26, fontWeight: "400" },
});
