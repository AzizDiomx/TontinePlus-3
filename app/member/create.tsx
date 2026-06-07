import React, { useState } from "react";
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Text, Alert, Image, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "../../src/hooks/useTheme";
import { useMembersStore } from "../../src/stores";
import AppButton from "../../src/components/common/AppButton";
import AppInput from "../../src/components/common/AppInput";
import { Colors } from "../../src/constants/theme";

const schema = z.object({
  name:       z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  phone:      z.string().min(8, "Numéro de téléphone invalide"),
  address:    z.string().optional(),
  profession: z.string().optional(),
  notes:      z.string().optional(),
});
type MemberForm = z.infer<typeof schema>;

export default function CreateMemberScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { addMember, isLoading } = useMembersStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const C = theme.colors;

  const { control, handleSubmit, formState: { errors } } = useForm<MemberForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", address: "", profession: "", notes: "" },
  });

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true,
      aspect: [1, 1] as [number, number], quality: 0.7,
    });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const takePhoto = async () => {
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7,
    });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const showPhotoOptions = () =>
    Alert.alert("Photo du membre", "Choisir une option", [
      { text: "Galerie", onPress: pickPhoto },
      { text: "Caméra",  onPress: takePhoto },
      { text: "Annuler", style: "cancel"    },
    ]);

  const onSubmit = async (data: MemberForm) => {
    if (!groupId) return;
    try {
      await addMember({ groupId, ...data, photoUri: photo ?? undefined });
      router.back();
    } catch {
      Alert.alert("Erreur", "Impossible d'ajouter le membre");
    }
  };

  const initials = "?";

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* ── HEADER ── */}
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Ajouter un membre</Text>
            <Text style={s.headerSub}>Renseignez les informations du membre</Text>
          </View>
        </View>

        {/* Photo picker — overlap */}
        <View style={s.photoCentered}>
          <TouchableOpacity style={s.photoWrap} onPress={showPhotoOptions} activeOpacity={0.8}>
            {photo ? (
              <Image source={{ uri: photo }} style={s.photoImg} />
            ) : (
              <View style={[s.photoPlaceholder, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name="camera-outline" size={28} color="rgba(255,255,255,0.7)" />
                <Text style={s.photoHint}>Photo</Text>
              </View>
            )}
            <View style={s.photoBadge}>
              <Ionicons name="camera" size={13} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── FORM ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={s.sheet}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ height: 36 }} />

          {/* Infos principales */}
          <SectionLabel icon="person-circle-outline" label="INFORMATIONS PRINCIPALES" color={C.primary} />
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Nom complet" placeholder="Ex: Konan Diabaté"
                value={value} onChangeText={onChange}
                error={errors.name?.message} leftIcon="person-outline"
                autoCapitalize="words" />
            )}
          />
          <Controller control={control} name="phone"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Téléphone" placeholder="Ex: 07 12 34 56 78"
                value={value} onChangeText={onChange}
                error={errors.phone?.message} leftIcon="call-outline"
                keyboardType="phone-pad" />
            )}
          />

          {/* Infos complémentaires */}
          <SectionLabel icon="information-circle-outline" label="INFORMATIONS COMPLÉMENTAIRES" color={C.primary} />
          <Controller control={control} name="profession"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Profession" placeholder="Ex: Commerçante"
                value={value ?? ""} onChangeText={onChange}
                leftIcon="briefcase-outline" autoCapitalize="words" />
            )}
          />
          <Controller control={control} name="address"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Adresse" placeholder="Ex: Cocody, Abidjan"
                value={value ?? ""} onChangeText={onChange}
                leftIcon="location-outline" />
            )}
          />
          <Controller control={control} name="notes"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Notes" placeholder="Notes supplémentaires…"
                value={value ?? ""} onChangeText={onChange}
                leftIcon="document-text-outline"
                multiline numberOfLines={3} />
            )}
          />

          {/* Info box */}
          <View style={[s.infoBox, { backgroundColor: C.primary + "12", borderColor: C.primary + "30" }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={C.primary} style={{ marginTop: 1 }} />
            <Text style={[s.infoText, { color: C.primary }]}>
              Le numéro de téléphone sera utilisé pour les rappels de cotisation.
            </Text>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <AppButton
              title="Ajouter le membre"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
            />
            <TouchableOpacity style={[s.cancelBtn, { borderColor: C.border }]} onPress={() => router.back()}>
              <Text style={[s.cancelText, { color: C.textSecondary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={s.sectionRow}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.sectionText, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerBg: { backgroundColor: "#0A3D2E" },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14, gap: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },

  photoCentered: { alignItems: "center", marginBottom: -44 },
  photoWrap: { position: "relative" },
  photoImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: "#fff" },
  photoPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  photoHint: { color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4 },
  photoBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#0A3D2E",
    borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center",
  },

  sheet: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },

  sectionRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 20, marginBottom: 12,
  },
  sectionText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },

  infoBox: {
    flexDirection: "row", gap: 10,
    borderRadius: 12, padding: 14,
    marginTop: 12, marginBottom: 8,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 19 },

  actions: { marginTop: 16, gap: 12 },
  cancelBtn: {
    height: 50, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
});