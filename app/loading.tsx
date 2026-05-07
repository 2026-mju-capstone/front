import { authService } from "@/api/services/auth";
import { fonts } from "@/constants/typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    // ✅ 내부에서 async 함수 호출
    const checkToken = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("token");
        if (!savedToken) {
          router.replace("/(auth)/login");
          return;
        }

        const result = await authService.validateToken();
        if (result.success) {
          if (result.data) {
            await AsyncStorage.setItem("token", result.data);
          }
          router.replace("/(tabs)/map");
        } else {
          await AsyncStorage.removeItem("token");
          router.replace("/(auth)/login");
        }
      } catch (e) {
        await AsyncStorage.removeItem("token");
        router.replace("/(auth)/login");
      }
    };
    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#6366f1", "#818cf8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoBox}
      >
        <Search size={36} color="#fff" />
      </LinearGradient>
      <Text style={styles.appName}>줍픽</Text>
      <Text style={styles.subName}>줍고 픽하는 캠퍼스 생활</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
  },
  subName: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 6,
    fontFamily: fonts.regular,
  },
});
