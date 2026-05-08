import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronDown, Book, Clock, MapPin, Trash2, AlertCircle, CalendarDays } from 'lucide-react-native';
import { Course, DayOfWeek, TimetableSummary } from '@/api/types';
import { useAllTimetables, useTimetableDetail } from '@/hooks/queries/useTimetableQueries';
import { useSyncTimetable, useDeleteTimetable } from '@/hooks/mutations/useTimetableMutations';
import { useTimetableStore } from '@/store/timetableStore';
import AddSemesterSheet from '@/components/AddSemesterSheet';
import CourseSearchModal from '@/components/CourseSearchModal';

const DAYS: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'MON', label: '월' },
  { key: 'TUE', label: '화' },
  { key: 'WED', label: '수' },
  { key: 'THU', label: '목' },
  { key: 'FRI', label: '금' },
];

const START_HOUR = 9;
const DEFAULT_END_HOUR = 18;

type ColorSet = { bg: string; text: string; border: string };

const COLOR_PALETTE: ColorSet[] = [
  { bg: '#EEF2FF', text: '#4F6EF7', border: '#C7D2FE' },
  { bg: '#FEF9C3', text: '#CA8A04', border: '#FDE68A' },
  { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
  { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' },
  { bg: '#FCE7F3', text: '#DB2777', border: '#FBCFE8' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' },
  { bg: '#F3E8FF', text: '#7C3AED', border: '#D8B4FE' },
];

const BG_TO_COLOR: Record<string, ColorSet> =
  Object.fromEntries(COLOR_PALETTE.map(c => [c.bg, c]));

function assignColor(course: Course, allCourses: Course[]): string {
  const usedOnSameDay = new Set(
    allCourses
      .filter(c => c.dayOfWeek === course.dayOfWeek && c.courseId !== course.courseId && c.color)
      .map(c => c.color!)
  );
  const available = COLOR_PALETTE.find(p => !usedOnSameDay.has(p.bg));
  if (available) return available.bg;

  // 팔레트 초과 시 전체에서 가장 덜 쓰인 색 배정
  const usage = new Map<string, number>();
  for (const c of allCourses) {
    if (c.color) usage.set(c.color, (usage.get(c.color) ?? 0) + 1);
  }
  return COLOR_PALETTE.reduce((min, cur) =>
    (usage.get(cur.bg) ?? 0) < (usage.get(min.bg) ?? 0) ? cur : min
  ).bg;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function semesterLabel(year: number, semester: number): string {
  const term: Record<number, string> = { 1: '1학기', 2: '2학기', 3: '여름학기', 4: '겨울학기' };
  return `${year}년 ${term[semester] ?? `${semester}학기`}`;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const { activeTimetableId, setActiveTimetable } = useTimetableStore();

  // 시간표 목록 — 항상 서버에서 조회
  const { data: timetables = [], isLoading: isLoadingList } = useAllTimetables();

  // 저장된 activeTimetableId가 서버 목록에 있으면 사용, 없으면 첫 번째 항목으로 fallback
  const activeSemester: TimetableSummary | null =
    timetables.find(t => t.timetableId === activeTimetableId) ?? timetables[0] ?? null;

  const { data: savedCourses = [], isLoading: isLoadingCourses, refetch: refetchDetail } = useTimetableDetail(
    activeSemester?.timetableId ?? null
  );
  const { mutate: syncTimetable, isPending: isSyncing } = useSyncTimetable();
  const { mutate: deleteTimetable, isPending: isDeleting } = useDeleteTimetable();

  const pendingActivateRef = useRef<number | null>(null);
  const [draftCourse, setDraftCourse] = useState<Course | null>(null);
  const [selectedClass, setSelectedClass] = useState<Course | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [semesterToDelete, setSemesterToDelete] = useState<TimetableSummary | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 2000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useEffect(() => {
    setDraftCourse(null);
    setSelectedClass(null);
  }, [activeSemester?.timetableId]);

  // activeTimetableId가 서버 목록에 없으면 자동 보정
  useEffect(() => {
    if (isLoadingList || timetables.length === 0) return;

    // 신규 생성된 학기가 리패치 목록에 나타나면 활성화
    if (pendingActivateRef.current !== null) {
      const pendingExists = timetables.some(t => t.timetableId === pendingActivateRef.current);
      if (pendingExists) {
        setActiveTimetable(pendingActivateRef.current);
        pendingActivateRef.current = null;
      }
      return;
    }

    const exists = timetables.some(t => t.timetableId === activeTimetableId);
    if (!exists) {
      setActiveTimetable(timetables[0]?.timetableId ?? null);
    }
  }, [timetables, activeTimetableId, isLoadingList]);

  const displayData = useMemo(() => {
    if (!draftCourse) return savedCourses;
    return [...savedCourses, draftCourse];
  }, [savedCourses, draftCourse]);

  const endHour = useMemo(() => {
    const last = displayData.reduce((max, cls) => {
      const h = parseInt(cls.endTime.split(':')[0], 10);
      return h > max ? h : max;
    }, DEFAULT_END_HOUR);
    return last < DEFAULT_END_HOUR ? DEFAULT_END_HOUR : last + 1;
  }, [displayData]);

  const totalHours = endHour - START_HOUR;

  function getPosition(startTime: string, endTime: string) {
    const startMin = timeToMinutes(startTime) - START_HOUR * 60;
    const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
    const totalMin = totalHours * 60;
    return {
      top: `${(startMin / totalMin) * 100}%` as `${number}%`,
      height: `${(duration / totalMin) * 100}%` as `${number}%`,
    };
  }

  function buildSyncCourses(courses: Course[]) {
    return courses.map(c => ({
      courseId: c.courseId,
      color: c.color ?? assignColor(c, courses),
    }));
  }

  function selectSemester(t: TimetableSummary) {
    setActiveTimetable(t.timetableId);
    setShowSemesterPicker(false);
  }

  function handleSemesterCreated(timetable: TimetableSummary) {
    // invalidateQueries 리패치 완료 후 effect에서 활성화 (타이밍 경쟁 방지)
    pendingActivateRef.current = timetable.timetableId;
  }

  function handleSelectCourse(course: Course) {
    setDraftCourse(course);
    setShowAddClass(false);
  }

  function handleConfirmDraft() {
    if (!draftCourse || !activeSemester) return;
    syncTimetable(
      { id: activeSemester.timetableId, data: { courses: buildSyncCourses([...savedCourses, draftCourse]) } },
      {
        onSuccess: () => {
          setDraftCourse(null);
          refetchDetail();
        },
        onError: () => setToastMsg('강의 추가에 실패했습니다'),
      }
    );
  }

  function handleCancelDraft() {
    setDraftCourse(null);
  }

  function handleDeleteClass(courseId: number) {
    if (!activeSemester) return;
    const remaining = savedCourses.filter(c => c.courseId !== courseId);
    syncTimetable(
      { id: activeSemester.timetableId, data: { courses: buildSyncCourses(remaining) } },
      {
        onSuccess: () => {
          setSelectedClass(null);
          refetchDetail();
        },
        onError: () => setToastMsg('강의 삭제에 실패했습니다'),
      }
    );
  }

  function handleDeleteSemester() {
    if (!semesterToDelete) return;
    deleteTimetable(semesterToDelete.timetableId, {
      onSuccess: () => {
        if (activeTimetableId === semesterToDelete.timetableId) {
          const remaining = timetables.filter(t => t.timetableId !== semesterToDelete.timetableId);
          setActiveTimetable(remaining[0]?.timetableId ?? null);
        }
        setSemesterToDelete(null);
        setToastMsg(`${semesterLabel(semesterToDelete.year, semesterToDelete.semester)}이 삭제되었습니다`);
      },
      onError: () => {
        setSemesterToDelete(null);
        setToastMsg('학기 삭제에 실패했습니다');
      },
    });
  }

  const bottomSheetStyle = {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
  };
  const backdropStyle = {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>

      {/* 상단 헤더 */}
      <View
        className="flex-row items-center justify-between px-4 border-b border-gray-100"
        style={{ paddingVertical: 10 }}
      >
        <TouchableOpacity
          onPress={() => setShowSemesterPicker(!showSemesterPicker)}
          className="flex-row items-center"
          style={{ gap: 4 }}
        >
          <Text className="text-sm font-bold text-gray-900">
            {activeSemester
              ? semesterLabel(activeSemester.year, activeSemester.semester)
              : '학기를 추가해주세요'}
          </Text>
          <ChevronDown size={14} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setDraftCourse(null); setShowAddClass(true); }}
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: '#EEF2FF' }}
          disabled={!activeSemester}
        >
          <Plus size={16} color={activeSemester ? '#4F6EF7' : '#D1D5DB'} />
        </TouchableOpacity>
      </View>

      {/* 목록 로딩 중 */}
      {isLoadingList ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#4F6EF7" />
        </View>
      ) : timetables.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <CalendarDays size={48} color="#D1D5DB" />
          <Text className="text-base font-bold text-gray-400 mt-4 text-center">아직 시간표가 없습니다</Text>
          <Text className="text-sm text-gray-400 mt-1 text-center">상단 학기명을 눌러 새 학기를 추가해주세요</Text>
          <TouchableOpacity
            onPress={() => setShowAddSemester(true)}
            className="mt-6 px-6 py-3 rounded-2xl"
            style={{ backgroundColor: '#4F6EF7' }}
          >
            <Text className="text-sm font-bold text-white">학기 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* 요일 헤더 */}
          <View className="flex-row border-b border-gray-100">
            <View style={{ width: 32 }} />
            {DAYS.map(({ key, label }) => (
              <View key={key} className="flex-1 items-center py-2">
                <Text className="text-xs font-semibold text-gray-400">{label}</Text>
              </View>
            ))}
          </View>

          {/* 시간표 그리드 */}
          {isLoadingCourses ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#4F6EF7" />
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', paddingBottom: 8 }}>
              {/* 시간 축 */}
              <View style={{ width: 32, borderRightWidth: 1, borderRightColor: '#F3F4F6' }}>
                {Array.from({ length: totalHours }).map((_, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: '#D1D5DB', fontWeight: '500' }}>
                      {START_HOUR + i}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 요일별 컬럼 */}
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {DAYS.map(({ key }) => (
                  <View
                    key={key}
                    style={{ flex: 1, position: 'relative', borderRightWidth: 1, borderRightColor: '#F9FAFB' }}
                  >
                    {Array.from({ length: totalHours + 1 }).map((_, i) => (
                      <View
                        key={i}
                        style={{
                          position: 'absolute',
                          left: 0, right: 0,
                          top: `${(i / totalHours) * 100}%`,
                          borderTopWidth: 1,
                          borderTopColor: '#F3F4F6',
                        }}
                      />
                    ))}
                    {displayData.filter(c => c.dayOfWeek === key).map((cls) => {
                      const isDraft = draftCourse?.courseId === cls.courseId;
                      const { top, height } = getPosition(cls.startTime, cls.endTime);
                      const color = isDraft
                        ? { bg: '#F3F4F6', text: '#9CA3AF', border: '#E5E7EB' }
                        : (cls.color && BG_TO_COLOR[cls.color]) ? BG_TO_COLOR[cls.color] : COLOR_PALETTE[0];
                      return (
                        <TouchableOpacity
                          key={cls.courseId}
                          onPress={() => { if (!isDraft) setSelectedClass(cls); }}
                          activeOpacity={isDraft ? 1 : 0.8}
                          style={{
                            position: 'absolute',
                            left: 2, right: 2, top, height,
                            backgroundColor: color.bg,
                            borderWidth: 1,
                            borderColor: color.border,
                            borderRadius: 8,
                            padding: 6,
                            overflow: 'hidden',
                            opacity: isDraft ? 0.75 : 1,
                          }}
                        >
                          <Text
                            style={{ fontSize: 10, fontWeight: 'bold', color: color.text, lineHeight: 14 }}
                            numberOfLines={2}
                          >
                            {cls.courseName}
                          </Text>
                          <Text style={{ fontSize: 9, color: color.text, opacity: 0.6, marginTop: 2 }} numberOfLines={1}>
                            {cls.roomName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* 토스트 */}
      {toastMsg ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: insets.top + 60, left: 16, right: 16, alignItems: 'center' }}
        >
          <View style={{ backgroundColor: 'rgba(31,41,55,0.9)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{toastMsg}</Text>
          </View>
        </View>
      ) : null}

      {/* 학기 드롭다운 */}
      {showSemesterPicker && (
        <>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => setShowSemesterPicker(false)} />
          <View
            style={{
              position: 'absolute',
              top: insets.top + 48,
              left: 16,
              backgroundColor: '#fff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              overflow: 'hidden',
              minWidth: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {timetables.map((t) => (
              <View key={t.timetableId} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
                <TouchableOpacity onPress={() => selectSemester(t)} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: activeTimetableId === t.timetableId ? '#4F6EF7' : '#6B7280', fontWeight: activeTimetableId === t.timetableId ? '600' : '400' }}>
                    {semesterLabel(t.year, t.semester)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setShowSemesterPicker(false); setSemesterToDelete(t); }}
                  style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
                >
                  <Trash2 size={12} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }} />
            <TouchableOpacity
              onPress={() => { setShowSemesterPicker(false); setShowAddSemester(true); }}
              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Text style={{ fontSize: 12, color: '#4F6EF7', fontWeight: '600' }}>+ 새 학기 추가</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 수업 상세 바텀시트 */}
      {selectedClass && (
        <>
          <Pressable style={backdropStyle} onPress={() => setSelectedClass(null)} />
          <View className="bg-white px-6 pt-6" style={bottomSheetStyle}>
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-5" style={{ gap: 12 }}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                <Book size={18} color="#4F6EF7" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{selectedClass.courseName}</Text>
                <Text className="text-sm text-gray-400 mt-0.5">{selectedClass.buildingName}</Text>
              </View>
            </View>
            <View className="bg-gray-50 rounded-2xl p-4 mb-5" style={{ gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <Clock size={16} color="#9CA3AF" />
                <Text className="text-sm text-gray-700">
                  {DAYS.find(d => d.key === selectedClass.dayOfWeek)?.label}요일{' '}
                  {selectedClass.startTime.substring(0, 5)} - {selectedClass.endTime.substring(0, 5)}
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 12 }}>
                <MapPin size={16} color="#9CA3AF" />
                <Text className="text-sm text-gray-700">{selectedClass.roomName}</Text>
              </View>
            </View>
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => handleDeleteClass(selectedClass.courseId)}
                disabled={isSyncing}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#FEF2F2' }}
              >
                {isSyncing
                  ? <ActivityIndicator color="#EF4444" />
                  : <Text className="text-sm font-bold" style={{ color: '#EF4444' }}>삭제</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedClass(null)}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#4F6EF7' }}
              >
                <Text className="text-sm font-bold text-white">닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* draft 추가 확인 바텀시트 */}
      {draftCourse && !showAddClass && (
        <>
          <Pressable style={backdropStyle} onPress={handleCancelDraft} />
          <View className="bg-white px-6 pt-6" style={bottomSheetStyle}>
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-5" style={{ gap: 12 }}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                <Plus size={18} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{draftCourse.courseName}</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  {DAYS.find(d => d.key === draftCourse.dayOfWeek)?.label}요일{' '}
                  {draftCourse.startTime.substring(0, 5)} - {draftCourse.endTime.substring(0, 5)} · {draftCourse.roomName}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 mb-5">해당 강의를 시간표에 추가하시겠어요?</Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleCancelDraft}
                disabled={isSyncing}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text className="text-sm font-bold text-gray-500">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDraft}
                disabled={isSyncing}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#4F6EF7' }}
              >
                {isSyncing
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-sm font-bold text-white">추가하기</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* 학기 삭제 확인 바텀시트 */}
      {semesterToDelete && (
        <>
          <Pressable style={backdropStyle} onPress={() => setSemesterToDelete(null)} />
          <View className="bg-white px-6 pt-6" style={bottomSheetStyle}>
            <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
            <View className="flex-row items-center mb-5" style={{ gap: 12 }}>
              <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
                <Trash2 size={18} color="#EF4444" />
              </View>
              <View>
                <Text className="text-base font-bold text-gray-900">학기 삭제</Text>
                <Text className="text-sm text-gray-400 mt-0.5">
                  {semesterLabel(semesterToDelete.year, semesterToDelete.semester)}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-500 mb-5">
              해당 학기의 모든 강의가 삭제됩니다. 정말 삭제하시겠어요?
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSemesterToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#F3F4F6' }}
              >
                <Text className="text-sm font-bold text-gray-500">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteSemester}
                disabled={isDeleting}
                className="flex-1 py-3.5 rounded-2xl items-center justify-center"
                style={{ backgroundColor: '#EF4444' }}
              >
                {isDeleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-sm font-bold text-white">삭제하기</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Modals */}
      <AddSemesterSheet
        isVisible={showAddSemester}
        onCreated={handleSemesterCreated}
        onClose={() => setShowAddSemester(false)}
        existingSemesters={timetables.map(t => ({ year: t.year, semester: t.semester }))}
      />
      <CourseSearchModal
        isVisible={showAddClass}
        onSelect={handleSelectCourse}
        onClose={() => setShowAddClass(false)}
        year={activeSemester?.year ?? new Date().getFullYear()}
        semester={activeSemester?.semester ?? 1}
        existingCourses={savedCourses}
      />
    </View>
  );
}
