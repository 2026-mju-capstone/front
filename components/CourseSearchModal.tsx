import React, {useState, useMemo} from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Pressable,
    Alert
} from 'react-native';
import {Search, X, Plus} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSearchCourses} from '@/hooks/queries/useTimetableQueries';
import {useTimetableStore} from '@/store/timetableStore';
import {useDebounce} from '@/hooks/use-debounce';
import {Course} from '@/api/types';
import {fonts} from '@/constants/typography';

interface CourseSearchModalProps {
    isVisible: boolean;
    onClose: () => void;
    year: number;
    semester: number;
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

export default function CourseSearchModal({isVisible, onClose, year, semester}: CourseSearchModalProps) {
    const insets = useSafeAreaInsets();
    const [keyword, setKeyword] = useState('');
    const debouncedKeyword = useDebounce(keyword, 500); // 500ms 디바운스 적용
    const {addCourse} = useTimetableStore();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useSearchCourses(year, semester, debouncedKeyword);

    const allCourses = useMemo(() => {
        return data?.pages.flatMap(page => page.content) || [];
    }, [data]);

    const handleAddCourse = (course: Course) => {
        const success = addCourse(course);
        if (success) {
            Alert.alert("성공", `"${course.courseName}" 강의가 추가되었습니다.`);
        } else {
            Alert.alert("경고", "해당 시간에 이미 다른 강의가 있습니다.");
        }
    };

    const renderItem = ({item}: {item: Course}) => (
        <View className="flex-row items-center justify-between p-4 border-b border-gray-50 bg-white">
            <View className="flex-1 mr-4">
                <Text style={{fontFamily: fonts.bold}} className="text-base text-gray-900">
                    {item.courseName}
                </Text>
                <Text style={{fontFamily: fonts.regular}} className="text-xs text-indigo-600 mt-1">
                    {item.buildingName} {item.roomName}
                </Text>
                <Text style={{fontFamily: fonts.regular}} className="text-xs text-gray-500 mt-0.5">
                    {DAY_LABELS[item.dayOfWeek]} {item.startTime.substring(0, 5)} ~ {item.endTime.substring(0, 5)}
                </Text>
            </View>
            <TouchableOpacity 
                className="bg-indigo-50 p-2 rounded-full"
                onPress={() => handleAddCourse(item)}
            >
                <Plus size={20} color="#6366f1" />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={isVisible} animationType="slide" transparent={false}>
            <View style={{flex: 1, paddingTop: insets.top, backgroundColor: '#fff'}}>
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                    <Text style={{fontFamily: fonts.bold}} className="text-lg text-gray-900">강의 추가</Text>
                    <TouchableOpacity onPress={onClose} className="p-1">
                        <X size={24} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="px-4 py-3 bg-gray-50">
                    <View className="flex-row items-center bg-white px-3 py-2 rounded-xl border border-gray-200">
                        <Search size={18} color="#999" />
                        <TextInput
                            placeholder="강의명 검색 (2글자 이상)"
                            className="flex-1 ml-2 text-sm text-gray-900"
                            style={{fontFamily: fonts.regular}}
                            value={keyword}
                            onChangeText={setKeyword}
                            autoCorrect={false}
                        />
                        {keyword.length > 0 && (
                            <TouchableOpacity onPress={() => setKeyword('')}>
                                <X size={16} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Course List */}
                <FlatList
                    data={allCourses}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => `${item.courseId}-${index}`}
                    contentContainerStyle={{paddingBottom: insets.bottom + 20}}
                    onEndReached={() => {
                        if (hasNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            {isLoading ? (
                                <ActivityIndicator color="#6366f1" />
                            ) : keyword.length < 2 ? (
                                <Text style={{fontFamily: fonts.medium}} className="text-gray-400">검색어를 입력해주세요.</Text>
                            ) : (
                                <Text style={{fontFamily: fonts.medium}} className="text-gray-400">검색 결과가 없습니다.</Text>
                            )}
                        </View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View className="py-4">
                                <ActivityIndicator color="#6366f1" />
                            </View>
                        ) : null
                    }
                />
            </View>
        </Modal>
    );
}
