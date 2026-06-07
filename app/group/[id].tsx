import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGroupsStore,
  useMembersStore,
  useContributionsStore,
  useBeneficiariesStore,
} from "../../src/stores";
import { useTheme } from "../../src/hooks/useTheme";
import { useCurrency } from "../../src/hooks/useCurrency";
import Avatar from "../../src/components/common/Avatar";
import ProgressBar from "../../src/components/common/ProgressBar";
import StatusPill from "../../src/components/common/StatusPill";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import { Colors, Spacing, Radius } from "../../src/constants/theme";
import type { MemberWithStats } from "../../src/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TABS = [
  { label: "Membres", icon: "people-outline" },
  { label: "Cotisations", icon: "wallet-outline" },
  { label: "Bénéficiaires", icon: "trophy-outline" },
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { format: fmt } = useCurrency();
  const C = theme.colors;

  const { selectedGroup, loadGroupDetails, deleteGroup } = useGroupsStore();
  const { members, loadMembers } = useMembersStore();
  const { contributions, loadContributions } = useContributionsStore();
  const {
    beneficiaries,
    load: loadBens,
    setup: setupBens,
  } = useBeneficiariesStore();
  const [activeTab, setActiveTab] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadGroupDetails(id);
        loadMembers(id, 1);
        loadContributions(id);
        loadBens(id);
      }
    }, [id])
  );

  const handleDelete = () =>
    Alert.alert(
      "Supprimer le groupe",
      `Supprimer "${selectedGroup?.name}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteGroup(id!);
            router.back();
          },
        },
      ]
    );

  const handleSetupBens = async () => {
    await setupBens(id!);
    Alert.alert(
      "Rotation configurée",
      "Le calendrier des bénéficiaires a été créé."
    );
  };

  if (!selectedGroup) return <LoadingSpinner fullscreen />;

  const g = selectedGroup;
  const totalCollected = g.totalCollected ?? 0;
  const totalExpected = g.contributionAmount * g.memberCount * g.currentCycle;
  const rate = totalExpected > 0 ? totalCollected / totalExpected : 0;

  const ACTIONS = [
    {
      icon: "person-add-outline",
      label: "Membre",
      color: "#10B981",
      onPress: () =>
        router.push({ pathname: "/member/create", params: { groupId: id } }),
    },
    {
      icon: "card-outline",
      label: "Paiement",
      color: "#D4AF37",
      onPress: () =>
        router.push({ pathname: "/payment/record", params: { groupId: id } }),
    },
    {
      icon: "shuffle-outline",
      label: "Rotation",
      color: "#6366F1",
      onPress: handleSetupBens,
    },
    {
      icon: "bar-chart-outline",
      label: "Rapport",
      color: "#3B82F6",
      onPress: () => router.push("/(tabs)/reports"),
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* ── HEADER ── */}
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            {g.name}
          </Text>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: "rgba(239,68,68,0.2)" }]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* Stats bubbles */}
        <View style={s.bubblesRow}>
          {[
            { label: "Membres", value: String(g.memberCount) },
            {
              label: "Cycle",
              value: `${g.currentCycle}/${g.totalCycles || "?"}`,
            },
            { label: "Collecté", value: fmt(totalCollected) },
            { label: "Distribué", value: fmt(g.totalDistributed ?? 0) },
          ].map((b) => (
            <View key={b.label} style={s.bubble}>
              <Text style={s.bubbleVal}>{b.value}</Text>
              <Text style={s.bubbleLbl}>{b.label}</Text>
            </View>
          ))}
        </View>

        {/* Progress */}
        <View style={s.progressWrap}>
          <ProgressBar progress={rate} height={5} color={Colors.gold[400]} />
          <View style={s.progressLabels}>
            <Text style={s.progressText}>Taux de collecte</Text>
            <Text style={s.progressPct}>{Math.round(rate * 100)}%</Text>
          </View>
        </View>

        {/* Next beneficiary banner */}
        {g.nextBeneficiary && (
          <View style={s.nextBenef}>
            <Ionicons name="trophy" size={16} color={Colors.gold[700]} />
            <Avatar
              name={g.nextBeneficiary.name}
              photoUri={g.nextBeneficiary.photoUri}
              size={28}
            />
            <Text style={s.nextBenefText}>
              Prochain :{" "}
              <Text style={{ fontWeight: "800" }}>
                {g.nextBeneficiary.name}
              </Text>
              {g.nextPaymentDate
                ? `  ·  ${format(new Date(g.nextPaymentDate), "dd/MM/yyyy")}`
                : ""}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* ── ACTIONS ── */}
      <View
        style={[
          s.actionsRow,
          { backgroundColor: C.surface, borderBottomColor: C.border },
        ]}
      >
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={s.actionBtn}
            onPress={a.onPress}
            activeOpacity={0.7}
          >
            <View style={[s.actionIcon, { backgroundColor: a.color + "18" }]}>
              <Ionicons name={a.icon as any} size={20} color={a.color} />
            </View>
            <Text style={[s.actionLabel, { color: C.textSecondary }]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TABS ── */}
      <View
        style={[
          s.tabsBar,
          { backgroundColor: C.surface, borderBottomColor: C.border },
        ]}
      >
        {TABS.map((t, i) => {
          const active = i === activeTab;
          return (
            <TouchableOpacity
              key={t.label}
              style={s.tabItem}
              onPress={() => setActiveTab(i)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={t.icon as any}
                size={15}
                color={active ? C.primary : C.textSecondary}
              />
              <Text
                style={[
                  s.tabLabel,
                  {
                    color: active ? C.primary : C.textSecondary,
                    fontWeight: active ? "700" : "400",
                  },
                ]}
              >
                {t.label}
              </Text>
              {active && (
                <View style={[s.tabLine, { backgroundColor: C.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* MEMBRES */}
        {activeTab === 0 &&
          (members.length === 0 ? (
            <Empty icon="people-outline" text="Aucun membre. Ajoutez-en un !" />
          ) : (
            members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[s.memberCard, { backgroundColor: C.surface }]}
                onPress={() => router.push(`/member/${m.id}`)}
                activeOpacity={0.8}
              >
                <Avatar name={m.name} photoUri={m.photoUri} size={48} />
                <View style={s.memberInfo}>
                  <Text style={[s.memberName, { color: C.text }]}>
                    {m.name}
                  </Text>
                  <Text style={[s.memberSub, { color: C.textSecondary }]}>
                    {m.phone || "—"}
                    {m.profession ? `  ·  ${m.profession}` : ""}
                  </Text>
                </View>
                <View style={s.memberRight}>
                  <Text style={[s.memberAmt, { color: C.primary }]}>
                    {fmt(m.totalPaid)}
                  </Text>
                  <StatusPill status={m.contributionStatus} size="sm" />
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={C.textSecondary}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            ))
          ))}

        {/* COTISATIONS */}
        {activeTab === 1 &&
          (contributions.length === 0 ? (
            <Empty icon="wallet-outline" text="Aucune cotisation enregistrée" />
          ) : (
            contributions.map((c) => {
              const m = members.find((x) => x.id === c.memberId);
              return (
                <View
                  key={c.id}
                  style={[s.contribCard, { backgroundColor: C.surface }]}
                >
                  <Avatar
                    name={m?.name ?? "?"}
                    photoUri={m?.photoUri}
                    size={40}
                  />
                  <View style={s.contribInfo}>
                    <Text style={[s.memberName, { color: C.text }]}>
                      {m?.name ?? "Inconnu"}
                    </Text>
                    <Text style={[s.memberSub, { color: C.textSecondary }]}>
                      {c.periodLabel}
                    </Text>
                  </View>
                  <View style={s.contribRight}>
                    <Text style={[s.memberAmt, { color: C.text }]}>
                      {fmt(c.amount)}
                    </Text>
                    <StatusPill status={c.status} size="sm" />
                  </View>
                </View>
              );
            })
          ))}

        {/* BÉNÉFICIAIRES */}
        {activeTab === 2 &&
          (beneficiaries.length === 0 ? (
            <Empty
              icon="trophy-outline"
              text={`Rotation non configurée.
Appuyez sur "Rotation" pour créer le calendrier.`}
            />
          ) : (
            beneficiaries.map((b, i) => (
              <View
                key={b.id}
                style={[
                  s.benefCard,
                  { backgroundColor: C.surface, opacity: b.isPaid ? 0.55 : 1 },
                ]}
              >
                <View
                  style={[
                    s.cycleNum,
                    { backgroundColor: b.isPaid ? C.success : C.primary },
                  ]}
                >
                  <Text style={s.cycleNumText}>{b.cycle}</Text>
                </View>
                <Avatar
                  name={b.member.name}
                  photoUri={b.member.photoUri}
                  size={42}
                />
                <View style={s.benefInfo}>
                  <Text style={[s.memberName, { color: C.text }]}>
                    {b.member.name}
                  </Text>
                  <Text style={[s.memberSub, { color: C.textSecondary }]}>
                    {format(new Date(b.scheduledDate), "dd MMM yyyy", {
                      locale: fr,
                    })}
                  </Text>
                </View>
                <View style={s.benefRight}>
                  <Text style={[s.memberAmt, { color: Colors.gold[600] }]}>
                    {fmt(b.amount)}
                  </Text>
                  <View
                    style={[
                      s.isPaidBadge,
                      { backgroundColor: b.isPaid ? "#D1FAE5" : "#FEF3C7" },
                    ]}
                  >
                    <Ionicons
                      name={b.isPaid ? "checkmark-circle" : "time-outline"}
                      size={11}
                      color={b.isPaid ? "#065F46" : "#92400E"}
                    />
                    <Text
                      style={[
                        s.isPaidText,
                        { color: b.isPaid ? "#065F46" : "#92400E" },
                      ]}
                    >
                      {b.isPaid ? "Payé" : "À venir"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={s.empty}>
      <Ionicons
        name={icon as any}
        size={44}
        color={theme.colors.textSecondary}
      />
      <Text style={[s.emptyText, { color: theme.colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header
  headerBg: { backgroundColor: "#0A3D2E" },
  headerTop: {
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
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: -0.3,
  },

  // Bubbles
  bubblesRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  bubble: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 8,
  },
  bubbleVal: { color: "#fff", fontWeight: "800", fontSize: 14 },
  bubbleLbl: { color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 },

  // Progress
  progressWrap: { paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  progressPct: { color: Colors.gold[300], fontSize: 12, fontWeight: "700" },

  // Next benef
  nextBenef: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.gold[400] + "25",
    borderTopWidth: 1,
    borderTopColor: Colors.gold[400] + "40",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  nextBenefText: { color: "rgba(255,255,255,0.9)", fontSize: 13, flex: 1 },

  // Actions
  actionsRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  actionBtn: { flex: 1, alignItems: "center", gap: 6 },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 11, fontWeight: "500" },

  // Tabs
  tabsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    position: "relative",
  },
  tabLabel: { fontSize: 13 },
  tabLine: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 2,
  },

  // Scroll
  scroll: { padding: 14 },

  // Member card
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  memberSub: { fontSize: 12 },
  memberRight: { alignItems: "flex-end", gap: 4 },
  memberAmt: { fontSize: 15, fontWeight: "700" },

  // Contrib card
  contribCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  contribInfo: { flex: 1 },
  contribRight: { alignItems: "flex-end", gap: 4 },

  // Benef card
  benefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  cycleNum: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cycleNumText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  benefInfo: { flex: 1 },
  benefRight: { alignItems: "flex-end", gap: 4 },
  isPaidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  isPaidText: { fontSize: 11, fontWeight: "700" },

  // Empty
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});
