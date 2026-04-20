import { Tabs } from "expo-router";
import {
  CalendarDays,
  ClipboardList,
  Map,
  MessageCircle,
  QrCode,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F6EF7",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          backgroundColor: "#fff",
          height: 95,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Pretendard-Medium",
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "지도",
          tabBarIcon: ({ color }) => <Map size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lost-item"
        options={{
          title: "게시판",
          tabBarIcon: ({ color }) => <ClipboardList size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "스캔",
          tabBarIcon: ({ color }) => <QrCode size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: "시간표",
          tabBarIcon: ({ color }) => <CalendarDays size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "채팅",
          tabBarIcon: ({ color }) => <MessageCircle size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
