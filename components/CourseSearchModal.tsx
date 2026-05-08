import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Book, Plus, AlertCircle } from 'lucide-react-native';
import { useSearchCourses } from '@/hooks/queries/useTimetableQueries';
import { useDebounce } from '@/hooks/use-debounce';
import { useTimetableStore } from '@/store/timetableStore';
import { Course } from '@/api/types';

export interface CourseSearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  year: number;
  semester: number;
  onSelect: (course: Course) => void;
}

const DAY_LABELS: Record<string, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isDuplicate(cls: Course, existing: Course[]) {
  return existing.some((e) => e.courseId === cls.courseId);
}

function isTimeOverlap(cls: Course, existing: Course[]) {
  const clsStart = toMinutes(cls.startTime);
  const clsEnd = toMinutes(cls.endTime);
  return existing.some((e) => {
    if (e.dayOfWeek !== cls.dayOfWeek) return false;
    const eStart = toMinutes(e.startTime);
    const eEnd = toMinutes(e.endTime);
    return Math.max(clsStart, eStart) < Math.min(clsEnd, eEnd);
  });
}

export default function CourseSearchModal({
  isVisible,
  onClose,
  year,
  semester,
  onSelect,
}: CourseSearchModalProps) {
  const insets = useSafeAreaInsets();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 500);
  
  const { draftCourses } = useTimetableStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useSearchCourses(year, semester, debouncedKeyword);

  const allCourses = useMemo(() => {
    const list = data?.pages.flatMap((page) => page.content) || [];
    return [...list].sort((a, b) => {
      const aDup = isDuplicate(a, draftCourses);
      const bDup = isDuplicate(b, draftCourses);
      const aOverlap = !aDup && isTimeOverlap(a, draftCourses);
      const bOverlap = !bDup && isTimeOverlap(b, draftCourses);
      
      if (aDup !== bDup) return aDup ? 1 : -1;
      if (aOverlap !== bOverlap) return aOverlap ? 1 : -1;
      return 0;
    });
  }, [data, draftCourses]);

  const renderItem = ({ item }: { item: Course }) => {
    const dup = isDuplicate(item, draftCourses);
    const overlap = !dup && isTimeOverlap(item, draftCourses);
    const disabled = dup || overlap;
    const badge = dup ? "추가됨" : overlap ? "시간 겹침" : null;

    return (
      <TouchableOpacity
        onPress={() => !disabled && onSelect(item)}
        disabled={disabled}
        activeOpacity={0.7}
        className={`w-full flex-row items-center justify-between px-4 py-3.5 mb-2 rounded-xl border ${
          disabled ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'
        }`}
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${disabled ? 'bg-gray-100' : 'bg-indigo-50'}`}>
            <Book size={18} color={disabled ? '#9CA3AF' : '#4F6EF7'} />
          </View>
          <View className="flex-1">
            <Text className={`text-sm font-bold ${disabled ? 'text-gray-400' : 'text-gray-800'}`} numberOfLines={1}>
              {item.courseName}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
              {DAY_LABELS[item.dayOfWeek]} {item.startTime.substring(0, 5)}-{item.endTime.substring(0, 5)} · {item.roomName}
            </Text>
          </View>
        </View>

        {badge ? (
          <Text className="text-xs font-medium text-gray-300 whitespace-nowrap ml-2">
            {badge}
          </Text>
        ) : (
          <View className="w-8 h-8 rounded-full items-center justify-center bg-indigo-50 ml-2">
            <Plus size={16} color="#4F6EF7" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <Pressable className="absolute inset-0 bg-black/20" onPress={onClose} />
        
        <View 
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] px-6 pt-6 flex-col"
          style={{ maxHeight: '75%', paddingBottom: insets.bottom + 16 }}
        >
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
          <Text className="text-lg font-bold text-gray-900 mb-1">강의 추가</Text>
          <Text className="text-xs text-gray-400 mb-4">추가할 강의를 검색하거나 목록에서 선택하세요</Text>

          <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-3 mb-4 border border-gray-100">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-sm font-medium text-gray-900"
              placeholder="강의명 검색 (2글자 이상)"
              placeholderTextColor="#9CA3AF"
              value={keyword}
              onChangeText={setKeyword}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={allCourses}
            renderItem={renderItem}
            keyExtractor={(item) => item.courseId.toString()}
            showsVerticalScrollIndicator={false}
            className="flex-1 -mx-6 px-6"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                {isLoading ? (
                  <ActivityIndicator color="#4F6EF7" />
                ) : keyword.length < 2 ? (
                  <>
                    <Search size={28} color="#D1D5DB" className="mb-2" />
                    <Text className="text-sm text-gray-400">2글자 이상 검색어를 입력해주세요.</Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={28} color="#D1D5DB" className="mb-2" />
                    <Text className="text-sm text-gray-400">검색 결과가 없습니다.</Text>
                  </>
                )}
              </View>
            }
          />

          <TouchableOpacity 
            onPress={onClose} 
            className="w-full py-3.5 rounded-2xl bg-gray-100 items-center justify-center mt-2"
          >
            <Text className="text-sm font-bold text-gray-500">취소</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
