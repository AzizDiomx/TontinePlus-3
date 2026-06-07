import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
import { Colors, Elevation } from "../../src/constants/theme";

type TabDef = {
  name: string;
  icon: string;
  iconFocused: string;
  label: string;
};

const TABS: TabDef[] = [
  {
    name: "index",
    icon: "home-outline",
    iconFocused: "home",
    label: "Accueil",
  },
  {
    name: "groups",
    icon: "people-outline",
    iconFocused: "people",
    label: "Groupes",
  },
  {
    name: "calendar",
    icon: "calendar-outline",
    iconFocused: "calendar",
    label: "Agenda",
  },
  {
    name: "reports",
    icon: "bar-chart-outline",
    iconFocused: "bar-chart",
    label: "Rapports",
  },
  {
    name: "settings",
    icon: "settings-outline",
    iconFocused: "settings",
    label: "Paramètres",
  },
];

export default function TabsLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const { theme, isDark } = useTheme();
  const C = theme.colors;

  const bg = isDark ? "#111a17" : "#ffffff";
  const pill = isDark ? C.primary + "25" : C.primary + "18";

  return (
    <View style={[s.bar, { backgroundColor: bg, borderTopColor: C.border }]}>
      <SafeAreaView edges={["bottom"]} style={s.inner}>
        {state.routes.map((route: any, index: number) => {
          const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
          const focused = state.index === index;

          return (
            <TouchableOpacity
              key={route.key}
              style={s.item}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name);
              }}
              activeOpacity={0.7}
            >
              {focused && <View style={[s.pill, { backgroundColor: pill }]} />}
              <Ionicons
                name={(focused ? tab.iconFocused : tab.icon) as any}
                size={23}
                color={focused ? C.primary : C.textSecondary}
              />
              <Text
                style={[
                  s.label,
                  {
                    color: focused ? C.primary : C.textSecondary,
                    fontWeight: focused ? "700" : "400",
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  inner: { flexDirection: "row", paddingTop: 8 },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 6,
    paddingTop: 4,
    position: "relative",
    gap: 3,
  },
  pill: {
    position: "absolute",
    top: 0,
    left: "10%",
    right: "10%",
    bottom: 0,
    borderRadius: 12,
  },
  label: { fontSize: 10, letterSpacing: 0.1 },
});
