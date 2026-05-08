import {fonts} from "@/constants/typography";
import {LinearGradient} from "expo-linear-gradient";
import {useRouter} from "expo-router";
import {ArrowLeft, Check} from "lucide-react-native";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {useSafeAreaInsets} from "react-native-safe-area-context";

interface Props {
    stepIndex: 0 | 1 | 2 | 3;
}

export default function SignupHeader({stepIndex}: Props) {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={{paddingTop: insets.top, backgroundColor: "#fff"}}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ArrowLeft size={22} color="#333"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>회원가입</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressLineWrapper}>
                    <View style={styles.progressLineBackground}/>
                    <View
                        style={[
                            styles.progressLineFill,
                            {
                                width:
                                    stepIndex === 0
                                        ? "0%"
                                        : stepIndex === 1
                                            ? "33%"
                                            : stepIndex === 2
                                                ? "66%"
                                                : "100%",
                            },
                        ]}
                    />
                </View>

                {["이메일 입력", "인증 확인", "비밀번호", "프로필 설정"].map(
                    (label, i) => {
                        const isCompleted = i < stepIndex;
                        const isActive = i <= stepIndex;
                        return (
                            <View key={i} style={styles.stepItem}>
                                <LinearGradient
                                    colors={isActive ? ["#6366f1", "#818cf8"] : ["#fff", "#fff"]}
                                    style={[
                                        styles.stepCircle,
                                        !isActive && styles.stepCircleInactive,
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Check size={14} color="#fff"/>
                                    ) : (
                                        <Text
                                            style={[
                                                styles.stepNumber,
                                                isActive && styles.stepNumberActive,
                                            ]}
                                        >
                                            {i + 1}
                                        </Text>
                                    )}
                                </LinearGradient>
                                <Text
                                    style={[styles.stepLabel, isActive && styles.stepLabelActive]}
                                >
                                    {label}
                                </Text>
                            </View>
                        );
                    },
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        height: 60,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    headerTitle: {
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        fontFamily: fonts.bold,
    },
    progressContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 10,
        position: "relative",
    },
    progressLineWrapper: {
        position: "absolute",
        top: 34,
        left: 48,
        right: 48,
        height: 2,
        zIndex: 0,
    },
    progressLineBackground: {
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f0f0",
    },
    progressLineFill: {
        position: "absolute",
        height: "100%",
        backgroundColor: "#6366f1",
    },
    stepItem: {alignItems: "center", gap: 6, zIndex: 1, width: 55},
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    stepCircleInactive: {borderWidth: 1.5, borderColor: "#eee"},
    stepNumber: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#aaa",
        fontFamily: fonts.bold,
    },
    stepNumberActive: {color: "#fff"},
    stepLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: "#aaa",
        fontFamily: fonts.medium,
        marginTop: 2,
    },
    stepLabelActive: {color: "#6366f1"},
});
