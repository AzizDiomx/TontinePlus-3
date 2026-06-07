import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useGroupsStore } from "../../src/stores";
import { useTheme } from "../../src/hooks/useTheme";
import { useCurrency } from "../../src/hooks/useCurrency";
import AppCard from "../../src/components/common/AppCard";
import AppText from "../../src/components/common/AppText";
import Badge from "../../src/components/common/Badge";
import EmptyState from "../../src/components/common/EmptyState";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import ProgressBar from "../../src/components/common/ProgressBar";
import { Colors, Spacing, Radius } from "../../src/constants/theme";
import { Group } from "../../src/types";

const FREQ_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  biweekly: "Bimensuel",
  monthly: "Mensuel",
  custom: "Personnalisé",
};

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: string }
> = {
  active: { color: "#10B981", label: "Actif", icon: "checkmark-circle" },
  paused: { color: "#F59E0B", label: "Pausé", icon: "pause-circle" },
  completed: { color: "#6366F1", label: "Terminé", icon: "flag" },
  archived: { color: "#9CA3AF", label: "Archivé", icon: "archive" },
};

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, isLoading, loadGroups } = useGroupsStore();
  const { theme } = useTheme();
  const { format: fmt } = useCurrency();
  const [search, setSearch] = useState("");
  const C = theme.colors;

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [])
  );

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderGroup = ({ item }: { item: Group }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.active;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/group/${item.id}`)}
        style={[s.card, { backgroundColor: C.surface }]}
      >
        {/* Card header */}
        <View style={s.cardHeader}>
          <View
            style={[s.groupIconWrap, { backgroundColor: cfg.color + "18" }]}
          >
            <Ionicons name="people" size={24} color={cfg.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.titleRow}>
              <Text style={[s.groupName, { color: C.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[s.badge, { backgroundColor: cfg.color + "18" }]}>
                <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                <Text style={[s.badgeText, { color: cfg.color }]}>
                  {cfg.label}
                </Text>
              </View>
            </View>
            <Text style={[s.groupSub, { color: C.textSecondary }]}>
              {FREQ_LABELS[item.frequency]} · {item.memberCount} membre
              {item.memberCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={[s.statsRow, { borderTopColor: C.border }]}>
          <StatChip
            icon="wallet-outline"
            label="Cotisation"
            value={fmt(item.contributionAmount)}
            color={C.primary}
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <StatChip
            icon="refresh-outline"
            label="Cycle"
            value={`${item.currentCycle} / ${item.totalCycles || "?"}`}
            color={C.textSecondary}
          />
          <View style={[s.divider, { backgroundColor: C.border }]} />
          <StatChip
            icon="calendar-outline"
            label="Début"
            value={new Date(item.startDate).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })}
            color={C.textSecondary}
          />
        </View>

        {/* Progress */}
        {item.totalCycles > 0 && (
          <View style={s.progressWrap}>
            <ProgressBar
              progress={item.currentCycle / item.totalCycles}
              height={4}
            />
            <Text style={[s.progressLabel, { color: C.textSecondary }]}>
              {Math.round((item.currentCycle / item.totalCycles) * 100)}%
              complété
            </Text>
          </View>
        )}

        <View style={s.chevronWrap}>
          <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A3D2E" }}>
        <View style={s.header}>
          <View>
            <Text style={s.headerSup}>Mes tontines</Text>
            <Text style={s.headerTitle}>
              {groups.length} groupe{groups.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => router.push("/group/create")}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={s.searchWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color="rgba(255,255,255,0.5)"
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un groupe..."
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={s.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {isLoading && groups.length === 0 ? (
        <LoadingSpinner fullscreen />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Aucun groupe"
              subtitle="Créez votre première tontine"
              actionLabel="Créer un groupe"
              onAction={() => router.push("/group/create")}
            />
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={s.chip}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.chipLabel, { color: "#9CA3AF" }]}>{label}</Text>
      <Text style={[s.chipValue, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerSup: { color: "#ffffff70", fontSize: 12 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },
  card: {
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  groupIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  groupName: { flex: 1, fontSize: 16, fontWeight: "700" },
  groupSub: { fontSize: 12 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  chip: { flex: 1, alignItems: "center", gap: 2 },
  chipLabel: { fontSize: 10 },
  chipValue: { fontSize: 13, fontWeight: "700" },
  divider: { width: 1, marginVertical: 4 },
  progressWrap: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  progressLabel: { fontSize: 11, textAlign: "right" },
  chevronWrap: { position: "absolute", right: 14, top: "50%" },
});
