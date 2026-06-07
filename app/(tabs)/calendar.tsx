import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../src/hooks/useTheme";
import { useGroupsStore } from "../../src/stores";
import { useCurrency } from "../../src/hooks/useCurrency";
import LoadingSpinner from "../../src/components/common/LoadingSpinner";
import {
  MeetingRepository,
  BeneficiaryRepository,
  ContributionRepository,
} from "../../src/repositories";
import type { Meeting, Beneficiary, Contribution } from "../../src/types";

type EventType = "meeting" | "beneficiary" | "contribution";
type CalendarEvent = {
  id: string;
  date: string;
  type: EventType;
  title: string;
  subtitle: string;
  color: string;
};

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const EVENT_CONFIG: Record<
  EventType,
  { color: string; icon: string; label: string }
> = {
  meeting: { color: "#10B981", icon: "people", label: "Réunion" },
  beneficiary: { color: "#D4AF37", icon: "trophy", label: "Bénéficiaire" },
  contribution: { color: "#6366F1", icon: "wallet", label: "Cotisation" },
};

export default function CalendarScreen() {
  const { theme } = useTheme();
  const { groups } = useGroupsStore();
  const { format: fmt } = useCurrency();
  const C = theme.colors;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().substring(0, 10);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [groups])
  );

  const loadEvents = async () => {
    setLoading(true);
    const all: CalendarEvent[] = [];
    for (const g of groups) {
      const meetings: Meeting[] = await MeetingRepository.getByGroup(g.id);
      for (const m of meetings)
        all.push({
          id: m.id,
          date: m.scheduledDate.substring(0, 10),
          type: "meeting",
          title: `Réunion — ${g.name}`,
          subtitle: m.location || "Lieu non défini",
          color: EVENT_CONFIG.meeting.color,
        });

      const bens: Beneficiary[] = await BeneficiaryRepository.getByGroup(g.id);
      for (const b of bens.filter((x) => !x.isPaid))
        all.push({
          id: b.id,
          date: b.scheduledDate.substring(0, 10),
          type: "beneficiary",
          title: `Tour de — ${g.name}`,
          subtitle: fmt(g.contributionAmount * (g.memberCount || 1)),
          color: EVENT_CONFIG.beneficiary.color,
        });

      const contribs: Contribution[] = await ContributionRepository.getByGroup(
        g.id
      );
      for (const c of contribs.filter((x) => x.status !== "paid"))
        all.push({
          id: c.id,
          date: c.dueDate.substring(0, 10),
          type: "contribution",
          title: `Cotisation — ${g.name}`,
          subtitle: `${c.periodLabel} · ${fmt(c.expectedAmount)}`,
          color: EVENT_CONFIG.contribution.color,
        });
    }
    setEvents(all);
    setLoading(false);
  };

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const displayedEvents = selectedDate
    ? eventsByDate[selectedDate] ?? []
    : events
        .filter((e) => e.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 20);

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <View style={[s.root, { backgroundColor: C.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0A3D2E" }}>
        {/* Header nav */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setCurrentDate(new Date(year, month - 1, 1))}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.monthTitle}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity
            style={s.navBtn}
            onPress={() => setCurrentDate(new Date(year, month + 1, 1))}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={s.dayHeaders}>
          {DAYS.map((d, i) => (
            <Text
              key={i}
              style={[s.dayHeaderText, i === 0 || i === 6 ? s.weekend : null]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <View key={`e${i}`} style={s.cell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = getDateStr(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const dayEvents = eventsByDate[dateStr] ?? [];
            const colors = [...new Set(dayEvents.map((e) => e.color))];

            return (
              <TouchableOpacity
                key={day}
                style={s.cell}
                onPress={() => setSelectedDate(isSelected ? null : dateStr)}
              >
                <View
                  style={[
                    s.cellInner,
                    isToday && s.todayInner,
                    isSelected && s.selectedInner,
                  ]}
                >
                  <Text
                    style={[
                      s.dayNum,
                      isToday && s.todayNum,
                      isSelected && s.selectedNum,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {dayEvents.length > 0 && !isSelected && (
                  <View style={s.dotsRow}>
                    {colors.slice(0, 3).map((c, ci) => (
                      <View key={ci} style={[s.dot, { backgroundColor: c }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={s.legend}>
          {(
            Object.entries(EVENT_CONFIG) as [
              EventType,
              (typeof EVENT_CONFIG)[EventType]
            ][]
          ).map(([type, cfg]) => (
            <View key={type} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={s.legendText}>{cfg.label}</Text>
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* Events list */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.listTitle, { color: C.text }]}>
          {selectedDate
            ? `${new Date(selectedDate + "T12:00:00").toLocaleDateString(
                "fr-FR",
                { weekday: "long", day: "numeric", month: "long" }
              )}`
            : "Prochains événements"}
        </Text>

        {displayedEvents.length === 0 ? (
          <View style={[s.emptyBox, { backgroundColor: C.surface }]}>
            <Ionicons
              name="calendar-outline"
              size={36}
              color={C.textSecondary}
            />
            <Text style={[s.emptyText, { color: C.textSecondary }]}>
              {selectedDate
                ? "Aucun événement ce jour"
                : "Aucun événement à venir"}
            </Text>
          </View>
        ) : (
          displayedEvents.map((ev) => {
            const cfg = EVENT_CONFIG[ev.type];
            return (
              <View
                key={ev.id}
                style={[s.eventCard, { backgroundColor: C.surface }]}
              >
                <View
                  style={[s.eventIcon, { backgroundColor: cfg.color + "18" }]}
                >
                  <Ionicons
                    name={cfg.icon as any}
                    size={20}
                    color={cfg.color}
                  />
                </View>
                <View style={s.eventBody}>
                  <Text style={[s.eventTitle, { color: C.text }]}>
                    {ev.title}
                  </Text>
                  <Text style={[s.eventSub, { color: C.textSecondary }]}>
                    {ev.subtitle}
                  </Text>
                </View>
                <View
                  style={[s.eventBadge, { backgroundColor: cfg.color + "18" }]}
                >
                  <Text style={[s.eventBadgeText, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
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
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  dayHeaders: { flexDirection: "row", paddingHorizontal: 8, paddingBottom: 8 },
  dayHeaderText: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  weekend: { color: "rgba(255,255,255,0.35)" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  cell: { width: `${100 / 7}%`, alignItems: "center", paddingVertical: 3 },
  cellInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  todayInner: { backgroundColor: "rgba(255,255,255,0.2)" },
  selectedInner: { backgroundColor: "#D4AF37" },
  dayNum: { color: "#ffffffCC", fontSize: 14 },
  todayNum: { color: "#fff", fontWeight: "700" },
  selectedNum: { color: "#0A3D2E", fontWeight: "800" },
  dotsRow: { flexDirection: "row", gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  emptyBox: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14 },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  eventBody: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  eventSub: { fontSize: 12 },
  eventBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  eventBadgeText: { fontSize: 11, fontWeight: "700" },
});
