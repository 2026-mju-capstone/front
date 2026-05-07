import { fonts } from "@/constants/typography";
import { LinearGradient } from "expo-linear-gradient";
import { Search } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

/**
 * LoadingScreen은 이제 순수하게 시각적인 로딩 상태만 표시합니다.
 * 실제 내비게이션 결정은 app/_layout.tsx의 가드 로직에서 수행됩니다.
 */
export default function LoadingScreen() {
    return (
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