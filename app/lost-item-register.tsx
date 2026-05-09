import { imageService } from "@/api/services/image";
import { BASE_BUILDINGS } from "@/constants/buildings";
import { CATEGORIES, COLORS } from "@/constants/categories";
import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useItemMutations } from "@/hooks/mutations/useItemMutations";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import {
    Camera,
    ChevronDown,
    ChevronRight,
    MapPin,
    X
} from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 4) / 3;

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}. ${padTwo(d.getMonth() + 1)}. ${padTwo(d.getDate())}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  const ampm = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ampm} ${padTwo(hh)}:${padTwo(d.getMinutes())}`;
}

export default function LostItemRegister() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<"FOUND" | "LOST">("FOUND");
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [buildingId, setBuildingId] = useState<number | null>(null);
  const [buildingName, setBuildingName] = useState("");
  const [detail, setDetail] = useState("");
  const [reportedAt, setReportedAt] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>(
    [],
  );
  const [galleryEndCursor, setGalleryEndCursor] = useState<
    string | undefined
  >();
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createItemMutation = useItemMutations.useCreateItem();

  const locationLabel = type === "FOUND" ? "발견 위치" : "분실 위치";
  const timeLabel = type === "FOUND" ? "발견 시각" : "분실 시각";

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const selectedColor = COLORS.find((c) => c.value === color);

  const loadGalleryPhotos = async (cursor?: string) => {
    const { assets, endCursor, hasNextPage } =
      await MediaLibrary.getAssetsAsync({
        mediaType: "photo",
        first: 60,
        after: cursor,
        sortBy: MediaLibrary.SortBy.creationTime,
      });
    setGalleryPhotos((prev) => (cursor ? [...prev, ...assets] : assets));
    setGalleryEndCursor(endCursor);
    setHasMorePhotos(hasNextPage);
  };

  const openGallery = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("갤러리 권한 필요", "설정에서 갤러리 권한을 허용해주세요.", [
        { text: "취소", style: "cancel" },
        { text: "설정으로 이동", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    setSelectedAssets([]);
    setGalleryPhotos([]);
    setGalleryEndCursor(undefined);
    setHasMorePhotos(true);
    await loadGalleryPhotos();
    setShowGallery(true);
  };

  const openCamera = async () => {
    let { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
    if (status === "undetermined" || (status === "denied" && canAskAgain)) {
      const req = await ImagePicker.requestCameraPermissionsAsync();
      status = req.status;
      canAskAgain = req.canAskAgain;
    }
    if (status !== "granted") {
      Alert.alert(
        "카메라 권한 필요",
        "설정에서 카메라 권한을 허용해주세요.",
        canAskAgain
          ? [{ text: "확인" }]
          : [
              { text: "취소", style: "cancel" },
              { text: "설정으로 이동", onPress: () => Linking.openSettings() },
            ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      if (photos.length >= 3) {
        Alert.alert("최대 3장까지 등록할 수 있어요.");
        return;
      }
      setPhotos((p) => [...p, result.assets[0].uri]);
    }
  };

  const toggleAsset = (asset: MediaLibrary.Asset) => {
    const remaining = 3 - photos.length;
    const isSelected = selectedAssets.some((a) => a.id === asset.id);
    if (!isSelected && selectedAssets.length >= remaining) {
      Alert.alert(`최대 ${remaining}장까지 선택할 수 있어요.`);
      return;
    }
    setSelectedAssets((prev) =>
      isSelected ? prev.filter((a) => a.id !== asset.id) : [...prev, asset],
    );
  };

  const confirmGallery = () => {
    const uris = selectedAssets.map((a) => a.uri);
    setPhotos((prev) => [...prev, ...uris].slice(0, 3));
    setShowGallery(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!category) e.category = "카테고리를 선택해주세요";
    if (!color) e.color = "색상을 선택해주세요";
    if (!title.trim()) e.title = "제목을 입력해주세요";
    if (!buildingId) e.building = "위치를 선택해주세요";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    try {
      let image_url = "";
      if (photos.length > 0) {
        const uploadRes = await imageService.uploadImage("ITEM", photos[0]);
        if (uploadRes.success) {
          image_url = uploadRes.data.image_url;
        } else {
          Alert.alert(
            "이미지 업로드 실패",
            uploadRes.error ?? "다시 시도해주세요.",
          );
          return;
        }
      }
      createItemMutation.mutate(
        {
          type,
          category,
          color,
          title: title.trim(),
          description: description.trim() || "",
          building_id: buildingId!,
          detail_address: detail.trim() || "",
          reported_at: reportedAt.toISOString(),
          image_url,
        },
        {
          onSuccess: (result) => {
            if (result.success) {
              const itemId = result.data?.itemId;
              if (itemId)
                router.replace(`${ROUTES.LOST_ITEM_DETAIL}?id=${itemId}`);
              else router.back();
            } else {
              Alert.alert("등록 실패", result.error ?? "다시 시도해주세요.");
            }
          },
          onError: () => {
            Alert.alert("오류", "네트워크 오류가 발생했어요.");
          },
        },
      );
    } catch {
      Alert.alert("오류", "이미지 업로드 중 문제가 발생했습니다.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>분실물 등록</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* 탭 */}
          <View style={styles.tabRow}>
            {(["FOUND", "LOST"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, type === t && styles.tabActive]}
                onPress={() => {
                  setType(t);
                  setErrors({});
                }}
              >
                {type === t && <View style={styles.tabDot} />}
                <Text
                  style={[styles.tabText, type === t && styles.tabTextActive]}
                >
                  {t === "FOUND" ? "주웠어요" : "잃어버렸어요"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 사진 */}
          <View style={styles.section}>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoBox}>
                  <Image
                    source={{ uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() =>
                      setPhotos((p) => p.filter((_, j) => j !== i))
                    }
                  >
                    <X size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 3 && (
                <TouchableOpacity
                  style={styles.photoAdd}
                  onPress={() => {
                    Alert.alert(
                      "사진 등록",
                      "사진을 가져올 방법을 선택해주세요.",
                      [
                        { text: "카메라로 촬영", onPress: openCamera },
                        { text: "갤러리에서 선택", onPress: openGallery },
                        { text: "취소", style: "cancel" },
                      ],
                    );
                  }}
                >
                  <Camera size={24} color="#bbb" />
                  <Text style={styles.photoCount}>{photos.length}/3</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 카테고리 + 색상 한 줄 */}
          <View style={styles.section}>
            <View style={styles.rowSelects}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  카테고리 <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    errors.category ? styles.inputBoxError : null,
                  ]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      selectedCategory && styles.selectTextFilled,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCategory ? selectedCategory.label : "선택"}
                  </Text>
                  <ChevronDown size={14} color="#bbb" />
                </TouchableOpacity>
                {errors.category ? (
                  <Text style={styles.errorText}>{errors.category}</Text>
                ) : null}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  색상 <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectBox,
                    errors.color ? styles.inputBoxError : null,
                  ]}
                  onPress={() => setShowColorModal(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      selectedColor && styles.selectTextFilled,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedColor ? selectedColor.label : "선택"}
                  </Text>
                  <ChevronDown size={14} color="#bbb" />
                </TouchableOpacity>
                {errors.color ? (
                  <Text style={styles.errorText}>{errors.color}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* 물품명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              물품명 <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputBox,
                errors.title ? styles.inputBoxError : null,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="예) 검정색 장우산"
                placeholderTextColor="#bbb"
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  setErrors((e) => ({ ...e, title: "" }));
                }}
                maxLength={40}
              />
            </View>
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : null}
          </View>

          {/* 상세 설명 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>상세 설명</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={[
                  styles.input,
                  { height: 120, textAlignVertical: "top" },
                ]}
                placeholder={
                  type === "FOUND"
                    ? "어디서 어떻게 발견했는지, 어떤 특징이 있는지 자세히 알려주세요."
                    : "언제 어디서 잃어버렸는지, 어떤 특징이 있는지 자세히 알려주세요."
                }
                placeholderTextColor="#bbb"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={300}
              />
            </View>
            <Text style={styles.charCount}>{description.length}/300</Text>
          </View>

          {/* 위치 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locationLabel} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.selectBox,
                errors.building ? styles.inputBoxError : null,
              ]}
              onPress={() => setShowBuildingModal(true)}
            >
              <MapPin size={15} color="#bbb" />
              <Text
                style={[
                  styles.selectText,
                  buildingName && styles.selectTextFilled,
                  { flex: 1, marginLeft: 8 },
                ]}
              >
                {buildingName || "건물을 선택해주세요"}
              </Text>
              <ChevronRight size={15} color="#bbb" />
            </TouchableOpacity>
            {errors.building ? (
              <Text style={styles.errorText}>{errors.building}</Text>
            ) : null}
            <View style={[styles.inputBox, { marginTop: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="세부 위치 (예: 3층 강의실 입구)"
                placeholderTextColor="#bbb"
                value={detail}
                onChangeText={setDetail}
                maxLength={50}
              />
            </View>
          </View>

          {/* 날짜/시간 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {timeLabel} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.datetimeRow}>
              <TouchableOpacity
                style={[styles.datetimeBtn, { flex: 1.4 }]}
                onPress={() => setShowDateModal(true)}
              >
                <Text style={styles.datetimeText}>
                  {formatDate(reportedAt)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datetimeBtn, { flex: 1 }]}
                onPress={() => setShowTimeModal(true)}
              >
                <Text style={styles.datetimeText}>
                  {formatTime(reportedAt)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 등록 버튼 */}
      <View style={[styles.submitWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>등록하기</Text>
        </TouchableOpacity>
      </View>

      {/* 커스텀 갤러리 모달 */}
      <Modal visible={showGallery} animationType="slide">
        <View style={[styles.galleryContainer, { paddingTop: insets.top }]}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setShowGallery(false)}>
              <X size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>사진 선택</Text>
            <TouchableOpacity
              onPress={confirmGallery}
              disabled={selectedAssets.length === 0}
            >
              <Text
                style={[
                  styles.galleryDone,
                  selectedAssets.length === 0 && styles.galleryDoneDisabled,
                ]}
              >
                완료 ({selectedAssets.length}/{3 - photos.length})
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ id: "camera" }, ...galleryPhotos] as any[]}
            keyExtractor={(item) => item.id}
            numColumns={3}
            onEndReached={() => {
              if (hasMorePhotos && galleryEndCursor) {
                loadGalleryPhotos(galleryEndCursor);
              }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => {
              if (item.id === "camera") {
                return (
                  <TouchableOpacity
                    style={styles.galleryCamera}
                    onPress={async () => {
                      setShowGallery(false);
                      await openCamera();
                    }}
                  >
                    <Camera size={28} color="#888" />
                    <Text style={styles.galleryCameraText}>카메라</Text>
                  </TouchableOpacity>
                );
              }
              const asset = item as MediaLibrary.Asset;
              const selectedIndex = selectedAssets.findIndex(
                (a) => a.id === asset.id,
              );
              const isSelected = selectedIndex !== -1;

              return (
                <TouchableOpacity
                  style={styles.galleryItem}
                  onPress={() => toggleAsset(asset)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: asset.uri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                  {isSelected && <View style={styles.galleryOverlay} />}
                  <View
                    style={[
                      styles.galleryCheckBox,
                      isSelected && styles.galleryCheckBoxActive,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.galleryCheckNum}>
                        {selectedIndex + 1}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {/* 카테고리 바텀시트 */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>카테고리 선택</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.sheetItem,
                  category === cat.value && styles.sheetItemActive,
                ]}
                onPress={() => {
                  setCategory(cat.value);
                  setErrors((e) => ({ ...e, category: "" }));
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetItemText,
                    category === cat.value && styles.sheetItemTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
                {category === cat.value && (
                  <Text style={styles.sheetItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 색상 바텀시트 */}
      <Modal visible={showColorModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowColorModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>색상 선택</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.sheetItem,
                  color === c.value && styles.sheetItemActive,
                ]}
                onPress={() => {
                  setColor(c.value);
                  setErrors((e) => ({ ...e, color: "" }));
                  setShowColorModal(false);
                }}
              >
                <Text
                  style={[
                    styles.sheetItemText,
                    color === c.value && styles.sheetItemTextActive,
                  ]}
                >
                  {c.label}
                </Text>
                {color === c.value && (
                  <Text style={styles.sheetItemCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* 건물 선택 바텀시트 */}
      <Modal visible={showBuildingModal} transparent animationType="slide">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBuildingModal(false)}
        />
        <View
          style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>건물 선택</Text>
          {BASE_BUILDINGS.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.sheetItem,
                buildingId === b.id && styles.sheetItemActive,
              ]}
              onPress={() => {
                setBuildingId(b.id);
                setBuildingName(b.name);
                setShowBuildingModal(false);
                setErrors((e) => ({ ...e, building: "" }));
              }}
            >
              <Text
                style={[
                  styles.sheetItemText,
                  buildingId === b.id && styles.sheetItemTextActive,
                ]}
              >
                {b.name}
              </Text>
              {buildingId === b.id && (
                <Text style={styles.sheetItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {showDateModal && (
        <DateTimePicker
          value={reportedAt}
          mode="date"
          display="calendar"
          maximumDate={new Date()}
          onChange={(_, date) => {
            setShowDateModal(false);
            if (date) setReportedAt(date);
          }}
        />
      )}
      {showTimeModal && (
        <DateTimePicker
          value={reportedAt}
          mode="time"
          display="spinner"
          onChange={(_, date) => {
            setShowTimeModal(false);
            if (date) setReportedAt(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  backText: { fontSize: 28, color: "#333", lineHeight: 32 },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  scroll: { paddingHorizontal: 20 },
  tabRow: { flexDirection: "row", gap: 8, marginTop: 20, marginBottom: 24 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  tabActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  tabDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  tabText: { fontSize: 14, fontFamily: fonts.bold, color: "#aaa" },
  tabTextActive: { color: "#fff" },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 12,
  },
  required: { color: "#6366f1" },
  rowSelects: { flexDirection: "row", gap: 12 },
  photoRow: { flexDirection: "row", gap: 10 },
  photoAdd: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fafafa",
  },
  photoBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: { width: "100%", height: "100%" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#00000066",
    borderRadius: 10,
    padding: 3,
  },
  photoCount: { fontSize: 12, color: "#bbb", fontFamily: fonts.regular },
  selectBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "#bbb",
  },
  selectTextFilled: { color: "#111" },
  inputBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  inputBoxError: { borderColor: "#f87171" },
  input: { fontSize: 15, fontFamily: fonts.regular, color: "#111", padding: 0 },
  errorText: {
    fontSize: 12,
    color: "#f87171",
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  charCount: {
    fontSize: 11,
    color: "#bbb",
    fontFamily: fonts.regular,
    textAlign: "right",
    marginTop: 6,
  },
  datetimeRow: { flexDirection: "row", gap: 8 },
  datetimeBtn: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  datetimeText: { fontSize: 14, fontFamily: fonts.regular, color: "#111" },
  submitWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderTopColor: "#f0f0f0",
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  // 갤러리
  galleryContainer: { flex: 1, backgroundColor: "#fff" },
  galleryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  galleryTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  galleryDone: { fontSize: 15, fontFamily: fonts.bold, color: "#6366f1" },
  galleryDoneDisabled: { color: "#ccc" },
  galleryCamera: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: "#f5f6f8",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: 1,
  },
  galleryCameraText: { fontSize: 12, fontFamily: fonts.regular, color: "#888" },
  galleryItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 1,
    position: "relative",
  },
  galleryImage: { width: "100%", height: "100%" },
  galleryOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  galleryCheckBox: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryCheckBoxActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  galleryCheckNum: { fontSize: 12, fontFamily: fonts.bold, color: "#fff" },
  // 모달
  modalOverlay: { flex: 1, backgroundColor: "#00000033" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "70%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 12,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sheetItemActive: {
    backgroundColor: "#eef2ff",
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sheetItemText: { fontSize: 14, fontFamily: fonts.regular, color: "#444" },
  sheetItemTextActive: { color: "#6366f1", fontFamily: fonts.bold },
  sheetItemCheck: { fontSize: 14, color: "#6366f1", fontFamily: fonts.bold },
});
