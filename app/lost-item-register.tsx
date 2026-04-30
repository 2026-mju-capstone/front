import { fonts } from "@/constants/typography";
import { ITEMS_URL } from "@/constants/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, Clock, MapPin, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BUILDINGS = [
  "제1공학관",
  "제2공학관",
  "제3공학관",
  "명진당",
  "혜화관",
  "원흥관",
  "학생회관",
  "도서관",
  "기숙사",
];

const CATEGORIES: { label: string; value: string }[] = [
  { label: "도서", value: "BOOK" },
  { label: "전자기기", value: "ELECTRONICS" },
  { label: "의류", value: "CLOTHING" },
  { label: "지갑", value: "WALLET" },
  { label: "신분증", value: "ID_CARD" },
  { label: "기타", value: "OTHER" },
];

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}. ${padTwo(d.getMonth() + 1)}. ${padTwo(d.getDate())}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${padTwo(hh)}:${padTwo(m)}`;
}

export default function LostItemRegister() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<"FOUND" | "LOST">("FOUND");
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [building, setBuilding] = useState("");
  const [detail, setDetail] = useState("");
  const [reportedAt, setReportedAt] = useState(new Date());

  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const [tempYear, setTempYear] = useState(String(reportedAt.getFullYear()));
  const [tempMonth, setTempMonth] = useState(String(reportedAt.getMonth() + 1));
  const [tempDay, setTempDay] = useState(String(reportedAt.getDate()));
  const [tempHour, setTempHour] = useState(String(reportedAt.getHours()));
  const [tempMin, setTempMin] = useState(String(reportedAt.getMinutes()));

  const locationLabel = type === "FOUND" ? "발견 장소" : "분실 장소";
  const timeLabel = type === "FOUND" ? "발견 시각" : "분실 시각";

  const handleSubmit = async () => {
    if (!category) return Alert.alert("카테고리를 선택해주세요");
    if (!title.trim()) return Alert.alert("물품명을 입력해주세요");
    if (!building) return Alert.alert("장소를 선택해주세요");

    try {
      const token = await AsyncStorage.getItem("token");
      const locationName = detail.trim()
        ? `${building} · ${detail.trim()}`
        : building;

      const body = {
        type,
        category,
        title: title.trim(),
        location_name: locationName,
        reported_at: reportedAt.toISOString(),
        //image_url: "",
        // description 필드는 API 생기면 추가
      };

      const res = await fetch(ITEMS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        Alert.alert("등록 완료!", "분실물이 등록되었어요.", [
          { text: "확인", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("등록 실패", result.message ?? "다시 시도해주세요.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "네트워크 오류가 발생했어요.");
    }
  };

  const applyDate = () => {
    const y = parseInt(tempYear) || reportedAt.getFullYear();
    const mo = parseInt(tempMonth) || reportedAt.getMonth() + 1;
    const d = parseInt(tempDay) || reportedAt.getDate();
    const next = new Date(reportedAt);
    next.setFullYear(y);
    next.setMonth(mo - 1);
    next.setDate(d);
    setReportedAt(next);
    setShowDateModal(false);
  };

  const applyTime = () => {
    const h = parseInt(tempHour) ?? reportedAt.getHours();
    const m = parseInt(tempMin) ?? reportedAt.getMinutes();
    const next = new Date(reportedAt);
    next.setHours(Math.min(h, 23));
    next.setMinutes(Math.min(m, 59));
    setReportedAt(next);
    setShowTimeModal(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={20} color="#555" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>분실물 등록</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.tabRow}>
            {(["FOUND", "LOST"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, type === t && styles.tabActive]}
                onPress={() => setType(t)}
              >
                <Text
                  style={[styles.tabText, type === t && styles.tabTextActive]}
                >
                  {t === "FOUND" ? "주웠어요" : "잃어버렸어요"}
                </Text>
                <Text
                  style={[styles.tabSub, type === t && styles.tabSubActive]}
                >
                  {t === "FOUND" ? "습득 신고" : "분실 신고"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 사진은 선택사항 */}
          <Section label="사진" required={false}>
            <View style={styles.photoRow}>
              {photos.map((_, i) => (
                <View key={i} style={styles.photoBox}>
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() =>
                      setPhotos((p) => p.filter((_, j) => j !== i))
                    }
                  >
                    <X size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity
                  style={styles.photoAdd}
                  onPress={() => setPhotos((p) => [...p, "placeholder"])}
                >
                  <Camera size={22} color="#bbb" />
                  <Text style={styles.photoCount}>{photos.length}/3</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.photoHint}>
              최대 3장 · 상태가 잘 보이게 찍어주세요
            </Text>
          </Section>

          <Section label="카테고리">
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryItem,
                    category === cat.value && styles.categoryItemActive,
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.value && styles.categoryLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          <Section label="물품명">
            <TextInput
              style={styles.input}
              placeholder="예: 검정색 장우산"
              placeholderTextColor="#bbb"
              value={title}
              onChangeText={setTitle}
              maxLength={40}
            />
          </Section>

          <Section label={locationLabel}>
            <TouchableOpacity
              style={styles.selectRow}
              onPress={() => setShowBuildingModal(true)}
            >
              <MapPin size={14} color="#bbb" />
              <Text
                style={[styles.selectText, building && styles.selectTextFilled]}
              >
                {building || "건물을 선택해주세요"}
              </Text>
              <ChevronRight size={14} color="#bbb" />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="세부 위치 (예: 3층 강의실 입구)"
              placeholderTextColor="#bbb"
              value={detail}
              onChangeText={setDetail}
              maxLength={50}
            />
          </Section>

          <Section label={timeLabel}>
            <View style={styles.datetimeRow}>
              <TouchableOpacity
                style={[styles.datetimeBtn, { flex: 1.4 }]}
                onPress={() => {
                  setTempYear(String(reportedAt.getFullYear()));
                  setTempMonth(String(reportedAt.getMonth() + 1));
                  setTempDay(String(reportedAt.getDate()));
                  setShowDateModal(true);
                }}
              >
                <Text style={styles.datetimeText}>
                  {formatDate(reportedAt)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datetimeBtn, { flex: 1 }]}
                onPress={() => {
                  setTempHour(String(reportedAt.getHours()));
                  setTempMin(String(reportedAt.getMinutes()));
                  setShowTimeModal(true);
                }}
              >
                <Clock size={13} color="#aaa" />
                <Text style={styles.datetimeText}>
                  {formatTime(reportedAt)}
                </Text>
              </TouchableOpacity>
            </View>
          </Section>

          {/* 상세설명 - 선택사항, description API 생기면 body에 추가 */}
          <Section label="상세설명" required={false}>
            <TextInput
              style={styles.descInput}
              placeholder={"색상, 브랜드, 특징 등\n자세한 설명을 적어주세요"}
              placeholderTextColor="#bbb"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.descCount}>{description.length}/300</Text>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.submitWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>등록하기</Text>
        </TouchableOpacity>
      </View>

      {/* 건물 선택 바텀시트 */}
      <Modal visible={showBuildingModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBuildingModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>건물 선택</Text>
          {BUILDINGS.map((b) => (
            <TouchableOpacity
              key={b}
              style={[
                styles.sheetItem,
                building === b && styles.sheetItemActive,
              ]}
              onPress={() => {
                setBuilding(b);
                setShowBuildingModal(false);
              }}
            >
              <Text
                style={[
                  styles.sheetItemText,
                  building === b && styles.sheetItemTextActive,
                ]}
              >
                {b}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* 날짜 입력 바텀시트 */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDateModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>날짜 입력</Text>
          <View style={styles.dateInputRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>년</Text>
              <TextInput
                style={styles.dateInput}
                value={tempYear}
                onChangeText={setTempYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>월</Text>
              <TextInput
                style={styles.dateInput}
                value={tempMonth}
                onChangeText={setTempMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>일</Text>
              <TextInput
                style={styles.dateInput}
                value={tempDay}
                onChangeText={setTempDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.sheetConfirmBtn} onPress={applyDate}>
            <Text style={styles.sheetConfirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 시간 입력 바텀시트 */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimeModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>시간 입력</Text>
          <View style={styles.dateInputRow}>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>시 (0-23)</Text>
              <TextInput
                style={styles.dateInput}
                value={tempHour}
                onChangeText={setTempHour}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateFieldLabel}>분</Text>
              <TextInput
                style={styles.dateInput}
                value={tempMin}
                onChangeText={setTempMin}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <TouchableOpacity style={styles.sheetConfirmBtn} onPress={applyTime}>
            <Text style={styles.sheetConfirmText}>확인</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Section({
  label,
  children,
  required = true,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        {label}
        {required && <Text style={{ color: "#f87171" }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6f9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f5f6f9",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },

  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 13 },
  tabActive: { backgroundColor: "#6366f1" },
  tabText: { fontSize: 14, fontFamily: fonts.bold, color: "#aaa" },
  tabTextActive: { color: "#fff" },
  tabSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: "#ccc",
    marginTop: 2,
  },
  tabSubActive: { color: "#c7d0ff" },

  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: "#333",
    marginBottom: 12,
  },

  photoRow: { flexDirection: "row", gap: 10 },
  photoAdd: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#fafafa",
  },
  photoBox: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#00000066",
    borderRadius: 10,
    padding: 3,
  },
  photoCount: { fontSize: 10, color: "#bbb", fontFamily: fonts.regular },
  photoHint: {
    fontSize: 11,
    color: "#bbb",
    fontFamily: fonts.regular,
    marginTop: 8,
  },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryItem: {
    width: "30%",
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  categoryItemActive: { borderColor: "#6366f1", backgroundColor: "#eef2ff " },
  categoryLabel: { fontSize: 13, fontFamily: fonts.bold, color: "#aaa" },
  categoryLabelActive: { color: "#6366f1" },

  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#111",
    backgroundColor: "#fafafa",
  },

  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    gap: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#bbb",
  },
  selectTextFilled: { color: "#111" },

  datetimeRow: { flexDirection: "row", gap: 8 },
  datetimeBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
    gap: 6,
  },
  datetimeText: { fontSize: 13, fontFamily: fonts.regular, color: "#333" },

  descInput: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#111",
    backgroundColor: "#fafafa",
    height: 130,
  },
  descCount: {
    fontSize: 11,
    color: "#ccc",
    fontFamily: fonts.regular,
    textAlign: "right",
    marginTop: 6,
  },

  submitWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#f5f6f9",
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitText: { fontSize: 15, fontFamily: fonts.bold, color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "#00000033" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 12,
  },

  sheetItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sheetItemActive: {
    backgroundColor: "#eef2ff",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sheetItemText: { fontSize: 14, fontFamily: fonts.regular, color: "#444" },
  sheetItemTextActive: { color: "#6366f1", fontFamily: fonts.bold },

  dateInputRow: { flexDirection: "row", gap: 12, marginVertical: 16 },
  dateField: { flex: 1, alignItems: "center", gap: 6 },
  dateFieldLabel: { fontSize: 12, fontFamily: fonts.regular, color: "#aaa" },
  dateInput: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#111",
  },
  sheetConfirmBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 4,
  },
  sheetConfirmText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
});
