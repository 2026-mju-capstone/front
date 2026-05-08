import { fonts } from "@/constants/typography";
import { useLoadingStore } from "@/store/loadingStore";
import { LinearGradient } from "expo-linear-gradient";
import { Search } from "lucide-react-native";
import { StyleSheet, Text, View, Modal, ActivityIndicator } from "react-native";

/**
 * GlobalLoading은 API 요청 등 전역적인 로딩 상태를 표시하는 오버레이 컴포넌트입니다.
 * useLoadingStore의 isLoading 상태에 따라 화면을 덮습니다.
 */
export default function GlobalLoading() {
    const { isLoading } = useLoadingStore();

    if (!isLoading) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                <LinearGradient
                    colors={["#4F6EF7", "#6C8BFF"]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.logoBox}
                >
                    <Search size={36} color="#fff"/>
                </LinearGradient>
                <Text style={styles.appName}>줍줍</Text>
                <ActivityIndicator size="small" color="#4F6EF7" style={{ marginTop: 20 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        zIndex: 9999,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
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
});