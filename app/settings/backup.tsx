// app/settings/backup.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Switch,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useSettingsStore } from "../../src/stores";
import { BackupService } from "../../src/services/backup.service";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import { Colors } from "../../src/constants/theme";

export default function BackupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { settings, update } = useSettingsStore();
  const C = theme.colors;
  const [loading, setLoading] = useState(false);
  const lastBackup = settings?.lastBackupDate ?? null;

  const doExport = async () => {
    setLoading(true);
    try {
      await BackupService.exportBackup();
      await update({ lastBackupDate: new Date().toISOString() });
      Alert.alert(
        "Sauvegarde exportée",
        "Votre fichier a été partagé avec succès."
      );
    } catch {
      Alert.alert("Erreur", "Impossible d'exporter la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const doImport = () =>
    Alert.alert(
      "Attention",
      "L'import va remplacer TOUTES vos données actuelles. Continuer ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Importer",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const ok = await BackupService.importBackup();
              Alert.alert(
                ok ? "Restauré" : "Annulé",
                ok
                  ? "Données restaurées avec succès."
                  : "Aucun fichier sélectionné."
              );
            } catch {
              Alert.alert("Erreur", "Fichier invalide ou corrompu");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );

  const doCSV = async () => {
    setLoading(true);
    try {
      await BackupService.exportCSV([]);
    } catch {
      Alert.alert("Erreur", "Impossible d'exporter le CSV");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullscreen />;

  const lastBackupStr = lastBackup
    ? new Date(lastBackup).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Sauvegarde & Restauration</Text>
          <View style={s.iconBtn} />
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroIcon}>
            <Ionicons name="cloud" size={36} color="#D4AF37" />
          </View>
          <Text style={s.heroTitle}>
            {lastBackupStr ? "Données sauvegardées" : "Aucune sauvegarde"}
          </Text>
          <Text style={s.heroSub}>
            {lastBackupStr
              ? `Dernière sauvegarde : ${lastBackupStr}`
              : "Créez votre première sauvegarde"}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning */}
        <View
          style={[
            s.warnBox,
            {
              backgroundColor: C.warning + "15",
              borderColor: C.warning + "40",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={C.warning}
            style={{ marginTop: 1 }}
          />
          <Text style={[s.warnText, { color: C.text }]}>
            Sauvegardez régulièrement. En cas de perte de l'appareil, seule une
            sauvegarde permet de récupérer vos données.
          </Text>
        </View>

        {/* Export */}
        <SLabel icon="share-outline" label="EXPORTER" color={C.primary} />
        {[
          {
            icon: "document-outline",
            label: "Sauvegarde JSON",
            sub: "Export complet de toutes vos données",
            color: C.primary,
            onPress: doExport,
          },
          {
            icon: "grid-outline",
            label: "Export CSV",
            sub: "Cotisations au format tableur",
            color: "#10B981",
            onPress: doCSV,
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[s.card, { backgroundColor: C.surface }]}
            onPress={item.onPress}
            activeOpacity={0.75}
          >
            <View style={[s.cardIcon, { backgroundColor: item.color + "18" }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: C.text }]}>{item.label}</Text>
              <Text style={[s.cardSub, { color: C.textSecondary }]}>
                {item.sub}
              </Text>
            </View>
            <Ionicons name="share-outline" size={18} color={item.color} />
          </TouchableOpacity>
        ))}

        {/* Import */}
        <SLabel
          icon="cloud-download-outline"
          label="RESTAURER"
          color={C.primary}
        />
        <TouchableOpacity
          style={[s.card, { backgroundColor: C.surface }]}
          onPress={doImport}
          activeOpacity={0.75}
        >
          <View style={[s.cardIcon, { backgroundColor: C.error + "18" }]}>
            <Ionicons name="cloud-download-outline" size={22} color={C.error} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: C.text }]}>
              Importer une sauvegarde
            </Text>
            <Text style={[s.cardSub, { color: C.textSecondary }]}>
              Sélectionner un fichier .json
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
        </TouchableOpacity>

        {/* Settings */}
        <SLabel icon="settings-outline" label="PARAMÈTRES" color={C.primary} />
        <View style={[s.settingsCard, { backgroundColor: C.surface }]}>
          {[
            {
              label: "Rappel de sauvegarde",
              sub: "Rappel hebdomadaire",
              key: "autoBackup" as const,
              val: settings?.autoBackup ?? false,
            },
            {
              label: "Notifications",
              sub: "Alertes de sauvegarde expirée",
              key: "notificationsEnabled" as const,
              val: settings?.notificationsEnabled ?? true,
            },
          ].map((row, i, arr) => (
            <View
              key={row.key}
              style={[
                s.settingRow,
                { borderBottomColor: C.border },
                i === arr.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: C.text }]}>
                  {row.label}
                </Text>
                <Text style={[s.cardSub, { color: C.textSecondary }]}>
                  {row.sub}
                </Text>
              </View>
              <Switch
                value={row.val}
                onValueChange={(v) => update({ [row.key]: v })}
                trackColor={{ true: C.primary }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  hero: { alignItems: "center", paddingBottom: 20, gap: 6 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(212,175,55,0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  scroll: { padding: 16 },
  warnBox: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  warnText: { flex: 1, fontSize: 13, lineHeight: 19 },
  sLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    marginBottom: 10,
  },
  sLabelText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  cardSub: { fontSize: 12 },
  settingsCard: { borderRadius: 14, overflow: "hidden" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
});
