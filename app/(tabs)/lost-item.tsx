import { fonts } from "@/constants/typography";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin, Plus, Search, X } from "lucide-react-native";
import { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_OPTIONS = ["전체", "찾는중", "발견됨"];
const CATEGORY_OPTIONS = ["전체", "지갑", "전자기기", "의류", "신분증", "기타"];

const categoryColor: Record<string, string> = {
  지갑: "#f59e0b",
  전자기기: "#10b981",
  의류: "#f87171",
  신분증: "#6C8BFF",
  기타: "#a78bfa",
};

const categoryEmoji: Record<string, string> = {
  지갑: "💳",
  전자기기: "🎧",
  의류: "👕",
  신분증: "🪪",
  기타: "📦",
};

const DUMMY_ITEMS = [
  {
    id: 1,
    title: "검정 우산",
    category: "기타",
    location: "제1공학관 · 1층 로비",
    time: "2시간 전",
    status: "찾는중",
  },
  {
    id: 2,
    title: "학생증",
    category: "신분증",
    location: "제1공학관 · 3층 강의실",
    time: "1일 전",
    status: "찾는중",
  },
  {
    id: 3,
    title: "공학용 계산기",
    category: "전자기기",
    location: "제3공학관 · 2층 강의실",
    time: "1시간 전",
    status: "발견됨",
  },
  {
    id: 4,
    title: "텀블러",
    category: "기타",
    location: "제3공학관 · 3층 복도",
    time: "6시간 전",
    status: "찾는중",
  },
  {
    id: 5,
    title: "무선 마우스",
    category: "전자기기",
    location: "제3공학관 · 실습실 305",
    time: "1일 전",
    status: "발견됨",
  },
  {
    id: 6,
    title: "지갑",
    category: "지갑",
    location: "학생회관 · 1층",
    time: "3시간 전",
    status: "찾는중",
  },
  {
    id: 7,
    title: "패딩 점퍼",
    category: "의류",
    location: "명진당 · 2층",
    time: "2일 전",
    status: "찾는중",
  },
];

export default function LostItemBoard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const filtered = DUMMY_ITEMS.filter((item) => {
    const matchStatus = status === "전체" || item.status === status;
    const matchCategory = category === "전체" || item.category === category;
    const matchSearch =
      searchQuery === "" ||
      item.title.includes(searchQuery) ||
      item.location.includes(searchQuery);
    return matchStatus && matchCategory && matchSearch;
  });

  const DropdownModal = ({
    visible,
    options,
    selected,
    onSelect,
    onClose,
  }: {
    visible: boolean;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    onClose: () => void;
  }) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>선택</Text>
                <TouchableOpacity onPress={onClose}>
                  <X size={20} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.modalOption,
                      selected === option && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      onSelect(option);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selected === option && styles.modalOptionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                    {selected === option && (
                      <View style={styles.modalOptionDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>분실물 게시판</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchBar}>
        <Search size={15} color="#aaa" />
        <TextInput
          style={styles.searchInput}
          placeholder="제목, 장소 검색"
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={{ fontSize: 18, color: "#aaa" }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 드롭다운 필터 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            status !== "전체" && styles.filterBtnActive,
          ]}
          onPress={() => setShowStatusModal(true)}
        >
          <Text
            style={[
              styles.filterBtnText,
              status !== "전체" && styles.filterBtnTextActive,
            ]}
          >
            {status === "전체" ? "상태" : status}
          </Text>
          <ChevronDown
            size={14}
            color={status !== "전체" ? "#4F6EF7" : "#aaa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            category !== "전체" && styles.filterBtnActive,
          ]}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text
            style={[
              styles.filterBtnText,
              category !== "전체" && styles.filterBtnTextActive,
            ]}
          >
            {category === "전체" ? "카테고리" : category}
          </Text>
          <ChevronDown
            size={14}
            color={category !== "전체" ? "#4F6EF7" : "#aaa"}
          />
        </TouchableOpacity>

        {(status !== "전체" || category !== "전체") && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setStatus("전체");
              setCategory("전체");
            }}
          >
            <Text style={styles.resetBtnText}>초기화</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 분실물 리스트 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>등록된 분실물이 없어요</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemCard}
            onPress={() => router.push("/lost-item-detail")}
          >
            <View
              style={[
                styles.itemThumb,
                {
                  backgroundColor:
                    (categoryColor[item.category] ?? "#aaa") + "20",
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>
                {categoryEmoji[item.category] ?? "📦"}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <View style={styles.itemTopRow}>
                <Text
                  style={[
                    styles.itemCategory,
                    { color: categoryColor[item.category] ?? "#aaa" },
                  ]}
                >
                  {item.category}
                </Text>
                <Text
                  style={[
                    styles.itemStatus,
                    {
                      backgroundColor:
                        item.status === "발견됨" ? "#dcfce7" : "#fef3c7",
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.itemMetaRow}>
                <MapPin size={11} color="#aaa" />
                <Text style={styles.itemMeta}>
                  {item.location} · {item.time}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* 플로팅 버튼 */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => router.push("/lost-item-register")}
      >
        <Plus size={20} color="#fff" />
        <Text style={styles.fabText}>분실물 등록</Text>
      </TouchableOpacity>

      <DropdownModal
        visible={showStatusModal}
        options={STATUS_OPTIONS}
        selected={status}
        onSelect={setStatus}
        onClose={() => setShowStatusModal(false)}
      />
      <DropdownModal
        visible={showCategoryModal}
        options={CATEGORY_OPTIONS}
        selected={category}
        onSelect={setCategory}
        onClose={() => setShowCategoryModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: "#f5f6f8",
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#222",
    fontFamily: fonts.regular,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    alignItems: "center",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f6f8",
    borderWidth: 1.5,
    borderColor: "transparent",
    gap: 4,
  },
  filterBtnActive: { backgroundColor: "#EEF1FE", borderColor: "#4F6EF7" },
  filterBtnText: { fontSize: 13, fontFamily: fonts.medium, color: "#aaa" },
  filterBtnTextActive: { color: "#4F6EF7", fontFamily: fonts.bold },
  resetBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  resetBtnText: { fontSize: 12, color: "#aaa", fontFamily: fonts.regular },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemCategory: { fontSize: 11, fontFamily: fonts.regular, color: "#aaa" },
  itemStatus: {
    fontSize: 11,
    fontFamily: fonts.medium,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    color: "#555",
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 4,
  },
  itemMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  itemMeta: { fontSize: 12, fontFamily: fonts.regular, color: "#aaa" },
  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4F6EF7",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
    shadowColor: "#4F6EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  modalOptionActive: { backgroundColor: "#f0f4ff" },
  modalOptionText: { fontSize: 15, fontFamily: fonts.regular, color: "#333" },
  modalOptionTextActive: { color: "#4F6EF7", fontFamily: fonts.bold },
  modalOptionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4F6EF7",
  },
});
