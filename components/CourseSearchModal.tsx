import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Book, Plus, AlertCircle } from 'lucide-react-native';
import { Course } from '@/api/types';
import { useSearchCourses } from '@/hooks/queries/useTimetableQueries';
import { useDebounce } from '@/hooks/use-debounce';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// 고정 요소(핸들바 + 제목 + 검색창 + 취소 버튼 + 패딩) 높이 근사값
const MODAL_FIXED_HEIGHT = 290; // 현재 290이 나왔으면 모달창 : 기기 화면 높이 비율을 구하고 그걸 토대로 어느 기기던지 유동적으로 적용 가능하게 높이를 읽어서 불러오는 방식으로

const DAY_LABELS: Record<string, string> = {
  MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금', SAT: '토', SUN: '일',
};

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isDuplicate(cls: Course, existing: Course[]) {
  return existing.some(e => e.courseId === cls.courseId);
}

function isTimeOverlap(cls: Course, existing: Course[]) {
  return existing.some((e) =>
    cls.schedules.some(clsSlot =>
      e.schedules.some(eSlot => {
        if (eSlot.dayOfWeek !== clsSlot.dayOfWeek) return false;
        const clsStart = timeToMinutes(clsSlot.startTime);
        const clsEnd = timeToMinutes(clsSlot.endTime);
        const eStart = timeToMinutes(eSlot.startTime);
        const eEnd = timeToMinutes(eSlot.endTime);
        return Math.max(clsStart, eStart) < Math.min(clsEnd, eEnd);
      })
    )
  );
}

export interface CourseSearchModalProps {
  isVisible: boolean;
  onSelect: (cls: Course) => void;
  onClose: () => void;
  year: number;
  semester: number;
  existingCourses: Course[];
}

export default function CourseSearchModal({
  isVisible,
  onSelect,
  onClose,
  year,
  semester,
  existingCourses,
}: CourseSearchModalProps) {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const debouncedKeyword = useDebounce(keyword, 300);

  useEffect(() => {
    if (!isVisible) {
      setKeyword('');
      setKeyboardHeight(0);
    }
  }, [isVisible]);

  // KeyboardAvoidingView 대신 직접 키보드 높이를 추적
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useSearchCourses(year, semester, debouncedKeyword);

  const allCourses = useMemo(() => {
    const list = data?.pages.flatMap(page => page.content) ?? [];
    return [...list].sort((a, b) => {
      const aDup = isDuplicate(a, existingCourses);
      const bDup = isDuplicate(b, existingCourses);
      const aOverlap = !aDup && isTimeOverlap(a, existingCourses);
      const bOverlap = !bDup && isTimeOverlap(b, existingCourses);
      if (aDup !== bDup) return aDup ? 1 : -1;
      if (aOverlap !== bOverlap) return aOverlap ? 1 : -1;
      return 0;
    });
  }, [data, existingCourses]);

  // 키보드가 올라오면 리스트 영역을 줄여서 모달이 화면을 벗어나지 않도록 함
  const listMaxHeight = keyboardHeight > 0
    ? Math.max(120, SCREEN_HEIGHT - keyboardHeight - MODAL_FIXED_HEIGHT)
    : SCREEN_HEIGHT * 0.38;

  const renderItem = ({ item }: { item: Course }) => {
    const dup = isDuplicate(item, existingCourses);
    const overlap = !dup && isTimeOverlap(item, existingCourses);
    const disabled = dup || overlap;
    const badge = dup ? '추가됨' : overlap ? '시간 겹침' : null;

    return (
      <TouchableOpacity
        onPress={() => !disabled && onSelect(item)}
        disabled={disabled}
        activeOpacity={0.7}
        className="flex-row items-center justify-between px-4 py-3.5 mb-2 rounded-xl"
        style={{
          backgroundColor: disabled ? '#F9FAFB' : '#fff',
          borderWidth: 1,
          borderColor: disabled ? '#F3F4F6' : '#E5E7EB',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: disabled ? '#F3F4F6' : '#EEF2FF' }}
          >
            <Book size={18} color={disabled ? '#D1D5DB' : '#4F6EF7'} />
          </View>
          <View className="flex-1">
            <Text
              className="text-sm font-bold"
              style={{ color: disabled ? '#D1D5DB' : '#374151' }}
              numberOfLines={1}
            >
              {item.courseName}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
              {item.schedules.map(s => `${DAY_LABELS[s.dayOfWeek]} ${s.startTime.substring(0, 5)}-${s.endTime.substring(0, 5)}`).join(' / ')} · {item.roomName}
            </Text>
          </View>
        </View>
        {badge ? (
          <Text className="text-xs font-medium text-gray-300 ml-2">{badge}</Text>
        ) : (
          <View
            className="w-8 h-8 rounded-full items-center justify-center ml-2"
            style={{ backgroundColor: '#EEF2FF' }}
          >
            <Plus size={14} color="#4F6EF7" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}
        onPress={onClose}
      />
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View
          className="bg-white px-6 pt-6"
          style={{
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            // 키보드 높이만큼 위로 올림 → 키보드가 내려가면 자동으로 원위치
            marginBottom: keyboardHeight,
            paddingBottom: keyboardHeight > 0 ? 16 : (insets.bottom > 0 ? insets.bottom : 24),
          }}
        >
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
          <Text className="text-lg font-bold text-gray-900 mb-1">강의 추가</Text>
          <Text className="text-xs text-gray-400 mb-4">추가할 강의를 검색하거나 목록에서 선택하세요</Text>

          <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-3 mb-4 border border-gray-100">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-sm text-gray-900"
              placeholder="강의명 검색"
              placeholderTextColor="#9CA3AF"
              value={keyword}
              onChangeText={setKeyword}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* maxHeight로 결과 수에 따라 리스트 영역이 동적으로 늘어남 */}
          <FlatList
            data={allCourses}
            renderItem={renderItem}
            keyExtractor={(item) => item.courseId.toString()}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: listMaxHeight }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage
                ? <ActivityIndicator color="#4F6EF7" style={{ paddingVertical: 12 }} />
                : null
            }
            ListEmptyComponent={
              <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
                {isLoading ? (
                  <ActivityIndicator color="#4F6EF7" />
                ) : debouncedKeyword.length < 2 ? (
                  <>
                    <Search size={28} color="#D1D5DB" />
                    <Text className="text-sm text-gray-400 mt-2">강의명을 입력하면 자동으로 검색됩니다</Text>
                  </>
                ) : isError ? (
                  <>
                    <AlertCircle size={28} color="#FCA5A5" />
                    <Text className="text-sm text-red-400 mt-2">강의 목록을 불러오지 못했습니다</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={28} color="#D1D5DB" />
                    <Text className="text-sm text-gray-400 mt-2">검색 결과가 없습니다</Text>
                  </>
                )}
              </View>
            }
          />

          <TouchableOpacity
            onPress={onClose}
            className="w-full py-3.5 rounded-2xl items-center justify-center mt-2"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text className="text-sm font-bold text-gray-500">취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
