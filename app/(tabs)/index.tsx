import { fonts } from "@/constants/typography";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Crosshair,
  Plus,
  Search,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const KAKAO_API_KEY = "7488059674373cdf0eb9299fef1ec2ec";

const BUILDINGS = [
  {
    id: 1,
    name: "제1공학관",
    lat: 37.2231,
    lng: 127.1892,
    items: [
      {
        id: 1,
        title: "검정 우산",
        location: "1층 로비",
        time: "2시간 전",
        category: "우산",
      },
      {
        id: 2,
        title: "학생증",
        location: "3층 강의실",
        time: "1일 전",
        category: "지갑/카드",
      },
    ],
  },
  {
    id: 2,
    name: "제5공학관",
    lat: 37.2218,
    lng: 127.1901,
    items: [
      {
        id: 3,
        title: "에어팟 케이스",
        location: "2층 화장실",
        time: "3시간 전",
        category: "전자기기",
      },
    ],
  },
  {
    id: 3,
    name: "학생회관",
    lat: 37.2248,
    lng: 127.1878,
    items: [
      {
        id: 4,
        title: "빨간 머플러",
        location: "1층 식당",
        time: "30분 전",
        category: "의류",
      },
      {
        id: 5,
        title: "지갑",
        location: "2층 편의점",
        time: "5시간 전",
        category: "지갑/카드",
      },
    ],
  },
  {
    id: 4,
    name: "60주년기념관",
    lat: 37.2255,
    lng: 127.1883,
    items: [],
  },
];

const categoryColor: Record<string, string> = {
  우산: "#6C8BFF",
  "지갑/카드": "#f59e0b",
  전자기기: "#10b981",
  의류: "#f87171",
  가방: "#a78bfa",
};

const categoryEmoji: Record<string, string> = {
  우산: "☂️",
  "지갑/카드": "💳",
  전자기기: "🎧",
  의류: "👕",
  가방: "🎒",
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const webViewRef = useRef<WebView>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredBuildings =
    searchQuery.trim() === ""
      ? BUILDINGS
      : BUILDINGS.filter(
          (b) =>
            b.name.includes(searchQuery) ||
            b.items.some(
              (item) =>
                item.title.includes(searchQuery) ||
                item.category.includes(searchQuery),
            ),
        );

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (loc) =>
          setUserLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }),
      );
    })();
    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        updateMyLocation(${userLocation.lat}, ${userLocation.lng});
        true;
      `);
    }
  }, [userLocation]);

  const moveToMyLocation = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        map.setCenter(new kakao.maps.LatLng(${userLocation.lat}, ${userLocation.lng}));
        map.setLevel(3);
        true;
      `);
    }
  };

  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .pin-wrap { display: flex; flex-direction: column; align-items: center; cursor: pointer; }
    .pin-body { background: #fff; border-radius: 20px; padding: 5px 10px; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .pin-body.empty { opacity: 0.5; }
    .pin-dot { width: 6px; height: 6px; border-radius: 50%; background: #4F6EF7; flex-shrink: 0; }
    .pin-dot.empty { background: #aaa; }
    .pin-name { font-size: 11px; font-weight: 700; color: #111; white-space: nowrap; }
    .pin-name.empty { color: #aaa; }
    .pin-count { font-size: 11px; color: #4F6EF7; font-weight: 700; }
    .pin-tail { width: 7px; height: 7px; background: #fff; transform: rotate(45deg); margin-top: -4px; box-shadow: 1px 1px 3px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}&autoload=true"></script>
  <script>
    var map = new kakao.maps.Map(document.getElementById('map'), {
      center: new kakao.maps.LatLng(37.2243, 127.1886),
      level: 4
    });

    var buildings = ${JSON.stringify(filteredBuildings)};
    var overlays = [];
    var myLocationOverlay = null;

    var CAMPUS_CENTER = new kakao.maps.LatLng(37.2243, 127.1886);
    var CAMPUS_BOUNDS = { minLat: 37.218, maxLat: 37.232, minLng: 127.183, maxLng: 127.196 };

    buildings.forEach(function(building) {
      var isEmpty = building.items.length === 0;
      var position = new kakao.maps.LatLng(building.lat, building.lng);
      var content =
        '<div class="pin-wrap" id="pin-' + building.id + '">' +
          '<div class="pin-body' + (isEmpty ? ' empty' : '') + '">' +
            '<div class="pin-dot' + (isEmpty ? ' empty' : '') + '"></div>' +
            '<span class="pin-name' + (isEmpty ? ' empty' : '') + '">' + building.name + '</span>' +
            (isEmpty ? '' : '<span class="pin-count">' + building.items.length + '</span>') +
          '</div>' +
          '<div class="pin-tail"></div>' +
        '</div>';
      var overlay = new kakao.maps.CustomOverlay({ position: position, content: content, yAnchor: 1.0 });
      overlay.setMap(map);
      overlays.push({ overlay: overlay, building: building });
    });

    function updateMyLocation(lat, lng) {
      if (myLocationOverlay) myLocationOverlay.setMap(null);
      var content = '<div style="width:14px;height:14px;background:#4F6EF7;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 0 4px rgba(79,110,247,0.25);"></div>';
      myLocationOverlay = new kakao.maps.CustomOverlay({ position: new kakao.maps.LatLng(lat, lng), content: content, zIndex: 10 });
      myLocationOverlay.setMap(map);
    }

    kakao.maps.event.addListener(map, 'tilesloaded', function() {
      overlays.forEach(function(item) {
        var el = document.getElementById('pin-' + item.building.id);
        if (el) {
          el.addEventListener('click', function() {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'BUILDING_CLICK', buildingId: item.building.id })
            );
          });
        }
      });
    });

    kakao.maps.event.addListener(map, 'click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
    });

    kakao.maps.event.addListener(map, 'dragend', function() {
      var center = map.getCenter();
      var lat = center.getLat();
      var lng = center.getLng();
      if (lat < CAMPUS_BOUNDS.minLat || lat > CAMPUS_BOUNDS.maxLat ||
          lng < CAMPUS_BOUNDS.minLng || lng > CAMPUS_BOUNDS.maxLng) {
        map.setCenter(CAMPUS_CENTER);
        map.setLevel(4);
      }
    });
  </script>
</body>
</html>
`;

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "BUILDING_CLICK") {
        Keyboard.dismiss();
        const building = BUILDINGS.find((b) => b.id === data.buildingId);
        if (building) {
          setSelectedBuilding(building);
          // 미니 카드로 먼저 열기
          bottomSheetRef.current?.present();
          bottomSheetRef.current?.snapToIndex(0);
        }
      } else if (data.type === "MAP_CLICK") {
        Keyboard.dismiss();
        bottomSheetRef.current?.dismiss();
        setSelectedBuilding(null);
      }
    } catch (e) {}
  }, []);

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>캠퍼스 분실물</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color="#444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <User size={20} color="#444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 지도 */}
        <View style={styles.mapContainer}>
          <WebView
            key={searchQuery}
            ref={webViewRef}
            style={styles.map}
            source={{ html: mapHTML }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
          />

          {searchFocused && (
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={Keyboard.dismiss}
              activeOpacity={1}
            />
          )}

          {/* 플로팅 검색바 */}
          <View style={styles.searchBar}>
            <Search size={15} color="#aaa" />
            <TextInput
              style={styles.searchInput}
              placeholder="찾으시는 물건이나 장소를 검색하세요"
              placeholderTextColor="#bbb"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              returnKeyType="search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit={true}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={{ fontSize: 18, color: "#aaa" }}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* + 버튼 */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push("/lost-item-register")}
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>

          {/* 내 위치 버튼 */}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={moveToMyLocation}
          >
            <Crosshair size={18} color={userLocation ? "#4F6EF7" : "#aaa"} />
          </TouchableOpacity>
        </View>

        <BottomSheetModal
          ref={bottomSheetRef}
          snapPoints={["18%", "70%"]}
          backgroundStyle={styles.bottomSheetBg}
          handleIndicatorStyle={styles.indicator}
          style={styles.bottomSheetShadow}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.bottomSheetContent}
          >
            {selectedBuilding && (
              <>
                {/* 건물명 헤더 */}
                <View style={styles.buildingHeader}>
                  <View>
                    <Text style={styles.buildingName}>
                      {selectedBuilding.name}
                    </Text>
                    <Text style={styles.buildingCount}>
                      분실물 {selectedBuilding.items.length}건
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => {
                      bottomSheetRef.current?.dismiss();
                      router.push("/(tabs)/lost-item");
                    }}
                  >
                    <Text style={styles.moreBtnText}>전체보기</Text>
                    <ChevronRight size={14} color="#4F6EF7" />
                  </TouchableOpacity>
                </View>

                {selectedBuilding.items.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>등록된 분실물이 없어요</Text>
                  </View>
                ) : (
                  selectedBuilding.items.map((item: any) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemCard}
                      onPress={() => router.push("/lost-item-detail")}
                    >
                      {/* 이모지 썸네일 */}
                      <View
                        style={[
                          styles.itemThumb,
                          {
                            backgroundColor:
                              categoryColor[item.category] + "15",
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 22 }}>
                          {categoryEmoji[item.category] ?? "📦"}
                        </Text>
                      </View>
                      {/* 내용 */}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemCategory}>
                          {item.category} · {item.time}
                        </Text>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemMeta}>{item.location}</Text>
                      </View>
                      {/* 화살표 */}
                      <ChevronRight size={16} color="#ccc" />
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
    </BottomSheetModalProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, color: "#111", fontFamily: fonts.bold },
  headerIcons: { flexDirection: "row", gap: 6 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f5f6f8",
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: { flex: 1, position: "relative" },
  map: { flex: 1 },
  searchBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#222",
    fontFamily: fonts.regular,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#4F6EF7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F6EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  locationBtn: {
    position: "absolute",
    bottom: 20,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomSheetBg: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  indicator: { backgroundColor: "#ddd", width: 40 },
  bottomSheetContent: { paddingHorizontal: 20, paddingBottom: 40 },
  bottomSheetShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  buildingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 4,
  },
  buildingName: { fontSize: 16, fontFamily: fonts.bold, color: "#111" },
  buildingCount: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginTop: 2,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#f0f4ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  moreBtnText: { fontSize: 12, color: "#4F6EF7", fontFamily: fonts.medium },
  emptyBox: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: "#aaa", fontFamily: fonts.regular },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemCategory: {
    fontSize: 11,
    color: "#aaa",
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#222",
    marginBottom: 2,
  },
  itemMeta: { fontSize: 12, fontFamily: fonts.regular, color: "#aaa" },
});
