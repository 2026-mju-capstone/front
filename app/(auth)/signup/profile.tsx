import SignupHeader from "@/components/SignupHeader";
import { fonts } from "@/constants/typography";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignup } from "./_layout";

const BASE_URL = "http://52.63.7.132:8080";

const DEPARTMENTS = [
  "화학전공", "에너지공학전공", "식품영양학전공", "생명과학정보학전공",
  "기계공학전공", "산업경영공학전공", "토목환경공학전공", "교통시스템공학전공",
  "환경시스템공학전공", "화학공학전공", "신소재공학전공",
  "반도체공학", "전기공학전공", "전자공학전공", "컴퓨터공학전공", "정보통신공학전공",
  "체육학전공", "스포츠산업학전공", "뮤지컬공연전공", "연극·영화전공", "아트앤멀티미디어음악",
  "건축학전공", "전통건축전공", "산업디자인전공", "영상애니메이션디자인전공",
].sort();

export default function ProfilePage() {
  const { data, updateData } = useSignup();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDepartments = DEPARTMENTS.filter((dept) =>
    dept.includes(searchQuery)
  );

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["95%"], []);

  const openDeptSheet = () => {
    Keyboard.dismiss();
    setSearchQuery("");
    bottomSheetRef.current?.present();
  };

  const closeDeptSheet = () => {
    bottomSheetRef.current?.dismiss();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

  const passwordConditions = [
    { label: "8자 이상", met: data.password.length >= 8 },
    { label: "영문 포함", met: /[a-zA-Z]/.test(data.password) },
    { label: "숫자 포함", met: /[0-9]/.test(data.password) },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.nickname.trim()) e.nickname = "닉네임을 입력해주세요.";
    if (!data.department) e.department = "학과를 선택해주세요.";
    if (!data.password) e.password = "비밀번호를 입력해주세요.";
    else if (data.password.length < 8) e.password = "비밀번호는 8자 이상이어야 합니다.";
    if (!data.confirmPassword) e.confirmPassword = "비밀번호를 다시 입력해주세요.";
    else if (data.password !== data.confirmPassword) e.confirmPassword = "비밀번호가 일치하지 않습니다.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolEmail: data.email,
          password: data.password,
          nickname: data.nickname,
        }),
      });
      const result = await response.json();
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setErrors({ nickname: result.error || "회원가입에 실패했습니다." });
      }
    } catch (e) {
      setErrors({ nickname: "서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SignupHeader stepIndex={2} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Text style={styles.title}>프로필 설정</Text>
          <Text style={styles.subtitle}>서비스에서 사용할 정보를 입력해주세요.</Text>

          {/* 닉네임 */}
          <Text style={styles.label}>닉네임</Text>
          <View style={[styles.inputBox, errors.nickname ? styles.inputError : null]}>
            <Ionicons name="person-outline" size={18} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력해주세요"
              placeholderTextColor="#ccc"
              value={data.nickname}
              onChangeText={(v) => { updateData({ nickname: v }); setErrors((p) => ({ ...p, nickname: "" })); }}
              autoCorrect={false}
              spellCheck={false}
            />
            {data.nickname.length > 0 && (
              <TouchableOpacity onPress={() => updateData({ nickname: "" })}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          {errors.nickname ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.nickname}</Text>
            </View>
          ) : null}

          {/* 학과 */}
          <Text style={styles.label}>학과</Text>
          <TouchableOpacity
            style={[styles.inputBox, errors.department ? styles.inputError : null]}
            onPress={openDeptSheet}
          >
            <Ionicons name="business-outline" size={18} color="#aaa" style={styles.inputIcon} />
            <Text style={[styles.input, !data.department && { color: "#ccc" }, { textAlignVertical: "center", lineHeight: 50 }]}>
              {data.department || "학과를 선택하세요"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#aaa" />
          </TouchableOpacity>
          {errors.department ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.department}</Text>
            </View>
          ) : null}

          {/* 비밀번호 */}
          <Text style={styles.label}>비밀번호</Text>
          <View style={[styles.inputBox, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="8자 이상 입력"
              placeholderTextColor="#ccc"
              value={data.password}
              secureTextEntry={!showPassword}
              onChangeText={(v) => { updateData({ password: v }); setErrors((p) => ({ ...p, password: "" })); }}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#aaa" />
            </TouchableOpacity>
            {data.password.length > 0 && (
              <TouchableOpacity onPress={() => updateData({ password: "" })} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          {/* 비밀번호 조건 실시간 표시 */}
          {data.password.length > 0 && (
            <View style={styles.passwordConditions}>
              {passwordConditions.map((condition) => (
                <View key={condition.label} style={styles.conditionItem}>
                  <Ionicons
                    name={condition.met ? "checkmark-circle" : "ellipse-outline"}
                    size={14}
                    color={condition.met ? "#4F6EF7" : "#ccc"}
                  />
                  <Text style={[styles.conditionText, condition.met && styles.conditionMet]}>
                    {condition.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {errors.password ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.password}</Text>
            </View>
          ) : null}

          {/* 비밀번호 확인 */}
          <Text style={styles.label}>비밀번호 확인</Text>
          <View style={[styles.inputBox, errors.confirmPassword ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color="#aaa" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력"
              placeholderTextColor="#ccc"
              value={data.confirmPassword}
              secureTextEntry={!showConfirm}
              onChangeText={(v) => { updateData({ confirmPassword: v }); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
            />
            <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
              <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={18} color="#aaa" />
            </TouchableOpacity>
            {data.confirmPassword.length > 0 && (
              <TouchableOpacity onPress={() => updateData({ confirmPassword: "" })} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
          {errors.confirmPassword ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={13} color="#f87171" />
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            </View>
          ) : null}

          {/* 완료 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.buttonWrapper, { marginTop: 16 }]}
          >
            <LinearGradient
              colors={["#4F6EF7", "#6C8BFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, isLoading && styles.disabledButton]}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>회원가입 완료</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 학과 선택 바텀시트 */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.bottomSheetHandle}
        enableOverDrag={false}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
      >
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.bottomSheetTitle}>학과 선택</Text>
          <TouchableOpacity onPress={closeDeptSheet}>
            <Ionicons name="close" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 검색창 */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="학과 검색"
            placeholderTextColor="#ccc"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        <BottomSheetFlatList
          data={filteredDepartments}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.deptItem, data.department === item && styles.deptItemSelected]}
              onPress={() => {
                updateData({ department: item });
                setErrors((p) => ({ ...p, department: "" }));
                closeDeptSheet();
              }}
            >
              <Text style={[styles.deptItemText, data.department === item && styles.deptItemTextSelected]}>
                {item}
              </Text>
              {data.department === item && (
                <Ionicons name="checkmark" size={18} color="#4F6EF7" />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
            </View>
          }
        />
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
    fontFamily: fonts.bold,
    lineHeight: 34,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 15,
    color: "#aaa",
    fontFamily: fonts.regular,
    marginBottom: 24
  },
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
    marginBottom: 8
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
    letterSpacing: 0,
    height: "100%",
    paddingVertical: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#f87171",
    fontFamily: fonts.regular,
  },
  passwordConditions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  conditionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  conditionText: {
    fontSize: 12,
    color: "#ccc",
    fontFamily: fonts.regular,
  },
  conditionMet: {
    color: "#4F6EF7",
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
  disabledButton: {
    opacity: 0.6
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  bottomSheetBg: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandle: {
    backgroundColor: "transparent",
    width: 0,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    fontFamily: fonts.bold,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    fontFamily: fonts.regular,
    letterSpacing: 0,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  deptItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  deptItemSelected: {
    backgroundColor: "#f0f4ff",
  },
  deptItemText: {
    fontSize: 15,
    color: "#333",
    fontFamily: fonts.regular,
  },
  deptItemTextSelected: {
    color: "#4F6EF7",
    fontFamily: fonts.bold,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#aaa",
    fontFamily: fonts.regular,
  },
});