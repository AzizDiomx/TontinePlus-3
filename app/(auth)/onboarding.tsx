import React, { useState, useRef } from "react";
import {
  View, FlatList, Dimensions, TouchableOpacity,
  Text, StyleSheet, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "../../src/constants/theme";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    icon: "people",
    title: "Gérez vos tontines",
    subtitle: "Organisez facilement vos groupes d'épargne solidaire entre amis, famille ou collègues.",
    accent: "#D4AF37",
    bg: "#072D20",
  },
  {
    id: "2",
    icon: "wallet",
    title: "Suivez les cotisations",
    subtitle: "Enregistrez chaque paiement, identifiez les retards et gardez une trace de l'argent collecté.",
    accent: "#10B981",
    bg: "#0A3D2E",
  },
  {
    id: "3",
    icon: "shield-checkmark",
    title: "Sécurisé et hors ligne",
    subtitle: "Toutes vos données restent sur votre téléphone. Aucun internet requis. PIN et biométrie.",
    accent: "#6366F1",
    bg: "#0F2A5C",
  },
  {
    id: "4",
    icon: "bar-chart",
    title: "Rapports détaillés",
    subtitle: "Visualisez les statistiques, générez des rapports et exportez vos données facilement.",
    accent: "#F59E0B",
    bg: "#2D1B00",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const slide = SLIDES[currentIndex];

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    } else {
      router.replace("/(auth)/register");
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[s.root, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={slide.bg} />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>

        {/* Skip */}
        <TouchableOpacity style={s.skipBtn} onPress={() => router.replace("/(auth)/register")}>
          <Text style={s.skipText}>Passer</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <View style={[s.slide, { width }]}>
              {/* Icon blob */}
              <View style={[s.iconBlob, { backgroundColor: item.accent + "25", borderColor: item.accent + "40" }]}>
                <View style={[s.iconInner, { backgroundColor: item.accent + "35" }]}>
                  <Ionicons name={item.icon as any} size={52} color={item.accent} />
                </View>
              </View>

              <Text style={s.slideTitle}>{item.title}</Text>
              <Text style={s.slideSub}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Footer */}
        <View style={s.footer}>
          {/* Dots */}
          <View style={s.dotsRow}>
            {SLIDES.map((sl, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  flatRef.current?.scrollToIndex({ index: i, animated: true });
                  setCurrentIndex(i);
                }}
              >
                <View style={[
                  s.dot,
                  i === currentIndex && [s.dotActive, { backgroundColor: slide.accent }],
                ]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: slide.accent }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={[s.nextText, { color: slide.bg }]}>
              {isLast ? "Commencer" : "Suivant"}
            </Text>
            <Ionicons
              name={isLast ? "checkmark-circle" : "arrow-forward"}
              size={20}
              color={slide.bg}
            />
          </TouchableOpacity>

          {/* Step indicator */}
          <Text style={s.stepText}>{currentIndex + 1} / {SLIDES.length}</Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-end", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  skipText: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "500" },

  slide: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 36, paddingBottom: 40,
  },
  iconBlob: {
    width: 180, height: 180, borderRadius: 90,
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    marginBottom: 44,
  },
  iconInner: {
    width: 128, height: 128, borderRadius: 64,
    alignItems: "center", justifyContent: "center",
  },
  slideTitle: {
    color: "#FFFFFF", fontSize: 28, fontWeight: "800",
    textAlign: "center", marginBottom: 16, letterSpacing: -0.4,
  },
  slideSub: {
    color: "rgba(255,255,255,0.7)", fontSize: 16,
    textAlign: "center", lineHeight: 24,
  },

  footer: { paddingHorizontal: 24, paddingBottom: 8, gap: 16 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { width: 28, borderRadius: 4 },

  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 58, borderRadius: 18,
  },
  nextText: { fontSize: 17, fontWeight: "800", letterSpacing: 0.2 },
  stepText: {
    color: "rgba(255,255,255,0.35)", fontSize: 12,
    textAlign: "center", letterSpacing: 1,
  },
});