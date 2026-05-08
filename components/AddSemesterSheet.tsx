import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Plus } from 'lucide-react-native';
import { TimetableSummary } from '@/api/types';
import { useCreateTimetable } from '@/hooks/mutations/useTimetableMutations';

const YEARS = ['2024', '2025', '2026', '2027'];
const TERMS = ['1학기', '2학기', '여름학기', '겨울학기'];
const TERM_TO_SEMESTER: Record<string, number> = {
  '1학기': 1,
  '2학기': 2,
  '여름학기': 3,
  '겨울학기': 4,
};

export interface AddSemesterSheetProps {
  isVisible: boolean;
  onCreated: (timetable: TimetableSummary) => void;
  onClose: () => void;
  existingSemesters: Array<{ year: number; semester: number }>;
}

export default function AddSemesterSheet({
  isVisible,
  onCreated,
  onClose,
  existingSemesters,
}: AddSemesterSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedYear, setSelectedYear] = useState('2025');
  const { mutate: createTimetable, isPending } = useCreateTimetable();

  const availableTerms = TERMS.map((term) => {
    const semesterNum = TERM_TO_SEMESTER[term];
    const yearNum = parseInt(selectedYear, 10);
    const exists = existingSemesters.some(e => e.year === yearNum && e.semester === semesterNum);
    return { term, semesterNum, label: `${selectedYear}년 ${term}`, exists };
  });

  function handleAdd(semesterNum: number) {
    const yearNum = parseInt(selectedYear, 10);
    createTimetable(
      { name: '내 시간표', year: yearNum, semester: semesterNum },
      {
        onSuccess: (timetable) => {
          onCreated(timetable);
          onClose();
        },
      }
    );
  }

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
            maxHeight: '70%',
            paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
          }}
        >
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
          <Text className="text-lg font-bold text-gray-900 mb-1">새 학기 추가</Text>
          <Text className="text-xs text-gray-400 mb-4">추가할 학기를 선택해주세요</Text>

          {/* 연도 탭 */}
          <View className="flex-row mb-4" style={{ gap: 8 }}>
            {YEARS.map((y) => (
              <TouchableOpacity
                key={y}
                onPress={() => setSelectedYear(y)}
                className="flex-1 py-2 rounded-xl items-center justify-center"
                style={{ backgroundColor: selectedYear === y ? '#4F6EF7' : '#F3F4F6' }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: selectedYear === y ? '#fff' : '#9CA3AF' }}
                >
                  {y}년
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 학기 리스트 */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 4, paddingBottom: 8 }}>
              {availableTerms.map(({ term, semesterNum, label, exists }) => (
                <TouchableOpacity
                  key={term}
                  onPress={() => !exists && !isPending && handleAdd(semesterNum)}
                  disabled={exists || isPending}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between px-4 py-3.5 rounded-xl"
                  style={{
                    backgroundColor: exists ? '#F9FAFB' : '#fff',
                    borderWidth: 1,
                    borderColor: exists ? '#F3F4F6' : '#E5E7EB',
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      className="w-9 h-9 rounded-lg items-center justify-center"
                      style={{ backgroundColor: exists ? '#F3F4F6' : '#EEF2FF' }}
                    >
                      <Calendar size={16} color={exists ? '#D1D5DB' : '#4F6EF7'} />
                    </View>
                    <View>
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: exists ? '#D1D5DB' : '#374151' }}
                      >
                        {term}
                      </Text>
                      <Text className="text-xs text-gray-400 mt-0.5">{label}</Text>
                    </View>
                  </View>
                  {exists ? (
                    <Text className="text-xs font-medium text-gray-300">추가됨</Text>
                  ) : (
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: '#EEF2FF' }}
                    >
                      {isPending ? (
                        <ActivityIndicator size="small" color="#4F6EF7" />
                      ) : (
                        <Plus size={14} color="#4F6EF7" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            disabled={isPending}
            className="w-full py-3.5 rounded-2xl items-center justify-center mt-4"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <Text className="text-sm font-bold text-gray-500">취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
