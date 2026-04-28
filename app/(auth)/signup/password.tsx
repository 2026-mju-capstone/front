import SignupHeader from "@/components/SignupHeader";
import { fonts } from "@/constants/typography";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AlertCircle, Check, Eye, EyeOff, Lock, X } from "lucide-react-native";
import { useState } from "react";
import {
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

export default function PasswordStep() {
  const { data, updateData } = useSignup();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordConditions = [
    { label: "8자 이상", met: data.password.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(data.password) },
    { label: "숫자 포함", met: /[0-9]/.test(data.password) },
  ];

  const allConditionsMet = passwordConditions.every((c) => c.met);
  const isValid = allConditionsMet && data.password === data.confirmPassword;

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!data.password) e.password = "비밀번호를 입력해주세요.";
    else if (!allConditionsMet) e.password = "비밀번호 조건을 확인해주세요.";
    if (!data.confirmPassword)
      e.confirmPassword = "비밀번호를 다시 입력해주세요.";
    else if (data.password !== data.confirmPassword)
      e.confirmPassword = "비밀번호가 일치하지 않습니다.";
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    router.push("/(auth)/signup/profile");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SignupHeader stepIndex={2} />
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
          <View style={styles.titleArea}>
            <Text style={styles.title}>비밀번호를{"\n"}설정해주세요</Text>
            <Text style={styles.subtitle}>
              로그인에 사용할 비밀번호를 입력해주세요
            </Text>
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>비밀번호</Text>
            <View
              style={[
                styles.inputBox,
                errors.password ? styles.inputError : null,
              ]}
            >
              <Lock size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="8자 이상 입력"
                placeholderTextColor="#ccc"
                value={data.password}
                secureTextEntry={!showPassword}
                textContentType="oneTimeCode"
                autoComplete="off"
                onChangeText={(v) => {
                  updateData({ password: v });
                  setErrors((p) => ({ ...p, password: "" }));
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                {showPassword ? (
                  <EyeOff size={18} color="#aaa" />
                ) : (
                  <Eye size={18} color="#aaa" />
                )}
              </TouchableOpacity>
              {data.password.length > 0 && (
                <TouchableOpacity
                  onPress={() => updateData({ password: "" })}
                  style={{ marginLeft: 8 }}
                >
                  <X size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>

            {data.password.length > 0 && (
              <View style={styles.passwordConditions}>
                {passwordConditions.map((condition) => (
                  <View key={condition.label} style={styles.conditionItem}>
                    <Check
                      size={13}
                      color={condition.met ? "#4F6EF7" : "#ccc"}
                    />
                    <Text
                      style={[
                        styles.conditionText,
                        condition.met && styles.conditionMet,
                      ]}
                    >
                      {condition.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {errors.password ? (
              <View style={styles.errorBox}>
                <AlertCircle size={13} color="#f87171" />
                <Text style={styles.errorText}>{errors.password}</Text>
              </View>
            ) : null}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <View
              style={[
                styles.inputBox,
                errors.confirmPassword ? styles.inputError : null,
              ]}
            >
              <Lock size={18} color="#aaa" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 다시 입력"
                placeholderTextColor="#ccc"
                value={data.confirmPassword}
                secureTextEntry={!showConfirm}
                textContentType="oneTimeCode"
                autoComplete="off"
                onChangeText={(v) => {
                  updateData({ confirmPassword: v });
                  setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
              />
              <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                {showConfirm ? (
                  <EyeOff size={18} color="#aaa" />
                ) : (
                  <Eye size={18} color="#aaa" />
                )}
              </TouchableOpacity>
              {data.confirmPassword.length > 0 && (
                <TouchableOpacity
                  onPress={() => updateData({ confirmPassword: "" })}
                  style={{ marginLeft: 8 }}
                >
                  <X size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
            {errors.confirmPassword ? (
              <View style={styles.errorBox}>
                <AlertCircle size={13} color="#f87171" />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            {isValid ? (
              <LinearGradient
                colors={["#4F6EF7", "#6C8BFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>다음</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.button, styles.buttonInactive]}>
                <Text style={[styles.buttonText, styles.buttonTextInactive]}>
                  다음
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 28, paddingTop: 20 },
  titleArea: { marginBottom: 28 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, color: "#aaa", fontFamily: fonts.regular },
  inputWrapper: { marginBottom: 16 },
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
  input: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    letterSpacing: 0,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  passwordConditions: { flexDirection: "row", gap: 12, marginTop: 8 },
  conditionItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  conditionText: { fontSize: 12, color: "#ccc", fontFamily: fonts.regular },
  conditionMet: { color: "#4F6EF7" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: { fontSize: 13, color: "#f87171", fontFamily: fonts.regular },
  buttonWrapper: { borderRadius: 14, overflow: "hidden", marginTop: 8 },
  button: { height: 54, alignItems: "center", justifyContent: "center" },
  buttonInactive: { backgroundColor: "#e5e5e5" },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  buttonTextInactive: { color: "#aaa" },
});
