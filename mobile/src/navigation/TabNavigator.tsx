import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme, font } from "@/theme";
import { useAuth } from "@/stores/auth";
import { Icon, type IconName } from "@/components/Icon";

import StudentHomeTab from "@/screens/tabs/StudentHomeTab";
import LecturerHomeTab from "@/screens/tabs/LecturerHomeTab";
import CoursesTab from "@/screens/tabs/CoursesTab";
import LibraryTab from "@/screens/tabs/LibraryTab";
import SearchTab from "@/screens/tabs/SearchTab";
import ProfileTab from "@/screens/tabs/ProfileTab";
import DraftsTab from "@/screens/tabs/DraftsTab";
import AdminOverviewTab from "@/screens/tabs/AdminOverviewTab";
import AdminUsersTab from "@/screens/tabs/AdminUsersTab";
import AdminStructureTab from "@/screens/tabs/AdminStructureTab";

const Tab = createBottomTabNavigator();

// Design tab glyphs come from the shared line-icon set; active = ink, inactive = #AEB4BE.
const tabIcon = (name: IconName) => ({ color, focused }: { color: string; focused: boolean }) =>
  <Icon name={name} size={23} color={color} width={focused ? 2.1 : 1.8} />;

/** Module 8: tabs differ per role (matching the design's three tab bars). */
export default function TabNavigator() {
  const { palette } = useTheme();
  const role = useAuth((s) => s.user?.global_role);

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: palette.text,
    tabBarInactiveTintColor: palette.tabInactive,
    tabBarLabelStyle: { fontSize: 11, ...font(700) },
    tabBarStyle: {
      backgroundColor: palette.card,
      borderTopColor: palette.fieldBorder,
      height: 76,
      paddingTop: 10,
      paddingBottom: 22,
    },
  } as const;

  if (role === "admin") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Overview" component={AdminOverviewTab} options={{ tabBarIcon: tabIcon("grid") }} />
        <Tab.Screen name="Users" component={AdminUsersTab} options={{ tabBarIcon: tabIcon("users") }} />
        <Tab.Screen name="Structure" component={AdminStructureTab} options={{ tabBarIcon: tabIcon("building") }} />
        <Tab.Screen name="Profile" component={ProfileTab} options={{ tabBarIcon: tabIcon("gear") }} />
      </Tab.Navigator>
    );
  }

  if (role === "lecturer") {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen name="Home" component={LecturerHomeTab} options={{ tabBarIcon: tabIcon("home") }} />
        <Tab.Screen name="Drafts" component={DraftsTab} options={{ tabBarIcon: tabIcon("edit") }} />
        <Tab.Screen name="Courses" component={CoursesTab} options={{ tabBarIcon: tabIcon("book") }} />
        <Tab.Screen name="Search" component={SearchTab} options={{ tabBarIcon: tabIcon("search") }} />
        <Tab.Screen name="Profile" component={ProfileTab} options={{ tabBarIcon: tabIcon("user") }} />
      </Tab.Navigator>
    );
  }

  // student (default)
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={StudentHomeTab} options={{ tabBarIcon: tabIcon("home") }} />
      <Tab.Screen name="Courses" component={CoursesTab} options={{ tabBarIcon: tabIcon("book") }} />
      <Tab.Screen name="Library" component={LibraryTab} options={{ tabBarIcon: tabIcon("stack") }} />
      <Tab.Screen name="Search" component={SearchTab} options={{ tabBarIcon: tabIcon("search") }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ tabBarIcon: tabIcon("user") }} />
    </Tab.Navigator>
  );
}
