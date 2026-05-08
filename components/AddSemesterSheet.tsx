import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Plus } from "lucide-react-native";

export interface AddSemesterSheetProps {
  isVisible: boolean;
  onAdd: (year: number, term: number) => void;
  onClose: () => void;
}

const YEARS = [2024, 2025, 2026, 2027];
const TERMS = [
  { label: "1학기", value: 1 },
  { label: "2학기", value: 2 },
];

export default function AddSemesterSheet({
  isVisible,
  onAdd,
  onClose,
}: AddSemesterSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedYear, setSelectedYear] = useState(2025);

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="absolute inset-0 bg-black/20" onPress={onClose} />
      
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 flex-col"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-5" />
        <Text className="text-lg font-bold text-gray-900 mb-1">새 시간표 추가</Text>
        <Text className="text-xs text-gray-400 mb-4">추가할 학기를 선택해주세요</Text>

        {/* 연도 탭 */}
        <View className="flex-row gap-2 mb-4">
          {YEARS.map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => setSelectedYear(y)}
              className={`flex-1 py-2 rounded-xl items-center justify-center ${
                selectedYear === y ? "bg-indigo-600" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedYear === y ? "text-white" : "text-gray-400"
                }`}
              >
                {y}년
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 학기 리스트 */}
        <ScrollView className="max-h-[300px] -mx-6 px-6">
          <View className="space-y-2">
            {TERMS.map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                onPress={() => onAdd(selectedYear, value)}
                activeOpacity={0.7}
                className="w-full flex-row items-center justify-between px-4 py-3.5 rounded-xl border bg-white border-gray-200 mb-2"
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-lg items-center justify-center mr-3 bg-indigo-50">
                    <Calendar size={18} color="#4F6EF7" />
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-gray-800">
                      {label}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {selectedYear}년 {label}
                    </Text>
                  </View>
                </View>

                <View className="w-8 h-8 rounded-full items-center justify-center bg-indigo-50">
                  <Plus size={16} color="#4F6EF7" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          onPress={onClose}
          className="w-full py-3.5 rounded-2xl bg-gray-100 items-center justify-center mt-2"
        >
          <Text className="text-sm font-bold text-gray-500">취소</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
