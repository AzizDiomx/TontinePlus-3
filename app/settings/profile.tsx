// app/settings/profile.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "../../src/hooks/useTheme";
import { useAuthStore } from "../../src/stores";
import Avatar from "../../src/components/common/Avatar";
import AppInput from "../../src/components/common/AppInput";
import AppButton from "../../src/components/common/AppButton";

const schema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
});
type ProfileForm = z.infer<typeof schema>;

export default function ProfileScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, updateProfile, isLoading } = useAuthStore();
  const C = theme.colors;
  const [photo, setPhoto] = useState<string | null>(user?.photoUri ?? null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.7,
    });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const onSubmit = async (data: ProfileForm) => {
    const ok = await updateProfile({ ...data, photoUri: photo ?? undefined });
    if (ok)
      Alert.alert(
        "Profil mis à jour",
        "Vos informations ont été sauvegardées.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    else Alert.alert("Erreur", "Impossible de mettre à jour le profil");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "?";

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mon profil</Text>
          <View style={s.iconBtn} />
        </View>
        <View style={s.heroCentered}>
          <TouchableOpacity
            style={s.photoWrap}
            onPress={pickPhoto}
            activeOpacity={0.8}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={s.photo} />
            ) : (
              <View style={s.photoFallback}>
                <Text style={s.photoInitials}>{initials}</Text>
              </View>
            )}
            <View style={s.photoBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={s.heroName}>{user?.name ?? "—"}</Text>
          <Text style={s.heroPhone}>{user?.phone ?? "—"}</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: 8 }} />
          <SLabel
            icon="person-circle-outline"
            label="INFORMATIONS"
            color={C.primary}
          />
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Nom complet"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                leftIcon="person-outline"
                autoCapitalize="words"
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Téléphone"
                value={value}
                onChangeText={onChange}
                error={errors.phone?.message}
                leftIcon="call-outline"
                keyboardType="phone-pad"
              />
            )}
          />
          <View style={{ marginTop: 20, gap: 12 }}>
            <AppButton
              title="Sauvegarder"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
            />
            <TouchableOpacity
              style={[s.cancelBtn, { borderColor: C.border }]}
              onPress={() => router.back()}
            >
              <Text style={[s.cancelText, { color: C.textSecondary }]}>
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SLabel({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={s.sLabel}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.sLabelText, { color }]}>{label}</Text>
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
    paddingBottom: 12,
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
  heroCentered: { alignItems: "center", paddingBottom: 16, gap: 4 },
  photoWrap: { position: "relative", marginBottom: 10 },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  photoFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  photoInitials: { fontSize: 30, fontWeight: "800", color: "#0A3D2E" },
  photoBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0A3D2E",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroPhone: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  sLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  sLabelText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
});
