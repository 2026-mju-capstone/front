import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useRouter } from "expo-router";
import { 
  Bell, 
  ChevronDown, 
  Plus, 
  User, 
  X, 
  Check, 
  WifiOff, 
  Book,
  MapPin,
  Clock,
  Trash2,
  AlertCircle
} from "lucide-react-native";
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
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetInfo } from "@react-native-community/netinfo";
import { useTimetables, useTimetableDetail } from "@/hooks/queries/useTimetableQueries";
import { useSyncTimetable, useCreateTimetable } from "@/hooks/mutations/useTimetableMutations";
import { useTimetableStore } from "@/store/timetableStore";
import { Course, DayOfWeek } from "@/api/types";
import CourseSearchModal from "@/components/CourseSearchModal";
import AddSemesterSheet from "@/components/AddSemesterSheet";

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

const START_HOUR = 9;
const DEFAULT_END_HOUR = 18;
const CELL_HEIGHT = 60;
const TIME_COL_WIDTH = 30;

const SUBJECT_COLORS = [
  { bg: "#eef2ff", text: "#6366f1", border: "#c7d2fe" },
  { bg: "#fef9c3", text: "#ca8a04", border: "#fde68a" },
  { bg: "#dcfce7", text: "#16a34a", border: "#a7f3d0" },
  { bg: "#fce7f3", text: "#db2777", border: "#fbcfe8" },
  { bg: "#ffedd5", text: "#ea580c", border: "#fed7aa" },
  { bg: "#e0f2fe", text: "#0284c7", border: "#bae6fd" },
];

function toMinutes(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isConnected } = useNetInfo();

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
    addCourse,
    removeCourse
  } = useTimetableStore();

  // Queries
  const { data: timetables, isLoading: isListLoading } = useTimetables(currentYear, currentSemester);
  const { data: serverCourses, isLoading: isDetailLoading } = useTimetableDetail(activeTimetableId);
  
  // Mutations
  const syncMutation = useSyncTimetable();
  const createMutation = useCreateTimetable();

  // Local UI State
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Toast Auto-dismiss
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // 학기 변경 시 자동 첫 번째 시간표 선택 혹은 생성 유도
  useEffect(() => {
    if (isListLoading || !Array.isArray(timetables)) return;

    if (timetables.length > 0) {
      const currentValid = timetables.some(t => t.timetableId === activeTimetableId);
      if (!currentValid) {
        const primary = timetables.find(t => t.isPrimary) || timetables[0];
        setActiveTimetable(primary.timetableId);
      }
    } else {
      if (activeTimetableId !== null) {
        setActiveTimetable(null);
      }
    }
  }, [timetables, isListLoading, activeTimetableId]);

  // 학기 이름 계산
  const activeTimetableName = useMemo(() => {
    if (!Array.isArray(timetables)) return "시간표";
    const found = timetables.find(t => t.timetableId === activeTimetableId);
    return found ? found.name : `${currentYear}년 ${currentSemester}학기`;
  }, [timetables, activeTimetableId, currentYear, currentSemester]);

  // Display Courses (Draft or Server)
  const displayCourses = isEditing ? draftCourses : (serverCourses || []);

  const endHour = useMemo(() => {
    const lastTime = displayCourses.reduce((max, cls) => {
      const endH = parseInt(cls.endTime.split(":")[0], 10);
      return endH > max ? endH : max;
    }, DEFAULT_END_HOUR);
    return lastTime < DEFAULT_END_HOUR ? DEFAULT_END_HOUR : lastTime + 1;
  }, [displayCourses]);

  const totalHours = endHour - START_HOUR;

  const handleCreateTimetable = (year: number, semester: number) => {
    if (isConnected === false) {
      setToastMsg("오프라인에서는 시간표를 생성할 수 없습니다.");
      return;
    }

    createMutation.mutate({
      name: `${year}년 ${semester}학기`,
      year,
      semester
    }, {
      onSuccess: (newTimetable) => {
        setPeriod(year, semester);
        setActiveTimetable(newTimetable.timetableId);
        setShowAddSemester(false);
        setShowSemesterPicker(false);
        setToastMsg("새 시간표가 생성되었습니다.");
      },
      onError: (error: any) => {
        Alert.alert("에러", error.response?.data?.error || "생성에 실패했습니다.");
      }
    });
  };

  const handleSelectClass = (course: Course) => {
    const success = addCourse(course);
    if (!success) {
      setToastMsg("해당 시간에 이미 강의가 있습니다.");
    } else {
      setShowSearchModal(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      if (!activeTimetableId) return;
      if (isConnected === false) {
        setToastMsg("오프라인 상태에서는 저장할 수 없습니다.");
        return;
      }

      const syncData = {
        courses: draftCourses.map(c => ({
          courseId: c.courseId,
          color: c.color || SUBJECT_COLORS[c.courseId % SUBJECT_COLORS.length].text
        }))
      };
      syncMutation.mutate({ id: activeTimetableId, data: syncData }, {
        onSuccess: () => {
          stopEditing();
          setToastMsg("시간표가 저장되었습니다.");
        },
        onError: (error: any) => {
          Alert.alert("에러", error.response?.data?.error || "저장에 실패했습니다.");
        }
      });
    } else {
      if (isConnected === false) {
        setToastMsg("오프라인 상태에서는 편집할 수 없습니다.");
        return;
      }
      startEditing(serverCourses || []);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Toast Alert */}
      {toastMsg && (
        <View className="absolute top-24 left-4 right-4 z-[100] items-center">
          <View className="bg-gray-800/90 px-4 py-2.5 rounded-xl flex-row items-center shadow-lg">
            <AlertCircle size={16} color="white" className="mr-2" />
            <Text className="text-white text-sm font-medium">{toastMsg}</Text>
          </View>
        </View>
      )}

      {/* Offline Banner */}
      {isConnected === false && (
        <View className="bg-red-50 flex-row items-center justify-center py-1.5 gap-2">
          <WifiOff size={14} color="#ef4444" />
          <Text className="text-red-500 text-[10px] font-medium">오프라인 모드 (저장된 데이터를 표시함)</Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-2.5">
        <Text className="text-lg font-bold text-gray-900">시간표</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity className="p-2" onPress={() => router.push(ROUTES.NOTIFICATION)}>
            <Bell size={20} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={() => router.push(ROUTES.MYPAGE)}>
            <User size={20} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Semester & Actions */}
      <View className="flex-row items-center justify-between px-5 py-2 border-b border-gray-50">
        <View className="relative">
          <TouchableOpacity 
            onPress={() => setShowSemesterPicker(!showSemesterPicker)}
            className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full gap-1"
          >
            <Text className="text-xs font-bold text-indigo-600">{activeTimetableName}</Text>
            <ChevronDown size={12} color="#4f6ef7" />
          </TouchableOpacity>

          {showSemesterPicker && (
            <View 
              className="absolute left-0 top-10 bg-white rounded-2xl border border-gray-100 z-50 overflow-hidden shadow-xl"
              style={{ minWidth: 200 }}
            >
              <ScrollView style={{ maxHeight: 200 }}>
                {Array.isArray(timetables) && timetables.map((t) => (
                  <TouchableOpacity
                    key={t.timetableId}
                    onPress={() => {
                      setActiveTimetable(t.timetableId);
                      setShowSemesterPicker(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3 border-b border-gray-50"
                  >
                    <Text className={`text-xs ${activeTimetableId === t.timetableId ? 'text-indigo-600 font-bold' : 'text-gray-500'}`}>
                      {t.name}
                    </Text>
                    {activeTimetableId === t.timetableId && <Check size={14} color="#4f6ef7" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => {
                  setShowSemesterPicker(false);
                  setShowAddSemester(true);
                }}
                className="px-4 py-3 bg-gray-50 flex-row items-center gap-1"
              >
                <Plus size={14} color="#4f6ef7" />
                <Text className="text-xs font-bold text-indigo-600">새 학기 추가</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {isEditing && (
            <TouchableOpacity 
              onPress={stopEditing}
              className="bg-gray-100 p-2 rounded-full"
            >
              <X size={16} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleToggleEdit}
            className={`flex-row items-center px-4 py-2 rounded-full gap-1.5 ${
              isEditing ? 'bg-indigo-600 shadow-md' : 'bg-indigo-50'
            } ${isConnected === false && !isEditing ? 'opacity-50' : ''}`}
            disabled={isConnected === false && !isEditing}
          >
            {isEditing ? (
              <>
                <Check size={14} color="white" />
                <Text className="text-white text-xs font-bold">저장</Text>
              </>
            ) : (
              <>
                <Plus size={14} color="#4f6ef7" />
                <Text className="text-indigo-600 text-xs font-bold">편집</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Timetable Grid */}
      <View className="flex-1">
        {/* Day Labels */}
        <View className="flex-row border-b border-gray-100">
          <View style={{ width: TIME_COL_WIDTH }} />
          {DAYS.map((day) => (
            <View key={day} className="flex-1 items-center py-2">
              <Text className="text-xs font-bold text-gray-400">{DAY_LABELS[day]}</Text>
            </View>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row px-1">
            {/* Time Column */}
            <View style={{ width: TIME_COL_WIDTH }}>
              {Array.from({ length: totalHours }).map((_, i) => (
                <View key={i} style={{ height: CELL_HEIGHT }} className="items-center pt-2">
                  <Text className="text-[10px] text-gray-300 font-medium">{START_HOUR + i}</Text>
                </View>
              ))}
            </View>

            {/* Content Area */}
            <View className="flex-1 flex-row relative">
              {DAYS.map((day) => (
                <View key={day} className="flex-1 relative border-r border-gray-50 last:border-r-0">
                  {/* Grid Lines */}
                  {Array.from({ length: totalHours + 1 }).map((_, i) => (
                    <View
                      key={i}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: i * CELL_HEIGHT }}
                    />
                  ))}

                  {/* Course Blocks */}
                  {displayCourses.filter((c) => c.dayOfWeek === day).map((cls) => {
                    const startMin = toMinutes(cls.startTime) - START_HOUR * 60;
                    const duration = toMinutes(cls.endTime) - toMinutes(cls.startTime);
                    const top = (startMin / 60) * CELL_HEIGHT;
                    const height = (duration / 60) * CELL_HEIGHT;
                    
                    const color = cls.color 
                      ? { bg: cls.color + '30', text: cls.color, border: cls.color } 
                      : SUBJECT_COLORS[cls.courseId % SUBJECT_COLORS.length];

                    return (
                      <TouchableOpacity
                        key={`${cls.courseId}-${cls.dayOfWeek}`}
                        onPress={() => {
                          setSelectedCourse(cls);
                          setShowDetailModal(true);
                        }}
                        activeOpacity={0.8}
                        className={`absolute left-[1px] right-[1px] rounded-lg p-1.5 text-left border overflow-hidden ${
                          isEditing ? 'border-dashed' : ''
                        }`}
                        style={{
                          top: top + 1,
                          height: height - 2,
                          backgroundColor: color.bg,
                          borderColor: color.border,
                        }}
                      >
                        <Text 
                          className="text-[10px] font-bold leading-tight" 
                          style={{ color: color.text }}
                          numberOfLines={2}
                        >
                          {cls.courseName}
                        </Text>
                        <Text 
                          className="text-[8px] opacity-60 mt-0.5" 
                          style={{ color: color.text }}
                          numberOfLines={1}
                        >
                          {cls.roomName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Floating Add Button */}
      {isEditing && (
        <TouchableOpacity 
          onPress={() => setShowSearchModal(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full items-center justify-center shadow-lg shadow-indigo-600/40"
        >
          <Plus size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Modals */}
      <CourseSearchModal 
        isVisible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        year={currentYear}
        semester={currentSemester}
        onSelect={handleSelectClass}
      />

      <AddSemesterSheet 
        isVisible={showAddSemester}
        onAdd={handleCreateTimetable}
        onClose={() => setShowAddSemester(false)}
      />

      {/* Course Detail Bottom Sheet */}
      <Modal visible={showDetailModal} transparent animationType="fade">
        <Pressable className="absolute inset-0 bg-black/40" onPress={() => setShowDetailModal(false)} />
        {selectedCourse && (
          <View 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            
            <View className="flex-row items-start gap-3 mb-6">
              <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                <Book size={20} color="#4f6ef7" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{selectedCourse.courseName}</Text>
                <Text className="text-sm text-gray-400 mt-0.5">강의 정보</Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-2xl p-4 mb-6 gap-4">
              <View className="flex-row items-center gap-3">
                <Clock size={16} color="#9ca3af" />
                <Text className="text-sm text-gray-700">
                  {DAY_LABELS[selectedCourse.dayOfWeek]}요일 {selectedCourse.startTime.substring(0,5)} - {selectedCourse.endTime.substring(0,5)}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <MapPin size={16} color="#9ca3af" />
                <Text className="text-sm text-gray-700">{selectedCourse.buildingName} {selectedCourse.roomName}</Text>
              </View>
            </View>

            <View className="flex-row gap-2">
              {isEditing ? (
                <TouchableOpacity
                  onPress={() => {
                    removeCourse(selectedCourse.courseId);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-red-50 items-center justify-center"
                >
                  <Text className="text-sm font-bold text-red-500">삭제</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                  isEditing ? 'bg-indigo-600' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-bold ${isEditing ? 'text-white' : 'text-gray-500'}`}>
                  {isEditing ? '확인' : '닫기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
