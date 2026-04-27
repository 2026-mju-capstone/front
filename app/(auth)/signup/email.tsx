import SignupHeader from "@/components/SignupHeader";
import { fonts } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup } from "./_layout";
import { CERTIFICATION_URL } from "@/constants/url";

export default function EmailStep() {
  const { data, updateData } = useSignup();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [emailError, setEmailError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isEmailValid = data.email.endsWith(".ac.kr") || data.email.endsWith(".edu");

  const handleSendCode = async () => {
    setEmailError("");
    if (!data.email) { setEmailError("이메일을 입력해주세요."); return; }
    if (!isEmailValid) { setEmailError("학교 이메일 형식이 아닙니다."); return; }

    setIsSending(true);
    try {
      const response = await fetch(CERTIFICATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/(auth)/signup/verify");
      } else {
        setEmailError(result.error || "인증 코드 발송에 실패했습니다.");
      }
    } catch (e) {
      setEmailError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SignupHeader stepIndex={0} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.inner, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={emailStyles.titleArea}>
            <Text style={styles.title}>학교 이메일을{"\n"}입력해주세요</Text>
            <Text style={styles.subtitle}>재학 중인 학교의 이메일로만 가입 가능해요</Text>
            <Text style={styles.hintText}>(@*.ac.kr, @*.edu 도메인만 지원)</Text>
          </View>

          <View style={emailStyles.formArea}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>학교 이메일</Text>
              <View style={[styles.inputBox, emailError ? styles.inputError : null]}>
                <Ionicons name="mail-outline" size={18} color="#aaa" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="example@university.ac.kr"
                  placeholderTextColor="#ccc"
                  value={data.email}
                  onChangeText={(v) => { updateData({ email: v }); setEmailError(""); }}
                  onBlur={() => {
                    if (data.email.length > 0 && !isEmailValid) {
                      setEmailError("학교 이메일 형식이 아닙니다.");
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
              {emailError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning-outline" size={13} color="#f87171" />
                  <Text style={styles.errorText}>{emailError}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSendCode}
            disabled={isSending || !isEmailValid}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            {isEmailValid ? (
              <LinearGradient
                colors={["#4F6EF7", "#6C8BFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isSending && styles.disabledButton]}
              >
                {isSending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.buttonText}>인증 코드 발송</Text>
                }
              </LinearGradient>
            ) : (
              <View style={[styles.button, styles.buttonInactive]}>
                <Text style={[styles.buttonText, styles.buttonTextInactive]}>인증 코드 발송</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </View>
  );
}

const emailStyles = StyleSheet.create({
  titleArea: { 
    marginBottom: 24 
  },
  formArea: { 
    marginBottom: 40 
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  inner: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    fontFamily: fonts.regular
  },
  hintText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#aaa",
    marginTop: 4,
    fontFamily: fonts.medium
  },
  inputWrapper: {
    marginBottom: 12
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    fontFamily: fonts.medium
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
    borderColor: "#f87171"
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
    letterSpacing: 0,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6
  },
  errorText: {
    fontSize: 13,
    color: "#f87171",
    fontFamily: fonts.regular
  },
  buttonWrapper: {
    borderRadius: 14,
    overflow: "hidden"
  },
  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonInactive: {
    backgroundColor: "#e5e5e5"
  },
  disabledButton: {
    opacity: 0.6
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold
  },
  buttonTextInactive: {
    color: "#aaa"
  },
});
