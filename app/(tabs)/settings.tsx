import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useAuthStore, useSettingsStore } from "../../src/stores";
import Avatar from "../../src/components/common/Avatar";

const CURRENCIES = ["XOF", "XAF", "EUR", "USD", "GNF", "MRU"];
const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

function Row({
  icon,
  label,
  subtitle,
  onPress,
  right,
  color,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  color?: string;
}) {
  const { theme } = useTheme();
  const C = theme.colors;
  const ic = color ?? C.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
      style={[s.row, { borderBottomColor: C.border }]}
    >
      <View style={[s.rowIcon, { backgroundColor: ic + "18" }]}>
        <Ionicons name={icon as any} size={18} color={ic} />
      </View>
      <View style={s.rowBody}>
        <Text style={[s.rowLabel, { color: C.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[s.rowSub, { color: C.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {right ??
        (onPress && (
          <Ionicons name="chevron-forward" size={15} color={C.textSecondary} />
        ))}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuthStore();
  const { settings, update } = useSettingsStore();
  const C = theme.colors;

  const [showCurrency, setShowCurrency] = useState(false);
  const [showLang, setShowLang] = useState(false);

  const confirmLogout = () =>
    Alert.alert("Verrouiller", "Vos données resteront sur l'appareil.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Verrouiller",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.root, { backgroundColor: C.background }]}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A3D2E" }}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Paramètres</Text>
          </View>
        </SafeAreaView>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile card */}
          <TouchableOpacity
            style={[s.profileCard, { backgroundColor: C.surface }]}
            onPress={() => router.push("/settings/profile")}
            activeOpacity={0.8}
          >
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={s.profilePhoto} />
            ) : (
              <Avatar name={user?.name ?? "U"} size={58} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.profileName, { color: C.text }]}>
                {user?.name ?? "Mon profil"}
              </Text>
              <Text style={[s.profileSub, { color: C.textSecondary }]}>
                {user?.phone ?? "—"} · Appuyer pour modifier
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={C.textSecondary}
            />
          </TouchableOpacity>

          {/* Apparence */}
          <SectionLabel label="APPARENCE" />
          <View style={[s.group, { backgroundColor: C.surface }]}>
            <Row
              icon="moon-outline"
              label="Mode sombre"
              subtitle={isDark ? "Activé" : "Désactivé"}
              right={
                <Switch
                  value={settings?.themeMode === "dark"}
                  onValueChange={(v) =>
                    update({ themeMode: v ? "dark" : "light" })
                  }
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              icon="cash-outline"
              label="Devise"
              subtitle={settings?.currency ?? "XOF"}
              onPress={() => setShowCurrency(true)}
            />
            <Row
              icon="language-outline"
              label="Langue"
              subtitle={settings?.language === "en" ? "English" : "Français"}
              onPress={() => setShowLang(true)}
              color="#6366F1"
            />
          </View>

          {/* Sécurité */}
          <SectionLabel label="SÉCURITÉ" />
          <View style={[s.group, { backgroundColor: C.surface }]}>
            <Row
              icon="lock-closed-outline"
              label="Changer le PIN"
              onPress={() => router.push("/settings/change-pin")}
              color="#F59E0B"
            />
            <Row
              icon="finger-print-outline"
              label="Biométrie"
              subtitle={settings?.biometricEnabled ? "Activée" : "Désactivée"}
              right={
                <Switch
                  value={settings?.biometricEnabled ?? false}
                  onValueChange={(v) => update({ biometricEnabled: v })}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              subtitle={
                settings?.notificationsEnabled ? "Activées" : "Désactivées"
              }
              right={
                <Switch
                  value={settings?.notificationsEnabled ?? true}
                  onValueChange={(v) => update({ notificationsEnabled: v })}
                  trackColor={{ true: C.primary }}
                  thumbColor="#fff"
                />
              }
            />
          </View>

          {/* Données */}
          <SectionLabel label="DONNÉES" />
          <View style={[s.group, { backgroundColor: C.surface }]}>
            <Row
              icon="cloud-upload-outline"
              label="Sauvegarde & Restauration"
              subtitle="Export JSON · Import · Auto-backup"
              onPress={() => router.push("/settings/backup")}
              color="#10B981"
            />
            <Row
              icon="notifications-circle-outline"
              label="Centre de notifications"
              onPress={() => router.push("/notifications")}
              color="#F59E0B"
            />
          </View>

          {/* À propos */}
          <SectionLabel label="À PROPOS" />
          <View style={[s.group, { backgroundColor: C.surface }]}>
            <Row
              icon="information-circle-outline"
              label="TontinePlus"
              subtitle="Version 1.0.0 · Fait avec ♥ en Afrique"
              color={C.textSecondary}
            />
          </View>

          {/* Logout */}
          <View
            style={[s.group, { backgroundColor: C.surface, marginBottom: 16 }]}
          >
            <Row
              icon="log-out-outline"
              label="Verrouiller l'application"
              onPress={confirmLogout}
              color="#EF4444"
            />
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>

      {/* Currency sheet */}
      {showCurrency && (
        <TouchableOpacity
          style={s.overlay}
          onPress={() => setShowCurrency(false)}
          activeOpacity={1}
        >
          <View style={[s.sheet, { backgroundColor: C.surface }]}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: C.text }]}>Devise</Text>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.sheetRow, { borderBottomColor: C.border }]}
                onPress={() => {
                  update({ currency: c as any });
                  setShowCurrency(false);
                }}
              >
                <Text style={[s.sheetRowText, { color: C.text }]}>{c}</Text>
                {settings?.currency === c && (
                  <Ionicons name="checkmark" size={20} color={C.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}

      {/* Lang sheet */}
      {showLang && (
        <TouchableOpacity
          style={s.overlay}
          onPress={() => setShowLang(false)}
          activeOpacity={1}
        >
          <View style={[s.sheet, { backgroundColor: C.surface }]}>
            <View style={s.sheetHandle} />
            <Text style={[s.sheetTitle, { color: C.text }]}>Langue</Text>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[s.sheetRow, { borderBottomColor: C.border }]}
                onPress={() => {
                  update({ language: l.code as any });
                  setShowLang(false);
                }}
              >
                <Text style={[s.sheetRowText, { color: C.text }]}>
                  {l.label}
                </Text>
                {settings?.language === l.code && (
                  <Ionicons name="checkmark" size={20} color={C.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[s.sectionLabel, { color: theme.colors.textSecondary }]}>
      {label}
    </Text>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    margin: 16,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  profilePhoto: { width: 58, height: 58, borderRadius: 29 },
  profileName: { fontSize: 17, fontWeight: "700" },
  profileSub: { fontSize: 12, marginTop: 3 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#00000055",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 12,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowText: { fontSize: 16 },
});
