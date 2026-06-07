import React, { useEffect, useState } from "react";
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Text, Alert, Image, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useMembersStore, useContributionsStore } from "../../src/stores";
import { useCurrency } from "../../src/hooks/useCurrency";
import Avatar from "../../src/components/common/Avatar";
import StatusPill from "../../src/components/common/StatusPill";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import { Colors } from "../../src/constants/theme";
import type { Contribution } from "../../src/types";

export default function MemberDetailScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const C = theme.colors;
  const { members, removeMember } = useMembersStore();
  const { contributions, loadContributions } = useContributionsStore();
  const { format: fmt } = useCurrency();
  const [loading, setLoading] = useState(true);

  const member = members.find((m) => m.id === id);

  useEffect(() => {
    if (groupId) loadContributions(groupId).finally(() => setLoading(false));
    else setLoading(false);
  }, [groupId]);

  const memberContribs = contributions.filter((c) => c.memberId === id);
  const totalPaid   = memberContribs.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const paidCount   = memberContribs.filter((c) => c.status === "paid").length;
  const overdueCount = memberContribs.filter((c) => c.status === "unpaid").length;

  const confirmDelete = () =>
    Alert.alert(
      "Supprimer le membre",
      `Supprimer ${member?.name} ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer", style: "destructive",
          onPress: async () => { await removeMember(member!.id); router.back(); },
        },
      ]
    );

  if (loading) return <LoadingSpinner fullscreen />;

  if (!member) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A3D2E" }}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Fiche membre</Text>
            <View style={s.iconBtn} />
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Ionicons name="person-outline" size={48} color={C.textSecondary} />
          <Text style={{ color: C.textSecondary, fontSize: 16 }}>Membre introuvable</Text>
        </View>
      </View>
    );
  }

  const initials = member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />

      {/* ── HEADER ── */}
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Fiche membre</Text>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: "rgba(239,68,68,0.2)" }]}
            onPress={confirmDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#FCA5A5" />
          </TouchableOpacity>
        </View>

        {/* Avatar hero */}
        <View style={s.heroSection}>
          <View style={s.avatarRing}>
            {member.photoUri ? (
              <Image source={{ uri: member.photoUri }} style={s.avatarImg} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={s.heroName}>{member.name}</Text>
          <Text style={s.heroPhone}>{member.phone || "—"}</Text>
          {member.profession && (
            <Text style={s.heroProfession}>{member.profession}</Text>
          )}
          <View style={s.heroBadges}>
            <View style={[s.badge, { backgroundColor: member.isActive ? "#D1FAE5" : "#FEE2E2" }]}>
              <Ionicons
                name={member.isActive ? "checkmark-circle" : "close-circle"}
                size={12}
                color={member.isActive ? "#065F46" : "#991B1B"}
              />
              <Text style={[s.badgeText, { color: member.isActive ? "#065F46" : "#991B1B" }]}>
                {member.isActive ? "Actif" : "Inactif"}
              </Text>
            </View>
            {member.beneficiaryOrder != null && (
              <View style={[s.badge, { backgroundColor: "rgba(212,175,55,0.2)" }]}>
                <Ionicons name="trophy-outline" size={12} color={Colors.gold[600]} />
                <Text style={[s.badgeText, { color: Colors.gold[600] }]}>
                  Ordre #{member.beneficiaryOrder}
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── STATS ── */}
        <View style={s.statsRow}>
          {[
            { label: "Total payé",  value: fmt(totalPaid), color: C.primary,  icon: "wallet-outline"         },
            { label: "Paiements",   value: String(paidCount), color: C.success, icon: "checkmark-circle-outline" },
            { label: "Retards",     value: String(overdueCount), color: overdueCount > 0 ? C.error : C.success, icon: "alert-circle-outline" },
          ].map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: C.surface }]}>
              <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: C.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── INFOS ── */}
        <SectionLabel label="INFORMATIONS" />
        <View style={[s.infoCard, { backgroundColor: C.surface }]}>
          {[
            member.address   && { icon: "location-outline",      text: member.address },
            member.profession && { icon: "briefcase-outline",     text: member.profession },
            member.notes     && { icon: "document-text-outline",  text: member.notes },
            { icon: "calendar-outline", text: `Ajouté le ${new Date(member.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` },
          ].filter(Boolean).map((row: any, i, arr) => (
            <View key={i} style={[s.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: C.border }]}>
              <Ionicons name={row.icon} size={18} color={C.primary} />
              <Text style={[s.infoText, { color: C.text }]}>{row.text}</Text>
            </View>
          ))}
        </View>

        {/* ── COTISATIONS ── */}
        <SectionLabel label={`COTISATIONS (${memberContribs.length})`} />
        {memberContribs.length === 0 ? (
          <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
            <Ionicons name="wallet-outline" size={36} color={C.textSecondary} />
            <Text style={[s.emptyText, { color: C.textSecondary }]}>Aucune cotisation</Text>
          </View>
        ) : (
          <View style={[s.infoCard, { backgroundColor: C.surface }]}>
            {memberContribs.slice(0, 10).map((c: Contribution, i: number) => (
              <View
                key={c.id}
                style={[
                  s.contribRow,
                  { borderBottomColor: C.border },
                  i === Math.min(memberContribs.length, 10) - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.contribLabel, { color: C.text }]}>{c.periodLabel}</Text>
                  <Text style={[s.contribDate, { color: C.textSecondary }]}>
                    Dû le {new Date(c.dueDate).toLocaleDateString("fr-FR")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[s.contribAmt, { color: C.text }]}>{fmt(c.amount)}</Text>
                  <StatusPill status={c.status} size="sm" />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <Text style={[s.sectionLbl, { color: theme.colors.textSecondary }]}>{label}</Text>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerBg: { backgroundColor: "#0A3D2E" },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 10,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, color: "#fff", fontSize: 19, fontWeight: "700" },

  heroSection: { alignItems: "center", paddingBottom: 20, gap: 4 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, borderColor: "rgba(212,175,55,0.5)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#D4AF37",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: "#0A3D2E" },
  heroName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  heroPhone: { color: "rgba(255,255,255,0.65)", fontSize: 14, marginTop: 2 },
  heroProfession: { color: Colors.gold[300], fontSize: 13, marginTop: 2 },
  heroBadges: { flexDirection: "row", gap: 8, marginTop: 10 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },

  scroll: { padding: 16 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11 },

  sectionLbl: {
    fontSize: 11, fontWeight: "700", letterSpacing: 1.2,
    marginTop: 20, marginBottom: 10,
  },

  infoCard: { borderRadius: 14, overflow: "hidden" },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  infoText: { flex: 1, fontSize: 14 },

  contribRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  contribLabel: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  contribDate: { fontSize: 12 },
  contribAmt: { fontSize: 14, fontWeight: "700" },

  emptyBox: { borderRadius: 14, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14 },
});