import React, { useState } from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../src/stores";
import AppButton from "../../src/components/common/AppButton";
import AppInput from "../../src/components/common/AppInput";
import { Colors, Spacing, Radius } from "../../src/constants/theme";

const schema = z
  .object({
    name: z.string().min(2, "Nom trop court").max(50, "Nom trop long"),
    phone: z.string().min(8, "Numéro invalide").max(15, "Numéro invalide"),
    pin: z
      .string()
      .length(4, "Le PIN doit contenir 4 chiffres")
      .regex(/^\d+$/, "Chiffres uniquement"),
    confirmPin: z.string().length(4, "Confirmer le PIN"),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: "Les PINs ne correspondent pas",
    path: ["confirmPin"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { createAccount, isLoading } = useAuthStore();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createAccount({
        name: data.name,
        phone: data.phone,
        photoUri,
        pin: data.pin,
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Erreur", "Impossible de créer le compte. Réessayez.");
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* Green header */}
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={s.headerTitle}>Créer un profil</Text>
            <Text style={s.headerSub}>Vos données restent sur l'appareil</Text>
          </View>
          {/* Logo mark */}
          <View style={s.logoMark}>
            <Ionicons name="leaf" size={20} color="#D4AF37" />
          </View>
        </View>

        {/* Photo picker — in the green zone for overlap effect */}
        <View style={s.photoCentered}>
          <TouchableOpacity
            style={s.photoWrap}
            onPress={pickPhoto}
            activeOpacity={0.8}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={s.photo} />
            ) : (
              <View style={s.photoPlaceholder}>
                <Ionicons name="camera" size={28} color={Colors.emerald[600]} />
                <Text style={s.photoPlaceholderText}>Photo</Text>
              </View>
            )}
            <View style={s.photoBadge}>
              <Ionicons name="add" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* White form sheet */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={s.sheet}
          contentContainerStyle={s.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Spacer for photo overlap */}
          <View style={{ height: 36 }} />

          {/* Form section */}
          <Text style={s.sectionLabel}>INFORMATIONS PERSONNELLES</Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Nom complet"
                placeholder="Kouadio Amani"
                value={value ?? ""}
                onChangeText={onChange}
                error={errors.name?.message}
                leftIcon="person-outline"
              />
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Téléphone"
                placeholder="+225 07 00 00 00 00"
                value={value ?? ""}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phone?.message}
                leftIcon="call-outline"
              />
            )}
          />

          <Text style={[s.sectionLabel, { marginTop: 20 }]}>SÉCURITÉ</Text>

          <Controller
            control={control}
            name="pin"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Code PIN (4 chiffres)"
                placeholder="••••"
                value={value ?? ""}
                onChangeText={onChange}
                keyboardType="numeric"
                secureTextEntry={!showPin}
                maxLength={4}
                error={errors.pin?.message}
                leftIcon="lock-closed-outline"
                rightIcon={
                  <Ionicons
                    name={showPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={Colors.emerald[600]}
                  />
                }
                onRightIconPress={() => setShowPin(!showPin)}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPin"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Confirmer le PIN"
                placeholder="••••"
                value={value ?? ""}
                onChangeText={onChange}
                keyboardType="numeric"
                secureTextEntry={!showPin}
                maxLength={4}
                error={errors.confirmPin?.message}
                leftIcon="shield-checkmark-outline"
              />
            )}
          />

          {/* Info box */}
          <View style={s.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.emerald[600]}
              style={{ marginTop: 1 }}
            />
            <Text style={s.infoText}>
              Mémorisez votre PIN — il est le seul moyen d'accéder à vos
              données.
            </Text>
          </View>

          {/* CTA */}
          <AppButton
            title="Créer mon compte"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={s.submitBtn}
          />

          <TouchableOpacity
            style={s.importBtn}
            onPress={() => router.push("/settings/backup")}
          >
            <Ionicons
              name="cloud-download-outline"
              size={16}
              color={Colors.emerald[700]}
            />
            <Text style={s.importText}>Restaurer une sauvegarde existante</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  // Header
  headerBg: { backgroundColor: "#0A3D2E" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(212,175,55,0.2)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Photo
  photoCentered: { alignItems: "center", paddingBottom: 0, marginBottom: -44 },
  photoWrap: { position: "relative" },
  photo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#fff",
  },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.emerald[50],
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  photoPlaceholderText: {
    color: Colors.emerald[600],
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
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

  // Sheet
  sheet: { flex: 1, backgroundColor: "#fff" },
  sheetContent: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: Colors.neutral[400],
    marginBottom: 12,
    marginTop: 4,
  },

  // Info box
  infoBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.emerald[50],
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.emerald[100],
  },
  infoText: {
    flex: 1,
    color: Colors.emerald[700],
    fontSize: 13,
    lineHeight: 19,
  },

  submitBtn: { marginBottom: 12 },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  importText: { color: Colors.emerald[700], fontSize: 14, fontWeight: "600" },
});
