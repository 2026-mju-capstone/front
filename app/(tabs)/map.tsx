import { fonts } from "@/constants/typography";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
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

type Item = {
  id: number;
  title: string;
  location: string;
  time: string;
  category: string;
};

type Building = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  items: Item[];
};

const BUILDINGS: Building[] = [
  {
    id: 1,
    name: "제1공학관",
    lat: 37.222690087856,
    lng: 127.18742790765737,
    items: [],
  },
  {
    id: 2,
    name: "제2공학관",
    lat: 37.221724937276406,
    lng: 127.18665371173557,
    items: [],
  },
  { id: 3, name: "제3공학관", lat: 37.2157, lng: 127.1827, items: [] },
  { id: 4, name: "제4공학관", lat: 37.2157, lng: 127.1827, items: [] },
  {
    id: 5,
    name: "제5공학관",
    lat: 37.222083935325806,
    lng: 127.18755316511282,
    items: [],
  },
  { id: 6, name: "명진당", lat: 37.2219, lng: 127.1889, items: [] },
  { id: 7, name: "함박관", lat: 37.2218, lng: 127.1889, items: [] },
  {
    id: 8,
    name: "학생회관",
    lat: 37.22347653798419,
    lng: 127.18724675644056,
    items: [],
  },
  {
    id: 9,
    name: "채플관",
    lat: 37.22395225229964,
    lng: 127.18698596085319,
    items: [],
  },
  { id: 10, name: "창조예술관", lat: 37.2235, lng: 127.1908, items: [] },
  { id: 11, name: "체육관", lat: 37.2224, lng: 127.1932, items: [] },
  { id: 12, name: "디자인관", lat: 37.2187, lng: 127.1853, items: [] },
  { id: 13, name: "방목기념관", lat: 37.2214, lng: 127.1889, items: [] },
  { id: 14, name: "산학협력관", lat: 37.221, lng: 127.1889, items: [] },
  { id: 15, name: "차세대과학관", lat: 37.221, lng: 127.1889, items: [] },
  {
    id: 16,
    name: "학생복지관",
    lat: 37.223225064054425,
    lng: 127.18672783025089,
    items: [],
  },
  {
    id: 17,
    name: "창업보육센터",
    lat: 37.22296024483864,
    lng: 127.18609901705975,
    items: [],
  },
  {
    id: 18,
    name: "명덕관",
    lat: 37.22411774471643,
    lng: 127.18197227736502,
    items: [],
  },
  {
    id: 19,
    name: "명현관",
    lat: 37.2235910492918,
    lng: 127.18170059088328,
    items: [],
  },
  {
    id: 20,
    name: "기숙사3동",
    lat: 37.22325923176217,
    lng: 127.18360400156415,
    items: [],
  },
  {
    id: 21,
    name: "기숙사4동",
    lat: 37.22384903960134,
    lng: 127.1838476843343,
    items: [],
  },
  {
    id: 22,
    name: "기숙사5동",
    lat: 37.223810131953854,
    lng: 127.18278843765323,
    items: [],
  },
  {
    id: 23,
    name: "복지동",
    lat: 37.22382278553236,
    lng: 127.18334621334833,
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
  const bottomSheetRef = useRef<BottomSheet>(null);
  const webViewRef = useRef<WebView>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
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
      .pin-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        position: relative;
        padding: 12px;
        margin: -12px;
      }
      .pin-circle {
        width: 12px; height: 12px;
        border-radius: 50%;
        border: 2.5px solid #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 700;
        color: #fff;
      }
      .pin-circle.has-items { background: #4F6EF7; }
      .pin-circle.no-items { background: #C0C0C0; }
      .pin-label {
        display: none;
        position: absolute;
        bottom: 36px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff;
        border-radius: 10px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        color: #111;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }
      .pin-label.visible { display: block; }
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
      var activeId = null;

      var CAMPUS_CENTER = new kakao.maps.LatLng(37.2243, 127.1886);
      var CAMPUS_BOUNDS = { minLat: 37.210, maxLat: 37.232, minLng: 127.175, maxLng: 127.220 };

      buildings.forEach(function(building) {
        var position = new kakao.maps.LatLng(building.lat, building.lng);
        var hasItems = building.items.length > 0;
        var circleClass = hasItems ? 'has-items' : 'no-items';
        var countText = hasItems ? building.items.length : '';

        var content =
          '<div class="pin-wrap" id="pin-' + building.id + '">' +
            '<div class="pin-label" id="label-' + building.id + '">' + building.name + '</div>' +
            '<div class="pin-circle ' + circleClass + '">' + countText + '</div>' +
          '</div>';

        var overlay = new kakao.maps.CustomOverlay({
          position: position,
          content: content,
          yAnchor: 1.0
        });
        overlay.setMap(map);
        overlays.push({ overlay: overlay, building: building });
      });

      function updateMyLocation(lat, lng) {
        if (myLocationOverlay) myLocationOverlay.setMap(null);
        var content = '<div style="width:14px;height:14px;background:#4F6EF7;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(79,110,247,0.25);"></div>';
        myLocationOverlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(lat, lng),
          content: content,
          zIndex: 10
        });
        myLocationOverlay.setMap(map);
      }

      // 빈 곳 터치 감지 - touchstart로 빠르게 반응
      document.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.pin-wrap')) {
          if (activeId !== null) {
            var prevLabel = document.getElementById('label-' + activeId);
            if (prevLabel) prevLabel.classList.remove('visible');
            activeId = null;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
        }
      }, { passive: true });

      kakao.maps.event.addListener(map, 'tilesloaded', function() {
        overlays.forEach(function(item) {
          item.overlay.setMap(map);
          var el = document.getElementById('pin-' + item.building.id);
          if (el) {
            el.addEventListener('click', function() {
              if (activeId !== null) {
                var prevLabel = document.getElementById('label-' + activeId);
                if (prevLabel) prevLabel.classList.remove('visible');
              }
              var label = document.getElementById('label-' + item.building.id);
              if (label) label.classList.add('visible');
              activeId = item.building.id;
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'BUILDING_CLICK', buildingId: item.building.id })
              );
            });
          }
        });
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
          bottomSheetRef.current?.snapToIndex(0);
        }
      } else if (data.type === "MAP_CLICK") {
        Keyboard.dismiss();
        bottomSheetRef.current?.snapToIndex(-1);
        setSelectedBuilding(null);
      }
    } catch (e) {}
  }, []);

  return (
    <View style={styles.container}>
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

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/lost-item-register")}
        >
          <Plus size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.locationBtn} onPress={moveToMyLocation}>
          <Crosshair size={18} color={userLocation ? "#4F6EF7" : "#aaa"} />
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["18%", "70%"]}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.indicator}
        style={styles.bottomSheetShadow}
        onClose={() => setSelectedBuilding(null)}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {selectedBuilding && (
            <>
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
                    bottomSheetRef.current?.snapToIndex(-1);
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
                selectedBuilding.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => router.push("/lost-item-detail")}
                  >
                    <View
                      style={[
                        styles.itemThumb,
                        {
                          backgroundColor: categoryColor[item.category] + "15",
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>
                        {categoryEmoji[item.category] ?? "📦"}
                      </Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemCategory}>
                        {item.category} · {item.time}
                      </Text>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>{item.location}</Text>
                    </View>
                    <ChevronRight size={16} color="#ccc" />
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
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
