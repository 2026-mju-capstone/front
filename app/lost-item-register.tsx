import { BASE_BUILDINGS } from "@/constants/buildings";
import { CATEGORIES, COLORS } from "@/constants/categories";
import { fonts } from "@/constants/typography";
import { IMAGE_UPLOAD_URL, ITEMS_CREATE_URL } from "@/constants/url";
import { sendAccessRequest } from "@/utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

async function uploadImage(uri: string): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;

    const filename = uri.split("/").pop() ?? "photo.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";

    const formData = new FormData();
    formData.append("image", { uri, name: filename, type: mimeType } as any);

    const response = await fetch(IMAGE_UPLOAD_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const text = await response.text();
    if (!text) return null;

    const result = JSON.parse(text);
    return result.success ? (result.data?.image_url ?? null) : null;
  } catch {
    return null;
  }
}

type BottomSheetItem = { label: string; value: string };

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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [galleryPhotos, setGalleryPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [selectedUris, setSelectedUris] = useState<string[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      await MediaLibrary.requestPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  const locationLabel = type === "FOUND" ? "발견 위치" : "분실 위치";
  const timeLabel = type === "FOUND" ? "발견 시각" : "분실 시각";
  const categoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label ?? "";
  const colorLabel = COLORS.find((c) => c.value === color)?.label ?? "";

  const openPhotoModal = async () => {
    const { status, canAskAgain } =
      await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "사진 권한 필요",
        "설정에서 사진 접근 권한을 허용해주세요.",
        canAskAgain
          ? [{ text: "확인" }]
          : [
              { text: "취소", style: "cancel" },
              { text: "설정으로 이동", onPress: () => Linking.openSettings() },
            ],
      );
      return;
    }
    setSelectedUris([...photos]);
    setShowPhotoModal(true);
    await loadGallery();
  };

  const loadGallery = async (after?: string) => {
    const result = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: MediaLibrary.SortBy.creationTime,
      first: 60,
      after,
    });
    setGalleryPhotos((prev) =>
      after ? [...prev, ...result.assets] : result.assets,
    );
    setHasNextPage(result.hasNextPage);
    setEndCursor(result.endCursor);
  };

  const toggleSelect = (uri: string) => {
    setSelectedUris((prev) => {
      if (prev.includes(uri)) return prev.filter((u) => u !== uri);
      if (prev.length >= 3) {
        Alert.alert("최대 3장까지 선택할 수 있어요.");
        return prev;
      }
      return [...prev, uri];
    });
  };

  const openCamera = async () => {
    const { status, canAskAgain } =
      await ImagePicker.requestCameraPermissionsAsync();
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      if (photos.length >= 3) {
        Alert.alert("최대 3장까지 등록할 수 있어요.");
        return;
      }
      setPhotos((p) => [...p, result.assets[0].uri]);
      setShowPhotoModal(false);
    }
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
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (photos.length > 0) {
        const uploaded = await uploadImage(photos[0]);
        if (uploaded) {
          imageUrl = uploaded;
        } else {
          Alert.alert("이미지 업로드 실패", "사진 없이 등록할까요?", [
            {
              text: "취소",
              style: "cancel",
              onPress: () => setIsSubmitting(false),
            },
            { text: "등록하기", onPress: () => submitPost(undefined) },
          ]);
          return;
        }
      }
      await submitPost(imageUrl);
    } catch {
      Alert.alert("오류", "네트워크 오류가 발생했어요.");
      setIsSubmitting(false);
    }
  };

  const submitPost = async (imageUrl?: string) => {
    try {
      const body = {
        type,
        category,
        color,
        title: title.trim(),
        description: description.trim() || undefined,
        building_id: buildingId,
        detail_address: detail.trim() || undefined,
        reported_at: reportedAt.toISOString(),
        image_url: imageUrl,
      };
      await sendAccessRequest(
        ITEMS_CREATE_URL,
        JSON.stringify(body),
        async (res) => {
          const text = await res.text();
          if (!text) {
            Alert.alert("등록 실패", `서버 오류 (${res.status})`);
            return;
          }
          const result = JSON.parse(text);
          if (result.success) {
            const itemId = result.data?.itemId;
            if (itemId) router.replace(`/lost-item-detail?id=${itemId}`);
            else router.back();
          } else {
            Alert.alert("등록 실패", result.error ?? "다시 시도해주세요.");
          }
        },
      );
    } catch {
      Alert.alert("오류", "네트워크 오류가 발생했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBottomSheet = (
    visible: boolean,
    onClose: () => void,
    title: string,
    items: BottomSheetItem[],
    selectedValue: string,
    onSelect: (value: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose} />
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 360 }}
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.sheetItem,
                selectedValue === item.value && styles.sheetItemActive,
              ]}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.sheetItemText,
                  selectedValue === item.value && styles.sheetItemTextActive,
                ]}
              >
                {item.label}
              </Text>
              {selectedValue === item.value && (
                <Text style={styles.sheetItemCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>분실물 등록</Text>
        <View style={{ width: 36 }} />
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

          <View style={styles.section}>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoBox}>
                  <Image
                    source={{ uri }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  {i === 0 && (
                    <View style={styles.photoMainBadge}>
                      <Text style={styles.photoMainBadgeText}>대표</Text>
                    </View>
                  )}
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
                  onPress={openPhotoModal}
                >
                  <Camera size={24} color="#bbb" />
                  <Text style={styles.photoCount}>{photos.length}/3</Text>
                </TouchableOpacity>
              )}
            </View>
            {photos.length > 1 && (
              <Text style={styles.photoHint}>
                첫 번째 사진이 대표 이미지로 등록돼요
              </Text>
            )}
          </View>

          <View style={styles.rowSection}>
            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>
                카테고리 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  errors.category ? styles.inputBoxError : null,
                ]}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    category && styles.dropdownTextFilled,
                  ]}
                >
                  {categoryLabel || "선택"}
                </Text>
                <ChevronDown size={15} color="#bbb" />
              </TouchableOpacity>
              {errors.category ? (
                <Text style={styles.errorText}>{errors.category}</Text>
              ) : null}
            </View>

            <View style={styles.halfSection}>
              <Text style={styles.sectionTitle}>
                색상 <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dropdownBtn,
                  errors.color ? styles.inputBoxError : null,
                ]}
                onPress={() => setShowColorModal(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    color && styles.dropdownTextFilled,
                  ]}
                >
                  {colorLabel || "선택"}
                </Text>
                <ChevronDown size={15} color="#bbb" />
              </TouchableOpacity>
              {errors.color ? (
                <Text style={styles.errorText}>{errors.color}</Text>
              ) : null}
            </View>
          </View>

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locationLabel} <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[
                styles.inputBox,
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

      <View style={[styles.submitWrap, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.submitLoadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitText}>등록 중...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>등록하기</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showPhotoModal} animationType="slide">
        <View style={[styles.photoModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.photoModalHeader}>
            <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
              <X size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.photoModalTitle}>사진 선택</Text>
            <TouchableOpacity
              onPress={() => {
                setPhotos(selectedUris);
                setShowPhotoModal(false);
              }}
            >
              <Text
                style={[
                  styles.photoModalDone,
                  selectedUris.length > 0 && styles.photoModalDoneActive,
                ]}
              >
                완료 ({selectedUris.length}/3)
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ id: "camera", uri: "" }, ...galleryPhotos]}
            keyExtractor={(item) => item.id}
            numColumns={3}
            onEndReached={() => {
              if (hasNextPage) loadGallery(endCursor);
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            renderItem={({ item }) => {
              if (item.id === "camera") {
                return (
                  <TouchableOpacity
                    style={styles.cameraCell}
                    onPress={openCamera}
                  >
                    <Camera size={28} color="#888" />
                    <Text style={styles.cameraCellText}>카메라</Text>
                  </TouchableOpacity>
                );
              }
              const selectedIndex = selectedUris.indexOf(item.uri);
              const isSelected = selectedIndex !== -1;
              return (
                <TouchableOpacity
                  style={styles.galleryCell}
                  onPress={() => toggleSelect(item.uri)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.galleryCellImage}
                  />
                  {isSelected ? (
                    <View style={styles.galleryCellOverlay}>
                      <View style={styles.galleryCellBadge}>
                        <Text style={styles.galleryCellBadgeText}>
                          {selectedIndex + 1}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.galleryCellCircle} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>

      {renderBottomSheet(
        showCategoryModal,
        () => setShowCategoryModal(false),
        "카테고리 선택",
        CATEGORIES,
        category,
        (val) => {
          setCategory(val);
          setErrors((e) => ({ ...e, category: "" }));
        },
      )}

      {renderBottomSheet(
        showColorModal,
        () => setShowColorModal(false),
        "색상 선택",
        COLORS,
        color,
        (val) => {
          setColor(val);
          setErrors((e) => ({ ...e, color: "" }));
        },
      )}

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
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 360 }}
          >
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
          </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
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
  section: { marginBottom: 24 },
  rowSection: { flexDirection: "row", gap: 12, marginBottom: 24 },
  halfSection: { flex: 1 },
  sectionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 10,
  },
  required: { color: "#6366f1" },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: "#bbb",
    flex: 1,
  },
  dropdownTextFilled: { color: "#111" },
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
  photoMainBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "#6366f1",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoMainBadgeText: { fontSize: 10, fontFamily: fonts.bold, color: "#fff" },
  photoRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#00000066",
    borderRadius: 10,
    padding: 3,
  },
  photoCount: { fontSize: 12, color: "#bbb", fontFamily: fonts.regular },
  photoHint: {
    fontSize: 11,
    color: "#aaa",
    fontFamily: fonts.regular,
    marginTop: 8,
  },
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
  selectBox: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: "#bbb",
  },
  selectTextFilled: { color: "#111" },
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
  submitBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitText: { fontSize: 16, fontFamily: fonts.bold, color: "#fff" },
  photoModalContainer: { flex: 1, backgroundColor: "#fff" },
  photoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  photoModalTitle: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  photoModalDone: { fontSize: 14, fontFamily: fonts.bold, color: "#bbb" },
  photoModalDoneActive: { color: "#6366f1" },
  cameraCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: 1,
  },
  cameraCellText: { fontSize: 12, color: "#888", fontFamily: fonts.regular },
  galleryCell: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 1,
    position: "relative",
  },
  galleryCellImage: { width: "100%", height: "100%" },
  galleryCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  galleryCellBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryCellBadgeText: { fontSize: 12, fontFamily: fonts.bold, color: "#fff" },
  galleryCellCircle: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalOverlay: { flex: 1, backgroundColor: "#00000033" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
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
