import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, Plus, Save, User, X } from "lucide-react-native";
import { useEffect, useState } from "react";

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
    setPeriod, // 이 부분을 추가하여 에러 해결
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

  const [showListModal, setShowListModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // 학기 변경 시 자동 첫 번째 시간표 선택 (혹은 비우기)
  useEffect(() => {
    if (Array.isArray(timetables) && timetables.length > 0) {
      const exists = timetables.some(t => t.timetableId === activeTimetableId);
      if (!exists) {
        const primary = timetables.find(t => t.isPrimary) || timetables[0];
        setActiveTimetable(primary.timetableId);
      }
    } else if (Array.isArray(timetables) && timetables.length === 0) {
      setActiveTimetable(null);
    }
  }, [timetables, currentYear, currentSemester]);

  const activeTimetableName = Array.isArray(timetables) 
    ? (timetables.find(t => t.timetableId === activeTimetableId)?.name || "시간표")
    : "시간표";

  const handleCreateTimetable = () => {
    Alert.prompt(
      "새 시간표",
      "시간표 이름을 입력해주세요.",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "생성", 
          onPress: (name?: string) => {
            if (!name) return;
            createMutation.mutate({
              name,
              year: currentYear,
              semester: currentSemester
            }, {
              onSuccess: (newTimetable) => {
                setActiveTimetable(newTimetable.timetableId);
                Alert.alert("알림", `"${name}" 시간표가 생성되었습니다.`);
              }
            });
          } 
        }
      ]
    );
  };

  const handleCoursePress = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailModal(true);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // 저장 (Sync)
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

  const handleDeleteFromDraft = (id: number) => {
    removeCourse(id);
    setShowDetailModal(false);
  };

  // 현재 보여줄 강의 목록 (편집 중이면 draft, 아니면 서버 데이터)
  const displayCourses = isEditing ? draftCourses : (serverCourses || []);

  if (isListLoading && !timetables) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
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
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(ROUTES.NOTIFICATION)}
          >
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(ROUTES.MYPAGE)}
          >
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 시간표 선택 및 편집 버튼 */}
      <View className="flex-row items-center justify-between px-5 py-2 border-b border-gray-50">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            style={styles.semesterBtn}
            onPress={() => setShowListModal(true)}
          >
            <Text style={styles.semesterText}>{activeTimetableName}</Text>
            <ChevronDown size={14} color="#6366f1" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          {isEditing && (
            <TouchableOpacity 
              className="bg-gray-100 p-2 rounded-full"
              onPress={stopEditing}
            >
              <X size={18} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded-full ${isEditing ? 'bg-indigo-600' : 'bg-indigo-50'}`}
            onPress={handleToggleEdit}
          >
            {isEditing ? (
              <>
                <Save size={14} color="white" />
                <Text className="text-white font-pretendard-bold ml-1 text-xs">저장</Text>
              </>
            ) : (
              <>
                <Plus size={14} color="#6366f1" />
                <Text className="text-indigo-600 font-pretendard-bold ml-1 text-xs">편집</Text>
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
                  
                  // 색상 결정: 저장된 색상이 있으면 쓰고, 없으면 ID 기반으로 지정
                  const color = course.color 
                    ? { bg: course.color + '20', text: course.color } 
                    : SUBJECT_COLORS[course.courseId % SUBJECT_COLORS.length];

                  return (
                    <TouchableOpacity
                      key={course.courseId}
                      style={[
                        styles.subjectBlock,
                        { top, height: height - 1, backgroundColor: color.bg },
                      ]}
                      onPress={() => handleCoursePress(course)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.subjectName, { color: color.text }]}
                        numberOfLines={2}
                      >
                        {course.courseName}
                      </Text>
                      <Text
                        style={[styles.subjectRoom, { color: color.text }]}
                        numberOfLines={1}
                      >
                        {course.roomName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 시간표 목록 및 학기 선택 모달 */}
      <Modal visible={showListModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowListModal(false)}
        />
        <View
          style={[
            styles.semesterModalSheet,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.sheetHandle} />
          
          {/* 학기 선택 (연도 & 학기) */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row bg-gray-100 rounded-xl p-1">
              {[2024, 2025, 2026].map(y => (
                <TouchableOpacity 
                  key={y}
                  onPress={() => setPeriod(y, currentSemester)}
                  className={`px-4 py-2 rounded-lg ${currentYear === y ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text style={{fontFamily: currentYear === y ? fonts.bold : fonts.regular}} className={currentYear === y ? 'text-indigo-600' : 'text-gray-500'}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row bg-gray-100 rounded-xl p-1 ml-2">
              {[1, 2].map(s => (
                <TouchableOpacity 
                  key={s}
                  onPress={() => setPeriod(currentYear, s)}
                  className={`px-4 py-2 rounded-lg ${currentSemester === s ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text style={{fontFamily: currentSemester === s ? fonts.bold : fonts.regular}} className={currentSemester === s ? 'text-indigo-600' : 'text-gray-500'}>
                    {s}학기
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text style={styles.sheetTitle}>시간표 목록</Text>
            <TouchableOpacity 
              onPress={handleCreateTimetable}
              className="bg-indigo-50 px-3 py-1.5 rounded-lg flex-row items-center"
            >
              <Plus size={14} color="#6366f1" />
              <Text style={{fontFamily: fonts.bold}} className="text-indigo-600 text-xs ml-1">추가</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{maxHeight: 300}}>
            {isListLoading ? (
              <ActivityIndicator className="py-10" color="#6366f1" />
            ) : Array.isArray(timetables) && timetables.length > 0 ? (
              timetables.map((t) => (
                <TouchableOpacity
                  key={t.timetableId}
                  style={[
                    styles.semesterItem,
                    activeTimetableId === t.timetableId && styles.semesterItemActive,
                  ]}
                  onPress={() => {
                    setActiveTimetable(t.timetableId);
                    setShowListModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.semesterItemText,
                      activeTimetableId === t.timetableId && styles.semesterItemTextActive,
                    ]}
                  >
                    {t.name}
                  </Text>
                  {activeTimetableId === t.timetableId && (
                    <Text style={styles.semesterItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View className="items-center justify-center py-10">
                <Text style={{fontFamily: fonts.medium}} className="text-gray-400">등록된 시간표가 없습니다.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 과목 상세 모달 */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDetailModal(false)}
        />
        {selectedCourse && (
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalColorDot,
                    {
                      backgroundColor: selectedCourse.color || SUBJECT_COLORS[selectedCourse.courseId % SUBJECT_COLORS.length].text,
                    },
                  ]}
                />
                <Text style={styles.modalTitle}>{selectedCourse.courseName}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>강의실</Text>
                <Text style={styles.modalValue}>{selectedCourse.roomName}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>장소</Text>
                <Text style={styles.modalValue}>{selectedCourse.buildingName}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>요일</Text>
                <Text style={styles.modalValue}>
                  {DAY_LABELS[selectedCourse.dayOfWeek]}요일
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>시간</Text>
                <Text style={styles.modalValue}>
                  {selectedCourse.startTime.substring(0, 5)} ~ {selectedCourse.endTime.substring(0, 5)}
                </Text>
              </View>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.closeBtnText}>닫기</Text>
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteFromDraft(selectedCourse.courseId)}
                  >
                    <Text style={styles.deleteBtnText}>제거</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* 강의 추가 버튼 (편집 모드일 때만 하단에 노출) */}
      {isEditing && (
        <TouchableOpacity 
          className="absolute right-6 bottom-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg"
          onPress={() => setShowSearchModal(true)}
        >
          <Plus size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* 강의 검색 모달 */}
      <CourseSearchModal 
        isVisible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        year={currentYear}
        semester={currentSemester}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  sheetTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 12,
  },
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
  semesterItemCheck: { fontSize: 14, color: "#6366f1", fontFamily: fonts.bold },
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
});
