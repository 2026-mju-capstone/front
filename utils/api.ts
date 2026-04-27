import { VALIDATION_URL } from "@/constants/url";
import AsyncStorage from "@react-native-async-storage/async-storage"

export type RequestCallback = (response: Response) => void;

export const sendSessionRequest = async (url: string, body: string, callback: RequestCallback) => {
    const token: string | null = await AsyncStorage.getItem('token');

    if (!token)
        console.error('Session token is not stored');

    const response: Response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: body,
    });
    callback(response);
};

export const sendAnonymousRequest = async (url: string, body: string, callback: RequestCallback) => {
    const response: Response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body,
    });
    callback(response);
}

export const validateSessionToken = async () => {
    const token: string | null = await AsyncStorage.getItem('token');
    if (!token)
        return;
    sendSessionRequest(VALIDATION_URL, "", async (response: Response) => {
        if (response.ok) {
            const result = await response.json();
            AsyncStorage.setItem('token', result.data);
        } else {
            AsyncStorage.removeItem('token');
        }
    });
}
