import SignupHeader from "@/components/SignupHeader";
import { fonts } from "@/constants/typography";
import { useSendCertification, useVerifyCode } from "@/hooks/mutations/useAuthMutations";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AlertCircle, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup } from "./_layout";

export default function VerifyStep() {
  const { data, updateData } = useSignup();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [codeError, setCodeError] = useState("");
  const [timer, setTimer] = useState(180);
  const [codeSent, setCodeSent] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendCertificationMutation = useSendCertification();
  const verifyCodeMutation = useVerifyCode();

  const isSending = sendCertificationMutation.isPending;
  const isVerifying = verifyCodeMutation.isPending;

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    setTimer(180);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleResend = () => {
    sendCertificationMutation.mutate(
      { email: data.email },
      {
        onSuccess: (result) => {
          if (result.success) {
            startTimer();
          } else {
            setCodeError(result.error || "재발송에 실패했습니다.");
          }
        },
        onError: () => {
          setCodeError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  const handleVerify = () => {
    setCodeError("");
    if (!data.verifyCode || data.verifyCode.length !== 6) {
      setCodeError("6자리 인증 코드를 입력해주세요.");
      return;
    }
    
    verifyCodeMutation.mutate(
      {
        email: data.email,
        certificationNumber: data.verifyCode,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            router.push("/(auth)/signup/password");
          } else {
            setCodeError(result.error || "인증 코드가 올바르지 않습니다.");
          }
        },
        onError: () => {
          setCodeError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  const isCodeValid = data.verifyCode.length === 6;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SignupHeader stepIndex={1} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.inner,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={verifyStyles.titleArea}>
            <Text style={styles.title}>인증 코드를{"\n"}입력해주세요</Text>
            <Text style={styles.subtitle}>
              아래 이메일로 인증 코드를 발송했어요
            </Text>
            <Text style={styles.emailText}>{data.email}</Text>
          </View>

          <View style={verifyStyles.formArea}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>인증 코드 (6자리)</Text>
              <View
                style={[styles.inputBox, codeError ? styles.inputError : null]}
              >
                <ShieldCheck size={18} color="#aaa" style={styles.inputIcon} />
                <TextInput
                  style={styles.codeInput}
                  placeholder="123456"
                  placeholderTextColor="#ccc"
                  maxLength={6}
                  value={data.verifyCode}
                  onChangeText={(v) => {
                    updateData({ verifyCode: v.replace(/\D/g, "") });
                    setCodeError("");
                  }}
                  keyboardType="number-pad"
                />
                {timer > 0 && (
                  <Text style={styles.timer}>{formatTimer(timer)}</Text>
                )}
                {timer === 0 && codeSent && (
                  <Text style={styles.expiredText}>만료됨</Text>
                )}
              </View>
              {codeError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={13} color="#f87171" />
                  <Text style={styles.errorText}>{codeError}</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={handleResend}
              disabled={isSending || timer > 0}
              style={styles.resendButton}
            >
              <Text
                style={[
                  styles.resendText,
                  (isSending || timer > 0) && styles.disabledText,
                ]}
              >
                {isSending ? "발송 중..." : "인증 코드 재발송"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={isVerifying || !isCodeValid}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            {isCodeValid ? (
              <LinearGradient
                colors={["#6366f1", "#818cf8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isVerifying && styles.disabledButton]}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>인증 확인</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.button, styles.buttonInactive]}>
                <Text style={[styles.buttonText, styles.buttonTextInactive]}>
                  인증 확인
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const verifyStyles = StyleSheet.create({
  titleArea: { marginBottom: 28 },
  formArea: { marginBottom: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 28, paddingTop: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: "#aaa", fontFamily: fonts.regular },
  emailText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4F6EF7",
    marginTop: 4,
    fontFamily: fonts.bold,
  },
  inputWrapper: { marginBottom: 12 },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontFamily: fonts.medium,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#f5f6f8",
  },
  inputError: {
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#f87171",
  },
  inputIcon: { marginRight: 10 },
  codeInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
    letterSpacing: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: { fontSize: 13, color: "#f87171", fontFamily: fonts.regular },
  timer: { fontSize: 13, fontWeight: "600", color: "#f97316" },
  expiredText: { fontSize: 13, color: "#f87171" },
  resendButton: { alignItems: "flex-end", marginBottom: 12 },
  resendText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4F6EF7",
    fontFamily: fonts.medium,
  },
  disabledText: { color: "#ccc" },
  buttonWrapper: { borderRadius: 14, overflow: "hidden" },
  button: { height: 54, alignItems: "center", justifyContent: "center" },
  buttonInactive: { backgroundColor: "#e5e5e5" },
  disabledButton: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  buttonTextInactive: { color: "#aaa" },
});
