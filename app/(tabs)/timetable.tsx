import { fonts } from "@/constants/typography";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, Plus, User } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAYS = ["월", "화", "수", "목", "금"];
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

const SEMESTERS = [
  "2024년 2학기",
  "2025년 1학기",
  "2025년 2학기",
  "2026년 1학기",
];

type Subject = {
  id: number;
  name: string;
  room: string;
  day: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  colorIndex: number;
};

const DUMMY_SUBJECTS: Subject[] = [
  {
    id: 1,
    name: "자료구조",
    room: "공학관 301호",
    day: 0,
    startHour: 9,
    startMin: 0,
    endHour: 10,
    endMin: 30,
    colorIndex: 0,
  },
  {
    id: 2,
    name: "자료구조",
    room: "공학관 301호",
    day: 2,
    startHour: 9,
    startMin: 0,
    endHour: 10,
    endMin: 30,
    colorIndex: 0,
  },
  {
    id: 3,
    name: "운영체제",
    room: "공학관 205호",
    day: 1,
    startHour: 10,
    startMin: 0,
    endHour: 12,
    endMin: 0,
    colorIndex: 1,
  },
  {
    id: 4,
    name: "운영체제",
    room: "공학관 205호",
    day: 3,
    startHour: 13,
    startMin: 0,
    endHour: 14,
    endMin: 30,
    colorIndex: 1,
  },
  {
    id: 5,
    name: "데이터베이스",
    room: "공학관 401호",
    day: 3,
    startHour: 9,
    startMin: 0,
    endHour: 10,
    endMin: 30,
    colorIndex: 2,
  },
  {
    id: 6,
    name: "알고리즘",
    room: "IT관 102호",
    day: 2,
    startHour: 13,
    startMin: 0,
    endHour: 15,
    endMin: 0,
    colorIndex: 3,
  },
  {
    id: 7,
    name: "캡스톤디자인",
    room: "창업관 201호",
    day: 0,
    startHour: 14,
    startMin: 0,
    endHour: 16,
    endMin: 30,
    colorIndex: 4,
  },
  {
    id: 8,
    name: "영어회화",
    room: "어학관 102호",
    day: 1,
    startHour: 15,
    startMin: 0,
    endHour: 16,
    endMin: 30,
    colorIndex: 5,
  },
  {
    id: 9,
    name: "소프트웨어공학",
    room: "인문관 301호",
    day: 4,
    startHour: 14,
    startMin: 0,
    endHour: 16,
    endMin: 0,
    colorIndex: 0,
  },
];

function toMinutes(hour: number, min: number) {
  return hour * 60 + min;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>(DUMMY_SUBJECTS);
  const [semester, setSemester] = useState("2026년 1학기");
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // TODO: API 연결 후 활성화
  // const { data: timetableData } = useTimetable();
  // const deleteSubjectMutation = useDeleteSubject();

  const handleSubjectPress = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowDetailModal(true);
  };

  const handleDelete = (id: number) => {
    // TODO: API 연결 후 교체
    // deleteSubjectMutation.mutate(id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setShowDetailModal(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>시간표</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              // TODO: 강의 추가 기능 연결
            }}
          >
            <Plus size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/notifications")}
          >
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push("/mypage")}
          >
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 학기 선택 */}
      <View style={styles.semesterRow}>
        <TouchableOpacity
          style={styles.semesterBtn}
          onPress={() => setShowSemesterModal(true)}
        >
          <Text style={styles.semesterText}>{semester}</Text>
          <ChevronDown size={14} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.dayHeader}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayCell}>
            <Text style={styles.dayText}>{day}</Text>
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
          {DAYS.map((day, dayIndex) => (
            <View key={day} style={styles.dayColumn}>
              {HOURS.map((h) => (
                <View key={h} style={styles.gridCell} />
              ))}
              {subjects
                .filter((s) => s.day === dayIndex)
                .map((subject) => {
                  const startMins = toMinutes(
                    subject.startHour,
                    subject.startMin,
                  );
                  const endMins = toMinutes(subject.endHour, subject.endMin);
                  const top =
                    ((startMins - toMinutes(9, 0)) / 60) * CELL_HEIGHT;
                  const height = ((endMins - startMins) / 60) * CELL_HEIGHT;
                  const color =
                    SUBJECT_COLORS[subject.colorIndex % SUBJECT_COLORS.length];

                  return (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectBlock,
                        { top, height: height - 2, backgroundColor: color.bg },
                      ]}
                      onPress={() => handleSubjectPress(subject)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.subjectName, { color: color.text }]}
                        numberOfLines={2}
                      >
                        {subject.name}
                      </Text>
                      <Text
                        style={[styles.subjectRoom, { color: color.text }]}
                        numberOfLines={1}
                      >
                        {subject.room}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 학기 선택 모달 */}
      <Modal visible={showSemesterModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSemesterModal(false)}
        />
        <View
          style={[
            styles.semesterModalSheet,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>학기 선택</Text>
          {SEMESTERS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.semesterItem,
                semester === s && styles.semesterItemActive,
              ]}
              onPress={() => {
                setSemester(s);
                setShowSemesterModal(false);
              }}
            >
              <Text
                style={[
                  styles.semesterItemText,
                  semester === s && styles.semesterItemTextActive,
                ]}
              >
                {s}
              </Text>
              {semester === s && (
                <Text style={styles.semesterItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* 과목 상세 모달 */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDetailModal(false)}
        />
        {selectedSubject && (
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View
                  style={[
                    styles.modalColorDot,
                    {
                      backgroundColor:
                        SUBJECT_COLORS[
                          selectedSubject.colorIndex % SUBJECT_COLORS.length
                        ].text,
                    },
                  ]}
                />
                <Text style={styles.modalTitle}>{selectedSubject.name}</Text>
              </View>
              <View style={styles.modalDivider} />
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>강의실</Text>
                <Text style={styles.modalValue}>{selectedSubject.room}</Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>요일</Text>
                <Text style={styles.modalValue}>
                  {DAYS[selectedSubject.day]}요일
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalLabel}>시간</Text>
                <Text style={styles.modalValue}>
                  {String(selectedSubject.startHour).padStart(2, "0")}:
                  {String(selectedSubject.startMin).padStart(2, "0")} ~{" "}
                  {String(selectedSubject.endHour).padStart(2, "0")}:
                  {String(selectedSubject.endMin).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.closeBtnText}>닫기</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(selectedSubject.id)}
                >
                  <Text style={styles.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
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
  semesterRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  semesterBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
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
  },
  subjectName: { fontSize: 11, fontFamily: fonts.bold, lineHeight: 15 },
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
    backgroundColor: "#eef2ff",
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
    width: 52,
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
