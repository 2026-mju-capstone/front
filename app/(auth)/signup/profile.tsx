import { fonts } from "@/constants/typography";
import { useRouter } from "expo-router";
import { ChevronDown, MapPin, Plus, Search, X } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TYPE_MAP: Record<string, string> = {
  LOST: "찾는중",
  FOUND: "발견됨",
};

const CATEGORY_MAP: Record<string, string> = {
  BOOK: "도서",
  ELECTRONICS: "전자기기",
  CLOTHING: "소지품",
  WALLET: "지갑/카드",
  ID_CARD: "지갑/카드",
  OTHER: "기타",
};

const CATEGORY_TO_API: Record<string, string> = {
  전체: "",
  도서: "BOOK",
  전자기기: "ELECTRONICS",
  의류: "CLOTHING",
  지갑: "WALLET",
  신분증: "ID_CARD",
  기타: "OTHER",
};

const STATUS_OPTIONS = ["전체", "찾는중", "발견됨"];
const CATEGORY_OPTIONS = [
  "전체",
  "도서",
  "전자기기",
  "의류",
  "지갑",
  "신분증",
  "기타",
];

const categoryBgColor: Record<string, string> = {
  도서: "#eff2ff",
  전자기기: "#ecfdf5",
  소지품: "#fef2f2",
  "지갑/카드": "#fffbeb",
  기타: "#f5f3ff",
};

const categoryEmoji: Record<string, string> = {
  도서: "📚",
  전자기기: "🎧",
  소지품: "👕",
  "지갑/카드": "💳",
  기타: "📦",
};

const statusDotColor: Record<string, string> = {
  LOST: "#f97316",
  FOUND: "#22c55e",
};

type Item = {
  id: number;
  type: string;
  status: string;
  category: string;
  color: string;
  image_url: string;
  location_name: string;
  reported_at: string;
  title: string;
};

const DUMMY_ITEMS: Item[] = [
  {
    id: 1,
    type: "FOUND",
    status: "FOUND",
    category: "ELECTRONICS",
    color: "",
    image_url: "",
    title: "삼성 갤럭시 버즈",
    location_name: "제1공학관 · 3층 강의실",
    reported_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 2,
    type: "LOST",
    status: "LOST",
    category: "WALLET",
    color: "",
    image_url: "",
    title: "검정 반지갑",
    location_name: "제3공학관 · 2층 복도",
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 3,
    type: "FOUND",
    status: "FOUND",
    category: "CLOTHING",
    color: "",
    image_url: "",
    title: "남색 후드티",
    location_name: "학생회관 · 1층 로비",
    reported_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 4,
    type: "LOST",
    status: "LOST",
    category: "BOOK",
    color: "",
    image_url: "",
    title: "자바의 정석",
    location_name: "도서관 · 4층 열람실",
    reported_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 5,
    type: "FOUND",
    status: "FOUND",
    category: "ID_CARD",
    color: "",
    image_url: "",
    title: "학생증",
    location_name: "명진당 · 정문 앞",
    reported_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  return `${day}일 전`;
}

export default function LostItemBoard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [items] = useState<Item[]>(DUMMY_ITEMS);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery("");
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start(() => setShowSearch(false));
    } else {
      setShowSearch(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: false,
      }).start(() => searchInputRef.current?.focus());
    }
  };

  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 46],
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const filtered = items.filter((item) => {
    const korCategory = CATEGORY_MAP[item.category] ?? "기타";
    const matchStatus = status === "전체" || TYPE_MAP[item.type] === status;
    const matchCategory =
      category === "전체" || CATEGORY_TO_API[category] === item.category;
    const matchSearch =
      searchQuery === "" ||
      item.title?.includes(searchQuery) ||
      korCategory.includes(searchQuery) ||
      item.location_name?.includes(searchQuery);
    return matchStatus && matchCategory && matchSearch;
  });

  const closeDropdowns = () => {
    setShowStatusDropdown(false);
    setShowCategoryDropdown(false);
  };

  return (
    <TouchableWithoutFeedback onPress={closeDropdowns}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>분실물 게시판</Text>
          <TouchableOpacity onPress={toggleSearch} style={styles.searchIconBtn}>
            {showSearch ? (
              <X size={20} color="#555" />
            ) : (
              <Search size={20} color="#555" />
            )}
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{
            height: searchHeight,
            opacity: searchOpacity,
            overflow: "hidden",
          }}
        >
          <View style={styles.searchBar}>
            <Search size={14} color="#bbb" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="물품명, 카테고리, 장소 검색"
              placeholderTextColor="#bbb"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={14} color="#aaa" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View style={styles.filterRow}>
          <View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                status !== "전체" && styles.filterBtnActive,
              ]}
              onPress={() => {
                setShowStatusDropdown((v) => !v);
                setShowCategoryDropdown(false);
              }}
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
                size={12}
                color={status !== "전체" ? "#6366f1" : "#999"}
              />
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.dropdown}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      status === option && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setStatus(option);
                      setShowStatusDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        status === option && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                category !== "전체" && styles.filterBtnActive,
              ]}
              onPress={() => {
                setShowCategoryDropdown((v) => !v);
                setShowStatusDropdown(false);
              }}
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
                size={12}
                color={category !== "전체" ? "#6366f1" : "#999"}
              />
            </TouchableOpacity>
            {showCategoryDropdown && (
              <View style={styles.dropdown}>
                {CATEGORY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      category === option && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setCategory(option);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        category === option && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {(status !== "전체" || category !== "전체") && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setStatus("전체");
                setCategory("전체");
              }}
            >
              <X size={11} color="#999" />
              <Text style={styles.resetBtnText}>초기화</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeDropdowns}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>등록된 분실물이 없어요</Text>
            </View>
          }
          renderItem={({ item }) => {
            const korCategory = CATEGORY_MAP[item.category] ?? "기타";
            const korStatus = TYPE_MAP[item.type] ?? item.type;
            const bgColor = categoryBgColor[korCategory] ?? "#f5f5f5";
            const dotColor = statusDotColor[item.type] ?? "#aaa";

            return (
              <TouchableOpacity
                style={styles.itemCard}
                onPress={() => {
                  closeDropdowns();
                  router.push(`/lost-item-detail?id=${item.id}`);
                }}
                activeOpacity={0.75}
              >
                <View style={[styles.itemThumb, { backgroundColor: bgColor }]}>
                  <Text style={{ fontSize: 26 }}>
                    {categoryEmoji[korCategory] ?? "📦"}
                  </Text>
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title || item.location_name}
                  </Text>
                  <View style={styles.itemMetaRow}>
                    <MapPin size={10} color="#bbb" />
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {item.location_name}
                    </Text>
                  </View>
                  <Text style={styles.itemTime}>
                    {timeAgo(item.reported_at)}
                  </Text>
                </View>

                <View style={styles.itemRight}>
                  <View style={styles.statusBadge}>
                    <View
                      style={[styles.statusDot, { backgroundColor: dotColor }]}
                    />
                    <Text style={styles.statusText}>{korStatus}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={() => router.push("/lost-item-register")}
        >
          <Plus size={18} color="#fff" />
          <Text style={styles.fabText}>분실물 등록</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontFamily: fonts.bold, color: "#111" },
  searchIconBtn: { padding: 4 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 42,
    backgroundColor: "#f5f6f8",
    borderRadius: 10,
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
    zIndex: 100,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 3,
  },
  filterBtnActive: { backgroundColor: "#eef2ff", borderColor: "#6366f1" },
  filterBtnText: { fontSize: 12, fontFamily: fonts.bold, color: "#999" },
  filterBtnTextActive: { color: "#6366f1" },
  dropdown: {
    position: "absolute",
    top: 38,
    left: 0,
    backgroundColor: "#fff",
    borderRadius: 10,
    minWidth: 110,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 11 },
  dropdownItemActive: { backgroundColor: "#eef2ff" },
  dropdownItemText: { fontSize: 13, fontFamily: fonts.bold, color: "#666" },
  dropdownItemTextActive: { color: "#6366f1" },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 3,
  },
  resetBtnText: { fontSize: 11, color: "#999", fontFamily: fonts.bold },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 10,
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontFamily: fonts.bold, color: "#111" },
  itemMetaRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  itemMeta: { fontSize: 12, fontFamily: fonts.regular, color: "#bbb", flex: 1 },
  itemTime: { fontSize: 11, fontFamily: fonts.regular, color: "#ccc" },

  itemRight: { alignItems: "flex-end" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: fonts.bold, color: "#555" },

  emptyBox: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },

  fab: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 14, fontFamily: fonts.bold, color: "#fff" },
});
