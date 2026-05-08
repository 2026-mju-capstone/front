import { imageService } from "@/api/services/image";
import { BASE_BUILDINGS } from "@/constants/buildings";
import { CATEGORIES, COLORS } from "@/constants/categories";
import { fonts } from "@/constants/typography";
import { ROUTES } from "@/constants/url";
import { useItemMutations } from "@/hooks/mutations/useItemMutations";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, MapPin, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  Dimensions,
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

const {width: SCREEN_WIDTH} = Dimensions.get("window");

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
    const [isImagePickerLoading, setIsImagePickerLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createItemMutation = useItemMutations.useCreateItem();

    const locationLabel = type === "FOUND" ? "발견 위치" : "분실 위치";
    const timeLabel = type === "FOUND" ? "발견 시각" : "분실 시각";

    const openImagePicker = async () => {
        if (isImagePickerLoading) return;
        setIsImagePickerLoading(true);

        try {
            // 시스템 갤러리 UI 호출 (카메라 촬영 포함 여부는 OS 및 라이브러리 버전에 따라 다름)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                selectionLimit: 3 - photos.length,
                quality: 0.8,
            });

            if (!result.canceled) {
                const newPhotos = result.assets.map(asset => asset.uri);
                setPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("오류", "이미지를 불러오는 중 문제가 발생했습니다.");
        } finally {
            setIsImagePickerLoading(false);
        }
    };

    const openCamera = async () => {
        // 1. 카메라 권한 확인
        let {status, canAskAgain} = await ImagePicker.getCameraPermissionsAsync();

        if (status === "undetermined" || (status === "denied" && canAskAgain)) {
            const requestResult = await ImagePicker.requestCameraPermissionsAsync();
            status = requestResult.status;
            canAskAgain = requestResult.canAskAgain;
        }

        if (status !== "granted") {
            Alert.alert(
                "카메라 권한 필요",
                "설정에서 카메라 권한을 허용해주세요.",
                canAskAgain
                    ? [{text: "확인"}]
                    : [
                        {text: "취소", style: "cancel"},
                        {text: "설정으로 이동", onPress: () => Linking.openSettings()},
                    ],
            );
            return;
        }

        // 2. 카메라 실행
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            // 촬영한 사진을 갤러리에 저장하지 않음 (기본값 false)
        });

        if (!result.canceled) {
            if (photos.length >= 3) {
                Alert.alert("최대 3장까지 등록할 수 있어요.");
                return;
            }
            setPhotos((p) => [...p, result.assets[0].uri]);
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

        try {
            let image_url = "";
            if (photos.length > 0) {
                // 첫 번째 이미지만 업로드
                const uploadRes = await imageService.uploadImage("ITEM", photos[0]);
                if (uploadRes.success) {
                    image_url = uploadRes.data.image_url;
                } else {
                    Alert.alert("이미지 업로드 실패", uploadRes.error ?? "다시 시도해주세요.");
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
                            if (itemId) router.replace(`${ROUTES.LOST_ITEM_DETAIL}?id=${itemId}`);
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
        } catch (err) {
            console.log(err);
            Alert.alert("오류", "이미지 업로드 중 문제가 발생했습니다.");
        }
    };

    return (
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>분실물 등록</Text>
                <View style={{width: 28}}/>
            </View>

            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={[
                        styles.scroll,
                        {paddingBottom: insets.bottom + 100},
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
                                {type === t && <View style={styles.tabDot}/>}
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
                                        source={{uri}}
                                        style={styles.photoImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.photoRemove}
                                        onPress={() =>
                                            setPhotos((p) => p.filter((_, j) => j !== i))
                                        }
                                    >
                                        <X size={10} color="#fff"/>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {photos.length < 3 && (
                                <TouchableOpacity
                                    style={[styles.photoAdd, isImagePickerLoading && {opacity: 0.6}]}
                                    onPress={() => {
                                        Alert.alert(
                                            "사진 등록",
                                            "사진을 가져올 방법을 선택해주세요.",
                                            [
                                                {text: "카메라로 촬영", onPress: openCamera},
                                                {text: "갤러리에서 선택", onPress: openImagePicker},
                                                {text: "취소", style: "cancel"}
                                            ]
                                        );
                                    }}
                                    disabled={isImagePickerLoading}
                                >
                                    <Camera size={24} color="#bbb"/>
                                    <Text style={styles.photoCount}>{photos.length}/3</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* 카테고리 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            카테고리 <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.pillWrap}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.value}
                                    style={[
                                        styles.pill,
                                        category === cat.value && styles.pillActive,
                                    ]}
                                    onPress={() => {
                                        setCategory(cat.value);
                                        setErrors((e) => ({...e, category: ""}));
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            category === cat.value && styles.pillTextActive,
                                        ]}
                                    >
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.category ? (
                            <Text style={styles.errorText}>{errors.category}</Text>
                        ) : null}
                    </View>

                    {/* 색상 */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            색상 <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.pillWrap}>
                            {COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c.value}
                                    style={[styles.pill, color === c.value && styles.pillActive]}
                                    onPress={() => {
                                        setColor(c.value);
                                        setErrors((e) => ({...e, color: ""}));
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.pillText,
                                            color === c.value && styles.pillTextActive,
                                        ]}
                                    >
                                        {c.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.color ? (
                            <Text style={styles.errorText}>{errors.color}</Text>
                        ) : null}
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
                                    setErrors((e) => ({...e, title: ""}));
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
                                    {height: 120, textAlignVertical: "top"},
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
                                styles.inputBox,
                                styles.selectBox,
                                errors.building ? styles.inputBoxError : null,
                            ]}
                            onPress={() => setShowBuildingModal(true)}
                        >
                            <MapPin size={15} color="#bbb"/>
                            <Text
                                style={[
                                    styles.selectText,
                                    buildingName && styles.selectTextFilled,
                                ]}
                            >
                                {buildingName || "건물을 선택해주세요"}
                            </Text>
                            <ChevronRight size={15} color="#bbb"/>
                        </TouchableOpacity>
                        {errors.building ? (
                            <Text style={styles.errorText}>{errors.building}</Text>
                        ) : null}
                        <View style={[styles.inputBox, {marginTop: 8}]}>
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
                                style={[styles.datetimeBtn, {flex: 1.4}]}
                                onPress={() => setShowDateModal(true)}
                            >
                                <Text style={styles.datetimeText}>
                                    {formatDate(reportedAt)}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.datetimeBtn, {flex: 1}]}
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
            <View style={[styles.submitWrap, {paddingBottom: insets.bottom + 12}]}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                    <Text style={styles.submitText}>등록하기</Text>
                </TouchableOpacity>
            </View>

            {/* 건물 선택 모달 */}
            <Modal visible={showBuildingModal} transparent animationType="slide">
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowBuildingModal(false)}
                />
                <View
                    style={[styles.bottomSheet, {paddingBottom: insets.bottom + 16}]}
                >
                    <View style={styles.sheetHandle}/>
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
                                setErrors((e) => ({...e, building: ""}));
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
    container: {flex: 1, backgroundColor: "#fff"},
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f0f0f0",
    },
    backText: {fontSize: 28, color: "#333", lineHeight: 32},
    headerTitle: {fontSize: 16, fontFamily: fonts.bold, color: "#111"},
    scroll: {paddingHorizontal: 20},
    tabRow: {flexDirection: "row", gap: 8, marginTop: 20, marginBottom: 24},
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
    tabActive: {backgroundColor: "#6366f1", borderColor: "#6366f1"},
    tabDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff"},
    tabText: {fontSize: 14, fontFamily: fonts.bold, color: "#aaa"},
    tabTextActive: {color: "#fff"},
    section: {marginBottom: 28},
    sectionTitle: {
        fontSize: 15,
        fontFamily: fonts.bold,
        color: "#111",
        marginBottom: 12,
    },
    required: {color: "#6366f1"},
    photoRow: {flexDirection: "row", gap: 10},
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
    photoImage: {width: "100%", height: "100%"},
    photoRemove: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "#00000066",
        borderRadius: 10,
        padding: 3,
    },
    photoCount: {fontSize: 12, color: "#bbb", fontFamily: fonts.regular},
    pillWrap: {flexDirection: "row", flexWrap: "wrap", gap: 8},
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
    },
    pillActive: {backgroundColor: "#6366f1", borderColor: "#6366f1"},
    pillText: {fontSize: 14, fontFamily: fonts.regular, color: "#555"},
    pillTextActive: {color: "#fff", fontFamily: fonts.bold},
    inputBox: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    inputBoxError: {borderColor: "#f87171"},
    input: {fontSize: 15, fontFamily: fonts.regular, color: "#111", padding: 0},
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
    selectBox: {flexDirection: "row", alignItems: "center", gap: 8},
    selectText: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.regular,
        color: "#bbb",
    },
    selectTextFilled: {color: "#111"},
    datetimeRow: {flexDirection: "row", gap: 8},
    datetimeBtn: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: "#fff",
        alignItems: "center",
    },
    datetimeText: {fontSize: 14, fontFamily: fonts.regular, color: "#111"},
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
    submitText: {fontSize: 16, fontFamily: fonts.bold, color: "#fff"},
    modalOverlay: {flex: 1, backgroundColor: "#00000033"},
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
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    sheetItemActive: {
        backgroundColor: "#eef2ff",
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    sheetItemText: {fontSize: 14, fontFamily: fonts.regular, color: "#444"},
    sheetItemTextActive: {color: "#6366f1", fontFamily: fonts.bold},
});