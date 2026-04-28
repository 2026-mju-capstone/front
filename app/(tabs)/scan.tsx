import { Camera } from "expo-camera";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function Scan() {
  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermissionsAsync();
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>스캔</Text>
    </View>
  );
}
