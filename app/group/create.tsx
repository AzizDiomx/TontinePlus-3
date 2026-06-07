import React, { useState } from "react";
import {
  View, ScrollView, TouchableOpacity, Text,
  StyleSheet, Alert, StatusBar, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGroupsStore } from "../../src/stores";
import AppButton from "../../src/components/common/AppButton";
import AppInput from "../../src/components/common/AppInput";
import { useTheme } from "../../src/hooks/useTheme";
import { Colors, Spacing, Radius } from "../../src/constants/theme";
import type { ContributionFrequency, BeneficiarySelectionMode, CurrencyCode } from "../../src/types";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  description: z.string().optional(),
  contributionAmount: z
    .string().min(1, "Montant requis")
    .transform((v) => parseFloat(v))
    .refine((v) => v > 0, "Montant invalide"),
  startDate: z.string().min(1, "Date requise"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type FreqDef = { value: ContributionFrequency; label: string; icon: string; desc: string };
const FREQS: FreqDef[] = [
  { value: "daily",    icon: "sunny-outline",     label: "Quotidien",     desc: "Chaque jour"     },
  { value: "weekly",   icon: "calendar-outline",  label: "Hebdomadaire",  desc: "Chaque semaine"  },
  { value: "monthly",  icon: "calendar-clear-outline", label: "Mensuel",  desc: "Chaque mois"     },
  { value: "custom",   icon: "settings-outline",  label: "Personnalisé",  desc: "À définir"       },
];

type CurrDef = { value: CurrencyCode; label: string; symbol: string };
const CURRS: CurrDef[] = [
  { value: "XOF", label: "XOF", symbol: "FCFA" },
  { value: "XAF", label: "XAF", symbol: "FCFA" },
  { value: "EUR", label: "EUR", symbol: "€"    },
  { value: "USD", label: "USD", symbol: "$"    },
];

type ModeDef = { value: BeneficiarySelectionMode; label: string; desc: string; icon: string };
const MODES: ModeDef[] = [
  { value: "manual",    icon: "hand-left-outline",  label: "Manuel",       desc: "Vous choisissez l'ordre" },
  { value: "automatic", icon: "list-outline",        label: "Automatique",  desc: "Ordre d'inscription"    },
  { value: "random",    icon: "shuffle-outline",     label: "Aléatoire",    desc: "Tirage au sort"          },
];

export default function CreateGroupScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { createGroup } = useGroupsStore();
  const C = theme.colors;

  const [freq, setFreq]       = useState<ContributionFrequency>("monthly");
  const [curr, setCurr]       = useState<CurrencyCode>("XOF");
  const [mode, setMode]       = useState<BeneficiarySelectionMode>("automatic");
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { startDate: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const group = await createGroup({
        name: data.name,
        description: data.description ?? "",
        photoUri: null,
        contributionAmount: parseFloat(data.contributionAmount),
        currency: curr,
        frequency: freq,
        startDate: data.startDate,
        selectionMode: mode,
        notes: data.notes ?? "",
      });
      Alert.alert("Groupe créé", `"${group.name}" a été créé avec succès.`, [
        { text: "Voir le groupe",    onPress: () => { router.back(); router.push(`/group/${group.id}`); } },
        { text: "Ajouter des membres", onPress: () => { router.back(); router.push({ pathname: "/member/create", params: { groupId: group.id } }); } },
      ]);
    } catch {
      Alert.alert("Erreur", "Impossible de créer le groupe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Nouvelle tontine</Text>
            <Text style={s.headerSub}>Configurez votre groupe d'épargne</Text>
          </View>
          <View style={[s.iconBtn, { backgroundColor: "rgba(212,175,55,0.2)", borderWidth: 1, borderColor: "rgba(212,175,55,0.4)" }]}>
            <Ionicons name="people" size={18} color="#D4AF37" />
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={[s.sheet, { backgroundColor: C.background }]}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* INFOS */}
          <SectionLabel icon="information-circle-outline" label="INFORMATIONS" color={C.primary} />
          <Controller control={control} name="name"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Nom du groupe" placeholder="Tontine Amis du quartier"
                value={value ?? ""} onChangeText={onChange} error={errors.name?.message}
                leftIcon="text-outline" />
            )}
          />
          <Controller control={control} name="description"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Description" placeholder="Description optionnelle…"
                value={value ?? ""} onChangeText={onChange}
                leftIcon="document-text-outline" multiline numberOfLines={2} />
            )}
          />

          {/* FRÉQUENCE */}
          <SectionLabel icon="time-outline" label="FRÉQUENCE DE COTISATION" color={C.primary} />
          <View style={s.freqGrid}>
            {FREQS.map((f) => {
              const active = f.value === freq;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[s.freqCard, { backgroundColor: active ? C.primary + "15" : C.surface, borderColor: active ? C.primary : C.border }]}
                  onPress={() => setFreq(f.value)}
                  activeOpacity={0.75}
                >
                  <View style={[s.freqIcon, { backgroundColor: active ? C.primary + "20" : C.border + "40" }]}>
                    <Ionicons name={f.icon as any} size={20} color={active ? C.primary : C.textSecondary} />
                  </View>
                  <Text style={[s.freqLabel, { color: active ? C.primary : C.text }]}>{f.label}</Text>
                  <Text style={[s.freqDesc, { color: C.textSecondary }]}>{f.desc}</Text>
                  {active && (
                    <View style={[s.freqCheck, { backgroundColor: C.primary }]}>
                      <Ionicons name="checkmark" size={11} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* DEVISE + MONTANT */}
          <SectionLabel icon="cash-outline" label="COTISATION" color={C.primary} />
          <View style={s.currRow}>
            {CURRS.map((c) => {
              const active = c.value === curr;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[s.currChip, { backgroundColor: active ? C.primary : C.surface, borderColor: active ? C.primary : C.border }]}
                  onPress={() => setCurr(c.value)}
                >
                  <Text style={[s.currLabel, { color: active ? "#fff" : C.textSecondary }]}>{c.label}</Text>
                  <Text style={[s.currSymbol, { color: active ? "rgba(255,255,255,0.7)" : C.textSecondary }]}>{c.symbol}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Controller control={control} name="contributionAmount"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Montant de cotisation" placeholder="25 000"
                value={String(value ?? "")} onChangeText={onChange}
                keyboardType="numeric" error={errors.contributionAmount?.message as string | undefined}
                leftIcon="wallet-outline" />
            )}
          />
          <Controller control={control} name="startDate"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Date de démarrage" placeholder="AAAA-MM-JJ"
                value={value ?? ""} onChangeText={onChange}
                error={errors.startDate?.message} leftIcon="calendar-outline" />
            )}
          />

          {/* MODE */}
          <SectionLabel icon="shuffle-outline" label="SÉLECTION DES BÉNÉFICIAIRES" color={C.primary} />
          {MODES.map((m) => {
            const active = m.value === mode;
            return (
              <TouchableOpacity
                key={m.value}
                style={[s.modeRow, { backgroundColor: active ? C.primary + "12" : C.surface, borderColor: active ? C.primary : C.border }]}
                onPress={() => setMode(m.value)}
                activeOpacity={0.75}
              >
                <View style={[s.modeIcon, { backgroundColor: active ? C.primary + "20" : C.border + "40" }]}>
                  <Ionicons name={m.icon as any} size={18} color={active ? C.primary : C.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modeLabel, { color: active ? C.primary : C.text }]}>{m.label}</Text>
                  <Text style={[s.modeDesc, { color: C.textSecondary }]}>{m.desc}</Text>
                </View>
                <View style={[s.radio, { borderColor: active ? C.primary : C.border }]}>
                  {active && <View style={[s.radioDot, { backgroundColor: C.primary }]} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* NOTES */}
          <SectionLabel icon="document-text-outline" label="NOTES" color={C.primary} />
          <Controller control={control} name="notes"
            render={({ field: { onChange, value } }) => (
              <AppInput label="Notes" placeholder="Règles, informations importantes…"
                value={value ?? ""} onChangeText={onChange}
                leftIcon="create-outline" multiline numberOfLines={3} />
            )}
          />

          <AppButton
            title="Créer la tontine"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={s.submitBtn}
          />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={s.sectionLabel}>
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.sectionLabelText, { color }]}>{label}</Text>
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

  sheet: { flex: 1 },
  content: { padding: 16 },

  sectionLabel: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 20, marginBottom: 12,
  },
  sectionLabelText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },

  freqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  freqCard: {
    width: "47.5%", borderWidth: 1.5, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 6, position: "relative",
  },
  freqIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  freqLabel: { fontSize: 13, fontWeight: "700" },
  freqDesc: { fontSize: 11 },
  freqCheck: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },

  currRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  currChip: {
    flex: 1, borderWidth: 1.5, borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
  },
  currLabel: { fontSize: 13, fontWeight: "700" },
  currSymbol: { fontSize: 10, marginTop: 2 },

  modeRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  modeIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  modeLabel: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  modeDesc: { fontSize: 12 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  submitBtn: { marginTop: 20 },
});