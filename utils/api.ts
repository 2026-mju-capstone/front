import { VALIDATION_URL } from "@/constants/url";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export type RequestCallback = (response: Response) => void;

export const sendAccessRequest = async (
  url: string,
  body: string,
  callback: RequestCallback,
) => {
  const token: string | null = await AsyncStorage.getItem("token");

  if (!token) {
    router.replace("/(auth)/login");
    return;
  }

  const response: Response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body,
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
    return;
  }

  callback(response);
};

export const sendGetRequest = async (
  url: string,
  callback: RequestCallback,
) => {
  const token: string | null = await AsyncStorage.getItem("token");

  if (!token) {
    router.replace("/(auth)/login");
    return;
  }

  const response: Response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    await AsyncStorage.removeItem("token");
    router.replace("/(auth)/login");
    return;
  }

  callback(response);
};

export const sendAnonymousRequest = async (
  url: string,
  body: string,
  callback: RequestCallback,
) => {
  const response: Response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });
  callback(response);
};

export const validateAccessToken = async () => {
  const token: string | null = await AsyncStorage.getItem("token");
  if (!token) return;
  await sendAccessRequest(VALIDATION_URL, "", async (response: Response) => {
    if (response.ok) {
      const result = await response.json();
      AsyncStorage.setItem("token", result.data);
    } else {
      AsyncStorage.removeItem("token");
    }
  });
};
