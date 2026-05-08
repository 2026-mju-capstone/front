import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, Plus, Save, User, X, Check } from "lucide-react-native";
import { useEffect, useState, useCallback, useMemo } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTimetables, useTimetableDetail } from "@/hooks/queries/useTimetableQueries";
import { useSyncTimetable, useCreateTimetable } from "@/hooks/mutations/useTimetableMutations";
import { useTimetableStore } from "@/store/timetableStore";
import { Course, DayOfWeek } from "@/api/types";
import CourseSearchModal from "@/components/CourseSearchModal";

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_LABELS = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};
const HOURS = Array.from({ length: 10 }, (_, i) => i + 9);
const CELL_HEIGHT = 64;
const TIME_COL_WIDTH = 32;

const SUBJECT_COLORS = [
  { bg: "#eef2ff", text: "#6366f1" },
  { bg: "#fef9c3", text: "#ca8a04" },
  { bg: "#dcfce7", text: "#16a34a" },
  { bg: "#fce7f3", text: "#db2777" },
  { bg: "#ffedd5", text: "#ea580c" },
  { bg: "#e0f2fe", text: "#0284c7" },
];

function toMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Zustand Store
  const { 
    currentYear, 
    currentSemester, 
    setPeriod,
    activeTimetableId, 
    setActiveTimetable, 
    draftCourses, 
    isEditing, 
    startEditing, 
    stopEditing,
    removeCourse
  } = useTimetableStore();

  // Queries
  const { data: timetables, isLoading: isListLoading } = useTimetables(currentYear, currentSemester);
  const { data: serverCourses, isLoading: isDetailLoading } = useTimetableDetail(activeTimetableId);
  
  // Mutations
  const syncMutation = useSyncTimetable();
  const createMutation = useCreateTimetable();

  // Local UI State
  const [showListModal, setShowListModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTimetableName, setNewTimetableName] = useState("");

  // 학기 변경 시 자동 첫 번째 시간표 선택 혹은 생성 유도
  useEffect(() => {
    if (isListLoading || !Array.isArray(timetables)) return;

    if (timetables.length > 0) {
      // 해당 학기에 시간표가 있는 경우: 현재 선택된 시간표가 유효한지 확인
      const currentValid = timetables.some(t => t.timetableId === activeTimetableId);
      if (!currentValid) {
        const primary = timetables.find(t => t.isPrimary) || timetables[0];
        setActiveTimetable(primary.timetableId);
      }
    } else {
      // 해당 학기에 시간표가 하나도 없는 경우: 선택 해제 및 생성 유도
      if (activeTimetableId !== null) {
        setActiveTimetable(null);
      }
      if (showListModal && !showCreateModal) {
        setShowCreateModal(true);
      }
    }
  }, [timetables, isListLoading, showListModal, activeTimetableId, showCreateModal]);

  // 학기 이름 계산
  const activeTimetableName = useMemo(() => {
    if (!Array.isArray(timetables)) return "시간표";
    const found = timetables.find(t => t.timetableId === activeTimetableId);
    return found ? found.name : `${currentYear}년 ${currentSemester}학기`;
  }, [timetables, activeTimetableId, currentYear, currentSemester]);

  // 시간표 생성 핸들러
  const handleCreateTimetable = () => {
    if (!newTimetableName.trim()) return;
    
    createMutation.mutate({
      name: newTimetableName.trim(),
      year: currentYear,
      semester: currentSemester
    }, {
      onSuccess: (newTimetable) => {
        setActiveTimetable(newTimetable.timetableId);
        setShowCreateModal(false);
        setNewTimetableName("");
        setShowListModal(false);
        Alert.alert("알림", `"${newTimetableName}" 시간표가 생성되었습니다.`);
      },
      onError: (error: any) => {
        Alert.alert("에러", error.response?.data?.error || "생성에 실패했습니다.");
      }
    });
  };

  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedCourse(null), 300);
  }, []);

  const handleToggleEdit = () => {
    if (isEditing) {
      if (!activeTimetableId) return;
      const syncData = {
        courses: draftCourses.map(c => ({
          courseId: c.courseId,
          color: c.color || SUBJECT_COLORS[0].text
        }))
      };
      syncMutation.mutate({ id: activeTimetableId, data: syncData }, {
        onSuccess: () => {
          stopEditing();
          Alert.alert("알림", "시간표가 저장되었습니다.");
        },
        onError: (error: any) => {
          Alert.alert("에러", error.response?.data?.error || "저장에 실패했습니다.");
        }
      });
    } else {
      startEditing(serverCourses || []);
    }
  };

  const handleDeleteFromDraft = useCallback((id: number) => {
    removeCourse(id);
    closeDetailModal();
  }, [removeCourse, closeDetailModal]);

  // --- Sub-components (Render Functions) ---

  const renderPeriodSelector = () => (
    <View style={styles.periodSelectorRow}>
      <View style={styles.periodGroup}>
        {[2024, 2025, 2026].map(y => (
          <TouchableOpacity 
            key={y}
            onPress={() => {
              if (currentYear !== y) setPeriod(y, currentSemester);
            }}
            style={[styles.periodTab, currentYear === y && styles.periodTabActive]}
          >
            <Text style={[styles.periodTabText, currentYear === y && styles.periodTabTextActive]}>
              {y}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.periodGroup, { marginLeft: 8 }]}>
        {[1, 2].map(s => (
          <TouchableOpacity 
            key={s}
            onPress={() => {
              if (currentSemester !== s) setPeriod(currentYear, s);
            }}
            style={[styles.periodTab, currentSemester === s && styles.periodTabActive]}
          >
            <Text style={[styles.periodTabText, currentSemester === s && styles.periodTabTextActive]}>
              {s}학기
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const displayCourses = isEditing ? draftCourses : (serverCourses || []);

  if (isListLoading && !timetables) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>시간표</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(ROUTES.NOTIFICATION)}>
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push(ROUTES.MYPAGE)}>
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 시간표 선택 및 편집 버튼 */}
      <View style={styles.actionHeader}>
        <TouchableOpacity
          style={styles.semesterBtn}
          onPress={() => setShowListModal(true)}
        >
          <Text style={styles.semesterText}>{activeTimetableName}</Text>
          <ChevronDown size={14} color="#6366f1" />
        </TouchableOpacity>

        <View style={styles.editControls}>
          {isEditing && (
            <TouchableOpacity style={styles.cancelEditBtn} onPress={stopEditing}>
              <X size={18} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.toggleEditBtn, isEditing ? styles.saveBtn : styles.editBtn]}
            onPress={handleToggleEdit}
          >
            {isEditing ? (
              <>
                <Save size={14} color="white" />
                <Text style={styles.saveBtnText}>저장</Text>
              </>
            ) : (
              <>
                <Plus size={14} color="#6366f1" />
                <Text style={styles.editBtnText}>편집</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.dayHeader}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayCell}>
            <Text style={styles.dayText}>{DAY_LABELS[day]}</Text>
          </View>
        ))}
      </View>

      {/* 시간표 그리드 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {/* 시간 축 */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map((h) => (
              <View key={h} style={styles.timeCell}>
                <Text style={styles.timeText}>{h}</Text>
              </View>
            ))}
          </View>

          {/* 요일별 컬럼 */}
          {DAYS.map((day) => (
            <View key={day} style={styles.dayColumn}>
              {HOURS.map((h) => (
                <View key={h} style={styles.gridCell} />
              ))}
              {displayCourses
                .filter((s) => s.dayOfWeek === day)
                .map((course) => {
                  const startMins = toMinutes(course.startTime);
                  const endMins = toMinutes(course.endTime);
                  const top = ((startMins - 9 * 60) / 60) * CELL_HEIGHT;
                  const height = ((endMins - startMins) / 60) * CELL_HEIGHT;
                  
                  const color = course.color 
                    ? { bg: course.color + '30', text: course.color } 
                    : SUBJECT_COLORS[course.courseId % SUBJECT_COLORS.length];

                  return (
                    <TouchableOpacity
                      key={`${course.courseId}-${course.dayOfWeek}`}
                      style={[
                        styles.subjectBlock,
                        { 
                          top, height: height - 1, backgroundColor: color.bg,
                          borderLeftWidth: 4, borderLeftColor: color.text,
                        },
                        isEditing ? styles.editingBlock : undefined
                      ]}
                      onPress={() => {
                        setSelectedCourse(course);
                        setShowDetailModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.subjectName, { color: color.text }]} numberOfLines={2}>
                        {course.courseName}
                      </Text>
                      <Text style={[styles.subjectRoom, { color: color.text }]} numberOfLines={1}>
                        {course.roomName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 1. 시간표 목록 및 학기 선택 모달 */}
      <Modal visible={showListModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowListModal(false)} />
        <View style={[styles.semesterModalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          {renderPeriodSelector()}
          <View style={styles.listModalHeader}>
            <Text style={styles.sheetTitle}>시간표 목록</Text>
            <TouchableOpacity 
              onPress={() => setShowCreateModal(true)}
              style={styles.addTimetableBtn}
            >
              <Plus size={14} color="#6366f1" />
              <Text style={styles.addTimetableText}>추가</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{maxHeight: 300}}>
            {isListLoading ? (
              <ActivityIndicator style={{ paddingVertical: 40 }} color="#6366f1" />
            ) : Array.isArray(timetables) && timetables.length > 0 ? (
              timetables.map((t) => (
                <TouchableOpacity
                  key={t.timetableId}
                  style={[styles.semesterItem, activeTimetableId === t.timetableId && styles.semesterItemActive]}
                  onPress={() => {
                    setActiveTimetable(t.timetableId);
                    setShowListModal(false);
                  }}
                >
                  <Text style={[styles.semesterItemText, activeTimetableId === t.timetableId && styles.semesterItemTextActive]}>
                    {t.name}
                  </Text>
                  {activeTimetableId === t.timetableId && <Check size={18} color="#6366f1" />}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyTimetableList}>
                <Text style={styles.emptyTimetableText}>등록된 시간표가 없습니다.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 2. 과목 상세 모달 */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeDetailModal} />
        {selectedCourse && (
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalColorDot, { backgroundColor: selectedCourse.color || SUBJECT_COLORS[selectedCourse.courseId % SUBJECT_COLORS.length].text }]} />
                <Text style={styles.modalTitle}>{selectedCourse.courseName}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalInfo}><Text style={styles.modalLabel}>강의실</Text><Text style={styles.modalValue}>{selectedCourse.roomName}</Text></View>
              <View style={styles.modalInfo}><Text style={styles.modalLabel}>장소</Text><Text style={styles.modalValue}>{selectedCourse.buildingName}</Text></View>
              <View style={styles.modalInfo}><Text style={styles.modalLabel}>요일</Text><Text style={styles.modalValue}>{DAY_LABELS[selectedCourse.dayOfWeek]}요일</Text></View>
              <View style={styles.modalInfo}><Text style={styles.modalLabel}>시간</Text><Text style={styles.modalValue}>{selectedCourse.startTime.substring(0, 5)} ~ {selectedCourse.endTime.substring(0, 5)}</Text></View>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.closeBtn} onPress={closeDetailModal}><Text style={styles.closeBtnText}>닫기</Text></TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteFromDraft(selectedCourse.courseId)}><Text style={styles.deleteBtnText}>제거</Text></TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* 3. 시간표 생성 모달 */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)} />
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>새 시간표 생성</Text>
              <Text style={styles.modalLabel}>시간표 이름을 입력해주세요.</Text>
              <TextInput style={styles.createInput} placeholder="예: 2026-1학기 주전공" value={newTimetableName} onChangeText={setNewTimetableName} autoFocus />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCreateModal(false)}><Text style={styles.closeBtnText}>취소</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, !newTimetableName.trim() && {opacity: 0.5}]} onPress={handleCreateTimetable} disabled={!newTimetableName.trim()}><Text style={styles.confirmBtnText}>생성</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isEditing && (
        <TouchableOpacity 
          style={styles.floatingAddBtn}
          onPress={() => setShowSearchModal(true)}
        >
          <Plus size={28} color="white" />
        </TouchableOpacity>
      )}

      <CourseSearchModal isVisible={showSearchModal} onClose={() => setShowSearchModal(false)} year={currentYear} semester={currentSemester} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  headerIcons: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  semesterBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  semesterText: { fontSize: 13, fontFamily: fonts.bold, color: "#6366f1" },
  editControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelEditBtn: { backgroundColor: "#f3f4f6", padding: 8, borderRadius: 20 },
  toggleEditBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  editBtn: { backgroundColor: "#f5f3ff" },
  saveBtn: { backgroundColor: "#6366f1" },
  editBtnText: { color: "#6366f1", fontFamily: fonts.bold, marginLeft: 4, fontSize: 12 },
  saveBtnText: { color: "white", fontFamily: fonts.bold, marginLeft: 4, fontSize: 12 },
  dayHeader: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dayCell: { flex: 1, alignItems: "center" },
  dayText: { fontSize: 13, fontFamily: fonts.bold, color: "#555" },
  grid: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  timeCell: {
    height: CELL_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 4,
  },
  timeText: { fontSize: 10, fontFamily: fonts.regular, color: "#ccc" },
  dayColumn: { flex: 1, position: "relative" },
  gridCell: {
    height: CELL_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  subjectBlock: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 6,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  editingBlock: {
    shadowColor: "#6366f1",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderStyle: "dashed",
    borderWidth: 1,
  },
  subjectName: { fontSize: 11, fontFamily: fonts.bold, lineHeight: 14 },
  subjectRoom: {
    fontSize: 9,
    fontFamily: fonts.regular,
    marginTop: 2,
    opacity: 0.8,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  semesterModalSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  periodSelectorRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  periodGroup: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4 },
  periodTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  periodTabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  periodTabText: { fontFamily: fonts.regular, color: "#6b7280", fontSize: 14 },
  periodTabTextActive: { fontFamily: fonts.bold, color: "#6366f1" },
  listModalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
  },
  addTimetableBtn: { backgroundColor: "#f5f3ff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center" },
  addTimetableText: { fontFamily: fonts.bold, color: "#6366f1", fontSize: 12, marginLeft: 4 },
  semesterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  semesterItemActive: {
    backgroundColor: "#f5f3ff",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  semesterItemText: { fontSize: 14, fontFamily: fonts.regular, color: "#555" },
  semesterItemTextActive: { fontFamily: fonts.bold, color: "#6366f1" },
  emptyTimetableList: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyTimetableText: { fontFamily: fonts.medium, color: "#9ca3af", fontSize: 14 },
  modalWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalColorDot: { width: 12, height: 12, borderRadius: 6 },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  modalDivider: { height: 1, backgroundColor: "#f3f4f6" },
  modalInfo: { flexDirection: "row", alignItems: "center" },
  modalLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#aaa",
    width: 60,
  },
  modalValue: { fontSize: 14, fontFamily: fonts.bold, color: "#333" },
  modalBtnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  closeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f6f8",
    alignItems: "center",
  },
  closeBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "#555" },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
  },
  deleteBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "#f87171" },
  createInput: {
    backgroundColor: "#f5f6f8",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "#333",
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
  floatingAddBtn: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    backgroundColor: "#6366f1",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
