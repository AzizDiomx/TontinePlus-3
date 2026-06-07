import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/hooks/useTheme";
import { NotificationRepository } from "../src/repositories";
import LoadingSpinner from "../src/components/common/LoadingSpinner";
import type { AppNotification } from "../src/types";

const TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  contribution_reminder: {
    icon: "wallet",
    color: "#F59E0B",
    label: "Cotisation",
  },
  overdue_alert: { icon: "alert-circle", color: "#EF4444", label: "Retard" },
  beneficiary_turn: { icon: "trophy", color: "#10B981", label: "Bénéficiaire" },
  meeting_reminder: { icon: "people", color: "#6366F1", label: "Réunion" },
  general: { icon: "notifications", color: "#6B7280", label: "Info" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const C = theme.colors;
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    NotificationRepository.getAll()
      .then(setNotifs)
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await NotificationRepository.markAllRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = async (id: string) => {
    await NotificationRepository.markRead(id);
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const unread = notifs.filter((n) => !n.isRead).length;

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#072D20" />
      <SafeAreaView edges={["top"]} style={s.headerBg}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notifications</Text>
          {unread > 0 ? (
            <TouchableOpacity style={s.iconBtn} onPress={markAllRead}>
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color="#D4AF37"
              />
            </TouchableOpacity>
          ) : (
            <View style={s.iconBtn} />
          )}
        </View>
        {unread > 0 && (
          <Text style={s.unreadBadge}>
            {unread} non lue{unread > 1 ? "s" : ""}
          </Text>
        )}
      </SafeAreaView>

      {notifs.length === 0 ? (
        <View style={s.empty}>
          <Ionicons
            name="notifications-off-outline"
            size={48}
            color={C.textSecondary}
          />
          <Text style={[s.emptyTitle, { color: C.text }]}>
            Aucune notification
          </Text>
          <Text style={[s.emptySub, { color: C.textSecondary }]}>
            Vos notifications apparaîtront ici
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {notifs.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.general;
            const isUnread = !n.isRead;
            return (
              <TouchableOpacity
                key={n.id}
                style={[
                  s.card,
                  { backgroundColor: isUnread ? C.primary + "0E" : C.surface },
                ]}
                onPress={() => markRead(n.id)}
                activeOpacity={0.75}
              >
                <View
                  style={[s.iconWrap, { backgroundColor: cfg.color + "20" }]}
                >
                  <Ionicons
                    name={cfg.icon as any}
                    size={20}
                    color={cfg.color}
                  />
                </View>
                <View style={s.cardBody}>
                  <Text style={[s.cardTitle, { color: C.text }]}>
                    {n.title}
                  </Text>
                  <Text style={[s.cardSub, { color: C.textSecondary }]}>
                    {n.body}
                  </Text>
                  <View style={s.cardMeta}>
                    <Text style={[s.cardTime, { color: C.textSecondary }]}>
                      {timeAgo(n.createdAt)}
                    </Text>
                    <View
                      style={[
                        s.typeBadge,
                        { backgroundColor: cfg.color + "20" },
                      ]}
                    >
                      <Text style={[s.typeText, { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </View>
                  </View>
                </View>
                {isUnread && (
                  <View style={[s.dot, { backgroundColor: C.primary }]} />
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
    paddingBottom: 10,
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
  unreadBadge: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    paddingBottom: 10,
  },
  scroll: { padding: 14 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  cardSub: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTime: { fontSize: 11 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 11, fontWeight: "700" },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6, flexShrink: 0 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14 },
});
