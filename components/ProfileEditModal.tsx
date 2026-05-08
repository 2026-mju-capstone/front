import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import {
  X,
  Camera,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { UserProfile, UpdateProfileRequest } from "@/api/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/api/services/user";
import { DEPARTMENTS } from "@/constants/departments";

interface ProfileEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  profile: UserProfile | undefined;
}

export default function ProfileEditModal({
  isVisible,
  onClose,
  profile,
}: ProfileEditModalProps) {
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState(profile?.nickname || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [deptSearch, setDeptSearch] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      onClose();
    },
    onError: () => {
      Alert.alert("에러", "프로필 수정 중 오류가 발생했습니다.");
    },
  });

  useEffect(() => {
    if (isVisible && profile) {
      setNickname(profile.nickname);
      setDepartment(profile.department);
    }
  }, [isVisible, profile]);

  const handleSave = () => {
    if (!nickname.trim()) {
      Alert.alert("알림", "닉네임을 입력해주세요.");
      return;
    }
    updateMutation.mutate({
      nickname,
      department,
    });
  };

  const filteredDepts = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase()),
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/40"
      >
        <View className="bg-white rounded-t-[40px] h-[90%]">
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50">
            <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-pretendard-bold text-gray-900">
              프로필 수정
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={updateMutation.isPending}
              className="bg-indigo-600 px-5 py-2.5 rounded-full"
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-sm font-pretendard-bold text-white">
                  저장
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Section (Visual Only) */}
            <View className="items-center py-8">
              <View className="relative">
                <View className="w-24 h-24 rounded-full bg-indigo-50 items-center justify-center border-2 border-indigo-100 overflow-hidden">
                  <Text className="text-indigo-300 text-3xl font-pretendard-bold">
                    {nickname ? nickname[0] : "?"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Nickname Input */}
            <View className="mb-6">
              <Text className="text-xs font-pretendard-semibold text-gray-500 mb-2 ml-1">
                닉네임
              </Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="닉네임을 입력하세요"
                  className="flex-1 text-base font-pretendard-medium text-gray-900"
                  maxLength={20}
                />
                <Text className="text-[10px] text-gray-300 ml-2">
                  {nickname.length}/20
                </Text>
              </View>
            </View>

            {/* Department Selector */}
            <View className="mb-6">
              <Text className="text-xs font-pretendard-semibold text-gray-500 mb-2 ml-1">
                학과
              </Text>
              <TouchableOpacity
                onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                className="flex-row items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4"
              >
                <Text
                  className={`text-base font-pretendard-medium ${department ? "text-gray-900" : "text-gray-300"}`}
                >
                  {department || "학과를 선택하세요"}
                </Text>
                {showDeptDropdown ? (
                  <ChevronUp size={20} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>

              {showDeptDropdown && (
                <View className="mt-2 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm max-h-64">
                  <View className="flex-row items-center bg-gray-50 border-b border-gray-50 px-4 py-2">
                    <Search size={16} color="#9CA3AF" className="mr-2" />
                    <TextInput
                      value={deptSearch}
                      onChangeText={setDeptSearch}
                      placeholder="학과 검색..."
                      className="flex-1 h-10 text-sm font-pretendard-medium"
                    />
                  </View>
                  <ScrollView nestedScrollEnabled={true}>
                    {filteredDepts.map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        onPress={() => {
                          setDepartment(dept);
                          setShowDeptDropdown(false);
                          setDeptSearch("");
                        }}
                        className={`px-5 py-4 flex-row items-center justify-between ${department === dept ? "bg-indigo-50" : ""}`}
                      >
                        <Text
                          className={`text-sm font-pretendard-medium ${department === dept ? "text-indigo-600" : "text-gray-700"}`}
                        >
                          {dept}
                        </Text>
                        {department === dept && (
                          <Check size={16} color="#4F6EF7" />
                        )}
                      </TouchableOpacity>
                    ))}
                    {filteredDepts.length === 0 && (
                      <View className="py-8 items-center">
                        <Text className="text-sm font-pretendard-medium text-gray-400">
                          검색 결과가 없습니다.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Info Box */}
            <View className="bg-indigo-50 rounded-2xl p-4 flex-row mb-10 border border-indigo-100">
              <Info size={18} color="#4F6EF7" className="mr-2 mt-0.5" />
              <Text className="flex-1 text-xs font-pretendard-medium text-indigo-600 leading-5">
                수정된 정보는 게시판 및 채팅에서 상대방에게 노출될 수 있으니
                신중하게 작성해주세요.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
