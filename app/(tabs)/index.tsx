import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore, useDashboardStore } from "../../src/stores";
import { useTheme } from "../../src/hooks/useTheme";
import { useCurrency } from "../../src/hooks/useCurrency";
import Avatar from "../../src/components/common/Avatar";
import StatusPill from "../../src/components/common/StatusPill";
import ProgressBar from "../../src/components/common/ProgressBar";
import { Colors, Spacing, Radius } from "../../src/constants/theme";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48 - 12) / 2;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { stats, isLoading, load, refresh } = useDashboardStore();
  const { theme, isDark } = useTheme();
  const { format: fmt, formatShort } = useCurrency();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const collectionRate =
    stats && stats.thisMonthDue > 0
      ? Math.round((stats.thisMonthPaid / stats.thisMonthDue) * 100)
      : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const C = theme.colors;
  const overdueCount =
    stats?.recentContributions?.filter((c) => c.status === "unpaid").length ??
    0;

  return (
    <SafeAreaView
      style={[s.root, { backgroundColor: "#0A3D2E" }]}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.userName}>
            {user?.name?.split(" ")[0] ?? "Utilisateur"}
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/settings/profile")}>
            <Avatar
              name={user?.name ?? "?"}
              photoUri={user?.photoUri}
              size={42}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── BALANCE CARD ── */}
      <View style={s.balanceCard}>
        <View style={s.balanceTop}>
          <View>
            <Text style={s.balanceLabel}>Collecté ce mois</Text>
            <Text style={s.balanceAmount}>
              {stats ? fmt(stats.thisMonthPaid) : "—"}
            </Text>
          </View>
          <View style={s.rateCircle}>
            <Text style={s.rateText}>{collectionRate}%</Text>
            <Text style={s.rateLabel}>taux</Text>
          </View>
        </View>
        <ProgressBar
          progress={collectionRate / 100}
          height={5}
          color={Colors.gold[400]}
          style={{ marginBottom: 10 }}
        />
        <View style={s.balanceFooter}>
          <View style={s.balanceStat}>
            <Ionicons name="arrow-up-outline" size={13} color="#ffffff80" />
            <Text style={s.balanceStatLabel}>
              Attendu{" "}
              <Text style={s.balanceStatVal}>
                {stats ? fmt(stats.thisMonthDue) : "—"}
              </Text>
            </Text>
          </View>
          <View style={s.balanceStat}>
            <Ionicons name="people-outline" size={13} color="#ffffff80" />
            <Text style={s.balanceStatLabel}>
              Groupes{" "}
              <Text style={s.balanceStatVal}>
                {stats?.activeGroupCount ?? 0}
              </Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        style={[s.scroll, { backgroundColor: C.background }]}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={C.primary}
          />
        }
      >
        {/* ── STAT PILLS ── */}
        <View style={s.pillsRow}>
          <StatPill
            icon="wallet-outline"
            label="Ce mois"
            value={stats ? formatShort(stats.monthlyContributions) : "—"}
            color={C.primary}
            bg={C.primary + "15"}
          />
          <StatPill
            icon="alert-circle-outline"
            label="Retards"
            value={String(overdueCount)}
            color={overdueCount > 0 ? C.error : C.success}
            bg={(overdueCount > 0 ? C.error : C.success) + "15"}
          />
          <StatPill
            icon="checkmark-circle-outline"
            label="Payés"
            value={String(
              stats?.recentContributions?.filter((c) => c.status === "paid")
                .length ?? 0
            )}
            color={C.success}
            bg={C.success + "15"}
          />
        </View>

        {/* ── NEXT BENEFICIARY ── */}
        {stats?.nextBeneficiary && (
          <>
            <SectionHeader
              title="Prochain bénéficiaire"
              icon="trophy-outline"
            />
            <View
              style={[
                s.benefCard,
                {
                  backgroundColor: C.surface,
                  borderLeftColor: Colors.gold[400],
                },
              ]}
            >
              <View style={s.benefLeft}>
                <Avatar
                  name={stats.nextBeneficiary.member.name}
                  photoUri={stats.nextBeneficiary.member.photoUri}
                  size={50}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.benefName, { color: C.text }]}>
                    {stats.nextBeneficiary.member.name}
                  </Text>
                  <Text style={[s.benefGroup, { color: C.textSecondary }]}>
                    {stats.nextBeneficiary.group.name}
                  </Text>
                  <View style={s.benefDateRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color={C.textSecondary}
                    />
                    <Text style={[s.benefDate, { color: C.textSecondary }]}>
                      {format(
                        new Date(stats.nextBeneficiary.date),
                        "dd MMM yyyy",
                        { locale: fr }
                      )}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  s.benefAmtBadge,
                  { backgroundColor: Colors.gold[400] + "20" },
                ]}
              >
                <Text style={[s.benefAmt, { color: Colors.gold[600] }]}>
                  {fmt(stats.nextBeneficiary.amount)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── RECENT ACTIVITY ── */}
        {(stats?.recentContributions ?? []).length > 0 && (
          <>
            <SectionHeader
              title="Activité récente"
              icon="time-outline"
              action="Tout voir"
              onAction={() => router.push("/(tabs)/groups")}
            />
            <View style={[s.activityCard, { backgroundColor: C.surface }]}>
              {stats!.recentContributions.slice(0, 5).map((c, i) => (
                <View
                  key={c.id}
                  style={[
                    s.activityRow,
                    i < stats!.recentContributions.slice(0, 5).length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                    },
                  ]}
                >
                  <Avatar name={c.memberName} size={38} />
                  <View style={s.activityMid}>
                    <Text style={[s.activityName, { color: C.text }]}>
                      {c.memberName}
                    </Text>
                    <Text style={[s.activitySub, { color: C.textSecondary }]}>
                      {c.groupName} · {c.periodLabel}
                    </Text>
                  </View>
                  <View style={s.activityRight}>
                    <Text style={[s.activityAmt, { color: C.text }]}>
                      {fmt(c.amount)}
                    </Text>
                    <StatusPill status={c.status} size="sm" />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── MINI CHART ── */}
        {(stats?.contributionsByMonth ?? []).length > 0 && (
          <>
            <SectionHeader
              title="Évolution mensuelle"
              icon="bar-chart-outline"
            />
            <MonthlyChart
              data={stats!.contributionsByMonth}
              primaryColor={C.primary}
              textColor={C.textSecondary}
              surfaceColor={C.surface}
              borderColor={C.border}
            />
          </>
        )}

        {/* ── QUICK ACTIONS ── */}
        <SectionHeader title="Actions rapides" icon="flash-outline" />
        <View style={s.actionsGrid}>
          <QuickAction
            icon="add-circle-outline"
            label="Nouveau groupe"
            color="#10B981"
            onPress={() => router.push("/group/create")}
          />
          <QuickAction
            icon="card-outline"
            label="Enregistrer paiement"
            color="#D4AF37"
            onPress={() => router.push("/payment/record")}
          />
          <QuickAction
            icon="stats-chart-outline"
            label="Rapports"
            color="#6366F1"
            onPress={() => router.push("/(tabs)/reports")}
          />
          <QuickAction
            icon="cloud-upload-outline"
            label="Sauvegarder"
            color="#3B82F6"
            onPress={() => router.push("/settings/backup")}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon,
  action,
  onAction,
}: {
  title: string;
  icon: string;
  action?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionLeft}>
        <Ionicons
          name={icon as any}
          size={16}
          color={theme.colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text style={[s.sectionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      {action && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[s.sectionAction, { color: theme.colors.primary }]}>
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[s.pillValue, { color }]}>{value}</Text>
      <Text style={[s.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      style={[s.quickAction, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[s.quickIconWrap, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[s.quickLabel, { color: theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MonthlyChart({
  data,
  primaryColor,
  textColor,
  surfaceColor,
  borderColor,
}: {
  data: { month: string; amount: number }[];
  primaryColor: string;
  textColor: string;
  surfaceColor: string;
  borderColor: string;
}) {
  const { format: fmt } = useCurrency();
  const [selected, setSelected] = useState<number | null>(null);
  const recent = data.slice(-6);
  const max = Math.max(...recent.map((d) => d.amount), 1);
  const BAR_HEIGHT = 90;

  const MONTH_LABELS: Record<string, string> = {
    "01": "Jan",
    "02": "Fév",
    "03": "Mar",
    "04": "Avr",
    "05": "Mai",
    "06": "Jun",
    "07": "Jul",
    "08": "Aoû",
    "09": "Sep",
    "10": "Oct",
    "11": "Nov",
    "12": "Déc",
  };

  const getLabel = (month: string) => {
    const mm = month.slice(5, 7);
    return MONTH_LABELS[mm] ?? mm;
  };

  const activeIdx = selected ?? recent.length - 1;
  const activeData = recent[activeIdx];

  return (
    <View style={[s.chartCard, { backgroundColor: surfaceColor }]}>
      {/* Header: montant sélectionné */}
      <View style={s.chartHeader}>
        <View>
          <Text style={[s.chartAmt, { color: primaryColor }]}>
            {activeData ? fmt(activeData.amount) : "—"}
          </Text>
          <Text style={[s.chartAmtLabel, { color: textColor }]}>
            {activeData
              ? getLabel(activeData.month) + " " + activeData.month.slice(0, 4)
              : ""}
          </Text>
        </View>
        <View style={[s.chartTrend, { backgroundColor: primaryColor + "18" }]}>
          <Ionicons name="trending-up-outline" size={14} color={primaryColor} />
          <Text style={[s.chartTrendText, { color: primaryColor }]}>
            {recent.length} mois
          </Text>
        </View>
      </View>

      {/* Bars */}
      <View style={s.chartBars}>
        {/* Y-axis hint lines */}
        {[0.75, 0.5, 0.25].map((ratio) => (
          <View
            key={ratio}
            style={[
              s.chartGridLine,
              {
                bottom: ratio * BAR_HEIGHT + 20,
                borderColor: borderColor + "60",
              },
            ]}
          />
        ))}

        {recent.map((d, i) => {
          const isActive = i === activeIdx;
          const barH = Math.max((d.amount / max) * BAR_HEIGHT, 4);
          return (
            <TouchableOpacity
              key={i}
              style={s.chartCol}
              onPress={() => setSelected(i === selected ? null : i)}
              activeOpacity={0.7}
            >
              {/* Value tooltip */}
              {isActive && d.amount > 0 && (
                <View
                  style={[s.chartTooltip, { backgroundColor: primaryColor }]}
                >
                  <Text style={s.chartTooltipText}>
                    {fmt(d.amount).replace(/\s/g, "\u202f")}
                  </Text>
                  <View
                    style={[
                      s.chartTooltipArrow,
                      { borderTopColor: primaryColor },
                    ]}
                  />
                </View>
              )}
              <View style={s.chartBarWrap}>
                <View
                  style={[
                    s.chartBar,
                    {
                      height: barH,
                      backgroundColor: isActive
                        ? primaryColor
                        : primaryColor + "40",
                      borderRadius: 6,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  s.chartLabel,
                  {
                    color: isActive ? primaryColor : textColor,
                    fontWeight: isActive ? "700" : "400",
                  },
                ]}
              >
                {getLabel(d.month)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A3D2E" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerLeft: {},
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  greeting: { color: "#ffffff70", fontSize: 12, letterSpacing: 0.3 },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff15",
    alignItems: "center",
    justifyContent: "center",
  },

  // Balance card
  balanceCard: {
    marginHorizontal: 16,
    marginBottom: 0,
    backgroundColor: "#0D4F38",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ffffff15",
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  balanceLabel: { color: "#ffffff70", fontSize: 12, marginBottom: 4 },
  balanceAmount: {
    color: Colors.gold[300],
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  rateCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold[400] + "20",
    borderWidth: 1.5,
    borderColor: Colors.gold[400] + "50",
    alignItems: "center",
    justifyContent: "center",
  },
  rateText: {
    color: Colors.gold[300],
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  rateLabel: { color: Colors.gold[400] + "90", fontSize: 9 },
  balanceFooter: { flexDirection: "row", gap: 20, marginTop: 4 },
  balanceStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  balanceStatLabel: { color: "#ffffff60", fontSize: 12 },
  balanceStatVal: { color: "#ffffffCC", fontWeight: "600" },

  // Scroll
  scroll: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
  },
  scrollContent: { padding: 20, paddingTop: 16 },

  // Stat pills
  pillsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  pill: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  pillValue: { fontSize: 18, fontWeight: "800" },
  pillLabel: { fontSize: 10, fontWeight: "600", opacity: 0.8 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  sectionLeft: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionAction: { fontSize: 13, fontWeight: "600" },

  // Beneficiary
  benefCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
  },
  benefLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  benefName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  benefGroup: { fontSize: 12, marginBottom: 4 },
  benefDateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  benefDate: { fontSize: 12 },
  benefAmtBadge: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  benefAmt: { fontSize: 15, fontWeight: "800" },

  // Activity
  activityCard: { borderRadius: 16, overflow: "hidden" },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  activityMid: { flex: 1 },
  activityName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  activitySub: { fontSize: 12 },
  activityRight: { alignItems: "flex-end", gap: 4 },
  activityAmt: { fontSize: 14, fontWeight: "700" },

  // Chart
  chartCard: { borderRadius: 18, padding: 16, marginBottom: 4 },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  chartAmt: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  chartAmtLabel: { fontSize: 12, marginTop: 2 },
  chartTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chartTrendText: { fontSize: 12, fontWeight: "600" },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 130,
    position: "relative",
  },
  chartGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartBarWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chartBar: { width: "70%" },
  chartLabel: { fontSize: 10, marginTop: 6 },
  chartTooltip: {
    position: "absolute",
    top: 0,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
    minWidth: 60,
    alignItems: "center",
  },
  chartTooltipText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  chartTooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: 0,
  },

  // Quick actions
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickAction: {
    width: CARD_W,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  quickIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
