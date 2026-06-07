import React, { useEffect, useState } from "react";
import {
  View, ScrollView, StyleSheet, TouchableOpacity,
  Text, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/useTheme";
import { useMembersStore, useContributionsStore, useGroupsStore } from "../../src/stores";
import { useCurrency } from "../../src/hooks/useCurrency";
import Avatar from "../../src/components/common/Avatar";
import StatusPill from "../../src/components/common/StatusPill";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import AppButton from "../../src/components/common/AppButton";
import type { Contribution, Group } from "../../src/types";

export default function RecordPaymentScreen() {
  const { groupId: paramGroupId, memberId, contributionId } = useLocalSearchParams<{
    groupId?: string; memberId?: string; contributionId?: string;
  }>();
  const router  = useRouter();
  const { theme } = useTheme();
  const C = theme.colors;
  const { members, loadMembers }                            = useMembersStore();
  const { contributions, loadContributions, recordPayment, isLoading } = useContributionsStore();
  const { groups, loadGroups, loadGroupDetails }            = useGroupsStore();
  const { format: fmt }                                     = useCurrency();

  // Si groupId fourni on le fixe, sinon l'user choisit
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(paramGroupId ?? null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(memberId ?? null);
  const [selectedContrib, setSelectedContrib]   = useState<Contribution | null>(null);
  const [customAmount, setCustomAmount]         = useState("");
  const [paymentType, setPaymentType]           = useState<"full" | "partial">("full");
  const [loading, setLoading]                   = useState(true);

  // Charge les groupes si pas de groupId param
  useEffect(() => {
    const init = async () => {
      if (paramGroupId) {
        await Promise.all([
          loadMembers(paramGroupId),
          loadContributions(paramGroupId),
          loadGroupDetails(paramGroupId),
        ]);
      } else {
        await loadGroups();
      }
      setLoading(false);
    };
    init();
  }, []);

  // Quand l'utilisateur sélectionne un groupe
  useEffect(() => {
    if (selectedGroupId && !paramGroupId) {
      loadMembers(selectedGroupId);
      loadContributions(selectedGroupId);
      setSelectedMemberId(null);
      setSelectedContrib(null);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (contributionId) {
      const c = contributions.find((x) => x.id === contributionId);
      if (c) setSelectedContrib(c);
    }
  }, [contributions, contributionId]);

  const unpaid = selectedMemberId
    ? contributions.filter(
        (c) => c.memberId === selectedMemberId &&
        (c.status === "unpaid" || c.status === "partial" || c.status === "pending")
      )
    : [];

  const onPay = async () => {
    if (!selectedContrib) { Alert.alert("Attention", "Sélectionnez une cotisation"); return; }
    const amount = paymentType === "full" ? selectedContrib.expectedAmount : parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert("Montant invalide", "Entrez un montant valide"); return; }
    try {
      await recordPayment({ contributionId: selectedContrib.id, amount, paymentDate: new Date().toISOString() });
      Alert.alert("Paiement enregistré", `${fmt(amount)} enregistré avec succès`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible d'enregistrer le paiement");
    }
  };

  if (loading) return <LoadingSpinner fullscreen />;

  const FREQ_LABEL: Record<string, string> = {
    daily: "Quotidien", weekly: "Hebdo", biweekly: "Bimensuel",
    monthly: "Mensuel", custom: "Personnalisé",
  };

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Enregistrer un paiement</Text>
            <Text style={s.headerSub}>
              {selectedGroupId
                ? groups.find(g => g.id === selectedGroupId)?.name ?? "Groupe sélectionné"
                : "Choisissez un groupe"}
            </Text>
          </View>
          <View style={[s.iconBtn, { backgroundColor: "rgba(212,175,55,0.2)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }]}>
            <Ionicons name="card" size={18} color="#D4AF37" />
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── ÉTAPE 1 : GROUPE (si pas de paramètre) ── */}
          {!paramGroupId && (
            <>
              <SLabel icon="people-circle-outline" label="1. SÉLECTIONNER UN GROUPE" color={C.primary} />
              {groups.length === 0 ? (
                <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
                  <Ionicons name="people-outline" size={36} color={C.textSecondary} />
                  <Text style={[s.emptyText, { color: C.textSecondary }]}>Aucun groupe créé</Text>
                </View>
              ) : (
                groups.filter(g => g.status === "active").map((g) => {
                  const active = selectedGroupId === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[s.row, { backgroundColor: active ? C.primary + "12" : C.surface, borderColor: active ? C.primary : C.border }]}
                      onPress={() => setSelectedGroupId(active ? null : g.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.groupIcon, { backgroundColor: C.primary + "18" }]}>
                        <Ionicons name="people" size={20} color={C.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, { color: C.text }]}>{g.name}</Text>
                        <Text style={[s.rowSub, { color: C.textSecondary }]}>
                          {g.memberCount} membre{g.memberCount !== 1 ? "s" : ""} · {FREQ_LABEL[g.frequency] ?? g.frequency}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* ── ÉTAPE 2 : MEMBRE ── */}
          {selectedGroupId && (
            <>
              <SLabel
                icon="person-outline"
                label={paramGroupId ? "1. SÉLECTIONNER UN MEMBRE" : "2. SÉLECTIONNER UN MEMBRE"}
                color={C.primary}
              />
              {members.length === 0 ? (
                <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
                  <Ionicons name="person-outline" size={36} color={C.textSecondary} />
                  <Text style={[s.emptyText, { color: C.textSecondary }]}>Aucun membre dans ce groupe</Text>
                </View>
              ) : (
                members.map((m) => {
                  const active = selectedMemberId === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.row, { backgroundColor: active ? C.primary + "12" : C.surface, borderColor: active ? C.primary : C.border }]}
                      onPress={() => { setSelectedMemberId(active ? null : m.id); setSelectedContrib(null); }}
                      activeOpacity={0.75}
                    >
                      <Avatar name={m.name} size={42} photoUri={m.photoUri} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, { color: C.text }]}>{m.name}</Text>
                        <Text style={[s.rowSub, { color: C.textSecondary }]}>{m.phone || "—"}</Text>
                      </View>
                      {active
                        ? <Ionicons name="checkmark-circle" size={22} color={C.primary} />
                        : <View style={[s.statusDot, { backgroundColor: m.contributionStatus === "paid" ? C.success : m.contributionStatus === "unpaid" ? C.error : C.warning }]} />
                      }
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* ── ÉTAPE 3 : COTISATION ── */}
          {selectedMemberId && (
            <>
              <SLabel
                icon="wallet-outline"
                label={paramGroupId ? "2. COTISATION À PAYER" : "3. COTISATION À PAYER"}
                color={C.primary}
              />
              {unpaid.length === 0 ? (
                <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
                  <Ionicons name="checkmark-circle" size={36} color={C.success} />
                  <Text style={[s.emptyText, { color: C.textSecondary }]}>Aucune cotisation en attente</Text>
                </View>
              ) : (
                unpaid.map((c) => {
                  const active = selectedContrib?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.row, { backgroundColor: active ? C.primary + "12" : C.surface, borderColor: active ? C.primary : C.border }]}
                      onPress={() => setSelectedContrib(active ? null : c)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, { color: C.text }]}>{c.periodLabel}</Text>
                        <Text style={[s.rowSub, { color: C.textSecondary }]}>
                          Dû le {new Date(c.dueDate).toLocaleDateString("fr-FR")}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={[s.rowTitle, { color: C.primary }]}>{fmt(c.expectedAmount)}</Text>
                        <StatusPill status={c.status} size="sm" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}

          {/* ── ÉTAPE 4 : MONTANT ── */}
          {selectedContrib && (
            <>
              <SLabel
                icon="cash-outline"
                label={paramGroupId ? "3. TYPE DE PAIEMENT" : "4. TYPE DE PAIEMENT"}
                color={C.primary}
              />
              <View style={s.typeRow}>
                {(["full", "partial"] as const).map((type) => {
                  const active = paymentType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[s.typeBtn, { backgroundColor: active ? C.primary + "15" : C.surface, borderColor: active ? C.primary : C.border }]}
                      onPress={() => setPaymentType(type)}
                    >
                      <Ionicons
                        name={type === "full" ? "checkmark-circle-outline" : "remove-circle-outline"}
                        size={24}
                        color={active ? C.primary : C.textSecondary}
                      />
                      <Text style={[s.typeBtnText, { color: active ? C.primary : C.textSecondary }]}>
                        {type === "full" ? "Complet" : "Partiel"}
                      </Text>
                      {type === "full" && (
                        <Text style={[s.typeBtnSub, { color: active ? C.primary : C.textSecondary }]}>
                          {fmt(selectedContrib.expectedAmount)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount display */}
              <View style={[s.amountBox, { backgroundColor: C.surface }]}>
                <Text style={[s.amountLabel, { color: C.textSecondary }]}>Montant à enregistrer</Text>
                <Text style={[s.amountValue, { color: C.primary }]}>
                  {paymentType === "full"
                    ? fmt(selectedContrib.expectedAmount)
                    : customAmount ? fmt(parseFloat(customAmount)) : "0 FCFA"}
                </Text>
                {paymentType === "partial" && selectedContrib.expectedAmount > 0 && (
                  <View style={[s.amountProgress, { backgroundColor: C.border }]}>
                    <View style={[s.amountProgressFill, {
                      backgroundColor: C.primary,
                      width: `${Math.min((parseFloat(customAmount) || 0) / selectedContrib.expectedAmount * 100, 100)}%`,
                    }]} />
                  </View>
                )}
                {paymentType === "partial" && (
                  <Text style={[s.amountDue, { color: C.textSecondary }]}>
                    Total dû : {fmt(selectedContrib.expectedAmount)}
                  </Text>
                )}
              </View>

              {/* Numpad for partial */}
              {paymentType === "partial" && (
                <View style={[s.numpad, { backgroundColor: C.surface }]}>
                  {["1","2","3","4","5","6","7","8","9","000","0","⌫"].map((k) => (
                    <TouchableOpacity
                      key={k}
                      style={[s.numKey, { backgroundColor: k === "⌫" ? C.error + "15" : C.background }]}
                      onPress={() => {
                        if (k === "⌫") setCustomAmount(p => p.slice(0, -1));
                        else setCustomAmount(p => (p + k).replace(/^0+/, "") || "0");
                      }}
                    >
                      <Text style={[s.numKeyText, { color: k === "⌫" ? C.error : C.text }]}>{k}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <AppButton title="Confirmer le paiement" onPress={onPay} loading={isLoading} style={{ marginTop: 8 }} />
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16, gap: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 },
  scroll: { padding: 16 },
  sLabel: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20, marginBottom: 10 },
  sLabelText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  groupIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10,
  },
  rowTitle: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowSub: { fontSize: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyBox: { borderRadius: 14, padding: 28, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14 },
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  typeBtn: {
    flex: 1, borderWidth: 1.5, borderRadius: 14,
    padding: 16, alignItems: "center", gap: 6,
  },
  typeBtnText: { fontSize: 14, fontWeight: "700" },
  typeBtnSub: { fontSize: 12, opacity: 0.8 },
  amountBox: { borderRadius: 16, padding: 20, alignItems: "center", marginVertical: 12, gap: 8 },
  amountLabel: { fontSize: 12 },
  amountValue: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  amountProgress: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden" },
  amountProgressFill: { height: "100%", borderRadius: 3 },
  amountDue: { fontSize: 12 },
  numpad: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8, borderRadius: 16, padding: 12, marginBottom: 16,
  },
  numKey: {
    width: "30%", aspectRatio: 2.2,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  numKeyText: { fontSize: 20, fontWeight: "500" },
});