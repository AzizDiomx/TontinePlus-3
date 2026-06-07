import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useGroupsStore, useDashboardStore } from "../../src/stores";
import { useCurrency } from "../../src/hooks/useCurrency";
import { BackupService } from "../../src/services/backup.service";
import ProgressBar from "../../src/components/common/ProgressBar";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import { ContributionRepository } from "../../src/repositories";

type PeriodKey = "month" | "quarter" | "year";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "Ce mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "year", label: "Cette année" },
];

type GroupStat = {
  groupId: string;
  name: string;
  totalPaid: number;
  totalDue: number;
  members: number;
  rate: number;
};

export default function ReportsScreen() {
  const { theme } = useTheme();
  const { groups } = useGroupsStore();
  const { stats, load } = useDashboardStore();
  const { format: fmt } = useCurrency();
  const C = theme.colors;

  const [period, setPeriod] = useState<PeriodKey>("month");
  const [exporting, setExporting] = useState(false);
  const [groupStats, setGroupStats] = useState<GroupStat[]>([]);

  useEffect(() => {
    load();
    loadGroupStats();
  }, [period, groups]);

  const loadGroupStats = async () => {
    const now = new Date();
    let from: Date;
    if (period === "month")
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "quarter")
      from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else from = new Date(now.getFullYear(), 0, 1);

    const results: GroupStat[] = [];
    for (const g of groups) {
      const contribs = await ContributionRepository.getByGroup(g.id);
      const inPeriod = contribs.filter(
        (c) => new Date(c.dueDate) >= from && new Date(c.dueDate) <= now
      );
      const totalPaid = inPeriod
        .filter((c) => c.status === "paid")
        .reduce((s, c) => s + c.amount, 0);
      const totalDue = inPeriod.reduce((s, c) => s + c.expectedAmount, 0);
      results.push({
        groupId: g.id,
        name: g.name,
        totalPaid,
        totalDue,
        members: g.memberCount || 0,
        rate: totalDue > 0 ? totalPaid / totalDue : 0,
      });
    }
    setGroupStats(results);
  };

  const doExport = async (type: "json" | "csv") => {
    setExporting(true);
    try {
      if (type === "json") await BackupService.shareBackup();
      else await BackupService.exportCSV(groups.map((g) => g.id));
    } catch {
      Alert.alert("Erreur", "Export impossible");
    } finally {
      setExporting(false);
    }
  };

  const totalPaid = groupStats.reduce((s, g) => s + g.totalPaid, 0);
  const totalDue = groupStats.reduce((s, g) => s + g.totalDue, 0);
  const globalRate = totalDue > 0 ? totalPaid / totalDue : 0;

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A3D2E" }}>
        <View style={s.header}>
          <Text style={s.headerSup}>Rapports</Text>
          <Text style={s.headerTitle}>{fmt(stats?.totalBalance ?? 0)}</Text>
          <Text style={s.headerSub}>Total collecté · toutes tontines</Text>
        </View>

        {/* Period selector */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[s.periodBtn, p.key === period && s.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                style={[s.periodText, p.key === period && s.periodTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Global stats */}
        <View style={s.statsRow}>
          {[
            {
              label: "Payé",
              value: fmt(totalPaid),
              color: "#10B981",
              icon: "checkmark-circle-outline",
            },
            {
              label: "En attente",
              value: fmt(Math.max(0, totalDue - totalPaid)),
              color: "#F59E0B",
              icon: "time-outline",
            },
            {
              label: "Taux",
              value: `${Math.round(globalRate * 100)}%`,
              color: C.primary,
              icon: "stats-chart-outline",
            },
          ].map((item) => (
            <View
              key={item.label}
              style={[s.statBox, { backgroundColor: C.surface }]}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={[s.statValue, { color: item.color }]}>
                {item.value}
              </Text>
              <Text style={[s.statLabel, { color: C.textSecondary }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Per group */}
        <SectionHeader
          icon="layers-outline"
          title="Par groupe"
          color={C.primary}
        />
        {groupStats.length === 0 ? (
          <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
            <Ionicons
              name="pie-chart-outline"
              size={36}
              color={C.textSecondary}
            />
            <Text style={[s.emptyText, { color: C.textSecondary }]}>
              Créez des groupes pour voir les rapports
            </Text>
          </View>
        ) : (
          groupStats.map((g) => (
            <View
              key={g.groupId}
              style={[s.groupCard, { backgroundColor: C.surface }]}
            >
              <View style={s.groupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.groupName, { color: C.text }]}>{g.name}</Text>
                  <Text style={[s.groupSub, { color: C.textSecondary }]}>
                    {g.members} membres
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[s.groupPaid, { color: C.primary }]}>
                    {fmt(g.totalPaid)}
                  </Text>
                  <Text style={[s.groupDue, { color: C.textSecondary }]}>
                    / {fmt(g.totalDue)}
                  </Text>
                </View>
              </View>
              <ProgressBar progress={g.rate} height={6} />
              <Text style={[s.groupRate, { color: C.textSecondary }]}>
                Taux de collecte :{" "}
                <Text
                  style={{
                    color:
                      g.rate > 0.8
                        ? "#10B981"
                        : g.rate > 0.5
                        ? "#F59E0B"
                        : "#EF4444",
                    fontWeight: "700",
                  }}
                >
                  {Math.round(g.rate * 100)}%
                </Text>
              </Text>
            </View>
          ))
        )}

        {/* Export */}
        <SectionHeader
          icon="share-outline"
          title="Exporter"
          color={C.primary}
        />
        {[
          {
            type: "json" as const,
            icon: "document-outline",
            label: "Sauvegarde JSON",
            sub: "Export complet des données",
            color: C.primary,
          },
          {
            type: "csv" as const,
            icon: "grid-outline",
            label: "Export CSV",
            sub: "Cotisations en tableur",
            color: "#10B981",
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[s.exportCard, { backgroundColor: C.surface }]}
            onPress={() => doExport(item.type)}
            disabled={exporting}
            activeOpacity={0.75}
          >
            <View
              style={[s.exportIcon, { backgroundColor: item.color + "18" }]}
            >
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.exportLabel, { color: C.text }]}>
                {item.label}
              </Text>
              <Text style={[s.exportSub, { color: C.textSecondary }]}>
                {item.sub}
              </Text>
            </View>
            {exporting ? (
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={C.textSecondary}
              />
            ) : (
              <Ionicons
                name="chevron-forward"
                size={18}
                color={C.textSecondary}
              />
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: string;
  title: string;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={{ fontSize: 15, fontWeight: "700" }}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  headerSup: { color: "#ffffff70", fontSize: 12 },
  headerTitle: {
    color: "#D4AF37",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: { color: "#ffffff60", fontSize: 12, marginTop: 2 },
  periodRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  periodBtnActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  periodText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  periodTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16 },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 15, fontWeight: "800" },
  statLabel: { fontSize: 11 },
  emptyBox: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14 },
  groupCard: { borderRadius: 14, padding: 14, marginBottom: 10, gap: 8 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  groupName: { fontSize: 15, fontWeight: "700" },
  groupSub: { fontSize: 12, marginTop: 2 },
  groupPaid: { fontSize: 15, fontWeight: "700" },
  groupDue: { fontSize: 12 },
  groupRate: { fontSize: 12 },
  exportCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  exportLabel: { fontSize: 14, fontWeight: "700" },
  exportSub: { fontSize: 12, marginTop: 2 },
});
