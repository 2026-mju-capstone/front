import { fonts } from "@/constants/typography";
import { validateAccessToken } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LoadingScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        await validateAccessToken();
        const token = await AsyncStorage.getItem("token");
        if (token) {
          router.replace("/(tabs)/map");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (e) {
        router.replace("/(auth)/login");
      }
    };
    checkToken();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4F6EF7", "#6C8BFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoBox}
      >
        <Search size={36} color="#fff" />
      </LinearGradient>
      <Text style={styles.appName}>줍줍</Text>
      <Text style={styles.subName}>Campus Lost & Found</Text>
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
