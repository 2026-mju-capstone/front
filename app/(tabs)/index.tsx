import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function TabsIndex() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>지도</Text>
      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginTop: 20, padding: 12, backgroundColor: "#f87171", borderRadius: 10 }}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>임시 로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}