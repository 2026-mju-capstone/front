import { fonts } from "@/constants/typography";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Bell, Crosshair, Plus, Search, User } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const KAKAO_API_KEY = "7488059674373cdf0eb9299fef1ec2ec";

// 명지대학교 자연캠퍼스 건물 목 데이터
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
      {
        id: 6,
        title: "갤럭시 버즈",
        location: "3층 휴게실",
        time: "2일 전",
        category: "전자기기",
      },
    ],
  },
  {
    id: 4,
    name: "60주년기념관",
    lat: 37.2255,
    lng: 127.1883,
    items: [
      {
        id: 7,
        title: "노트북 파우치",
        location: "세미나실",
        time: "4시간 전",
        category: "가방",
      },
    ],
  },
];

const categoryColor: Record<string, string> = {
  우산: "#6C8BFF",
  "지갑/카드": "#f59e0b",
  전자기기: "#10b981",
  의류: "#f87171",
  가방: "#a78bfa",
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

    var buildings = ${JSON.stringify(BUILDINGS)};

    buildings.forEach(function(building) {
      var position = new kakao.maps.LatLng(building.lat, building.lng);

      var content = '<div style="' +
        'background:#4F6EF7;' +
        'color:#fff;' +
        'padding:6px 12px;' +
        'border-radius:20px;' +
        'font-size:12px;' +
        'font-weight:bold;' +
        'white-space:nowrap;' +
        'box-shadow:0 2px 8px rgba(79,110,247,0.4);' +
        'cursor:pointer;' +
        '">' + building.name + ' ' + building.items.length + '개</div>';

      var overlay = new kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1.3
      });
      overlay.setMap(map);

      var el = overlay.getContent();
      setTimeout(function() {
        var node = document.querySelector('[title="' + building.name + '"]') || overlay.cc;
        overlay.getContent().addEventListener && overlay.getContent().addEventListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BUILDING_CLICK', buildingId: building.id }));
        });
      }, 500);

      kakao.maps.event.addListener(map, 'idle', function() {});
    });

    // overlay 클릭 이벤트 (동적 바인딩)
    setTimeout(function() {
      var overlayEls = document.querySelectorAll('#map div[style*="cursor:pointer"]');
      overlayEls.forEach(function(el, i) {
        el.addEventListener('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BUILDING_CLICK', buildingId: buildings[i].id }));
        });
      });
    }, 1000);
  </script>
</body>
</html>
`;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<
    (typeof BUILDINGS)[0] | null
  >(null);

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "BUILDING_CLICK") {
        const building = BUILDINGS.find((b) => b.id === data.buildingId);
        if (building) {
          setSelectedBuilding(building);
          bottomSheetRef.current?.present();
        }
      }
    } catch (e) {}
  }, []);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>캠퍼스 분실물</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={22} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <User size={22} color="#222" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색바 */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={16} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="찾으시는 물건이나 장소를 검색하세요"
            placeholderTextColor="#bbb"
          />
        </View>
      </View>

      {/* 지도 */}
      <WebView
        style={styles.map}
        source={{ html: mapHTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* + 버튼 */}
      <TouchableOpacity style={styles.fab}>
        <Plus size={26} color="#fff" />
      </TouchableOpacity>

      {/* 내 위치 버튼 */}
      <TouchableOpacity style={styles.locationBtn}>
        <Crosshair size={20} color="#4F6EF7" />
      </TouchableOpacity>

      {/* 바텀시트 */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={["45%", "80%"]}
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {selectedBuilding && (
            <>
              <Text style={styles.buildingName}>{selectedBuilding.name}</Text>
              <Text style={styles.buildingCount}>
                분실물 {selectedBuilding.items.length}건
              </Text>
              {selectedBuilding.items.map((item) => (
                <TouchableOpacity key={item.id} style={styles.itemCard}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: categoryColor[item.category] + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: categoryColor[item.category] },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.location} · {item.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
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
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: "#111",
  },
  headerIcons: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 6 },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f6f8",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    fontFamily: fonts.regular,
  },
  map: { flex: 1 },
  fab: {
    position: "absolute",
    bottom: 32,
    left: 24,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#4F6EF7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4F6EF7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  locationBtn: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 44,
    height: 44,
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
  bottomSheetBg: { borderRadius: 24 },
  indicator: { backgroundColor: "#ddd", width: 40 },
  bottomSheetContent: { paddingHorizontal: 20, paddingBottom: 40 },
  buildingName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: "#111",
    marginBottom: 4,
    marginTop: 8,
  },
  buildingCount: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: "#aaa",
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: "#f8f9ff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: "#222",
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: "#aaa",
  },
});
