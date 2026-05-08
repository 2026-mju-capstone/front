import React, {useState, useMemo} from 'react';
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Platform
} from 'react-native';
import {Search, X, Plus, CheckCircle2} from 'lucide-react-native';
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
    const debouncedKeyword = useDebounce(keyword, 500);
    const {addCourse, draftCourses} = useTimetableStore();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useSearchCourses(year, semester, debouncedKeyword);

    const allCourses = useMemo(() => {
        return data?.pages.flatMap(page => page.content) || [];
    }, [data]);

    const handleAddCourse = (course: Course) => {
        const success = addCourse(course);
        if (success) {
            // 시각적 피드백을 위해 별도의 알림 대신 상태로 보여줄 수도 있지만, 
            // 현재는 간단히 Alert으로 유지하거나 아래 아이콘 변화로 대체
        } else {
            Alert.alert("중복 시간", "해당 시간에 이미 다른 강의가 있습니다.");
        }
    };

    const renderItem = ({item}: {item: Course}) => {
        const isAdded = draftCourses.some(c => c.courseId === item.courseId);
        
        return (
            <View style={styles.courseItem}>
                <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>
                        {item.courseName}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <Text style={styles.courseSubInfo}>
                            {item.buildingName} {item.roomName}
                        </Text>
                        <View style={styles.dot} />
                        <Text style={styles.courseSubInfo}>
                            {DAY_LABELS[item.dayOfWeek]} {item.startTime.substring(0, 5)} ~ {item.endTime.substring(0, 5)}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity 
                    style={[styles.addBtn, isAdded && styles.addedBtn]}
                    onPress={() => !isAdded && handleAddCourse(item)}
                    disabled={isAdded}
                >
                    {isAdded ? (
                        <CheckCircle2 size={20} color="#6366f1" />
                    ) : (
                        <Plus size={20} color="#6366f1" />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <Modal 
            visible={isVisible} 
            animationType="slide" 
            presentationStyle="pageSheet" // iOS에서 시각적으로 "더 높은" 느낌과 제스처 지원
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>강의 추가</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color="#111" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBarWrapper}>
                    <View style={styles.searchBar}>
                        <Search size={18} color="#999" />
                        <TextInput
                            placeholder="강의명 검색 (2글자 이상)"
                            style={styles.input}
                            value={keyword}
                            onChangeText={setKeyword}
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                        />
                    </View>
                </View>

                {/* Course List */}
                <FlatList
                    data={allCourses}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.courseId.toString()}
                    contentContainerStyle={{paddingBottom: insets.bottom + 20}}
                    onEndReached={() => {
                        if (hasNextPage) fetchNextPage();
                    }}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            {isLoading ? (
                                <ActivityIndicator color="#6366f1" />
                            ) : keyword.length < 2 ? (
                                <Text style={styles.emptyText}>검색어를 입력해주세요.</Text>
                            ) : (
                                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: '#111' },
    closeBtn: { padding: 4 },
    searchBarWrapper: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#f9fafb' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        fontFamily: fonts.regular,
        color: '#111',
    },
    courseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    courseInfo: { flex: 1, marginRight: 12 },
    courseName: { fontSize: 16, fontFamily: fonts.bold, color: '#111' },
    courseSubInfo: { fontSize: 12, fontFamily: fonts.regular, color: '#666' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ccc', marginHorizontal: 6 },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f3ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addedBtn: { backgroundColor: '#eef2ff' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
    emptyText: { fontSize: 14, fontFamily: fonts.medium, color: '#aaa', textAlign: 'center' },
});
