import {ROUTES} from "@/constants/url";
import {Redirect} from "expo-router";
import {useAuthStore} from "@/store/authStore";

export default function Index() {
    const {token, isInitialized} = useAuthStore();

    // 초기화 전에는 아무것도 하지 않음
    if (!isInitialized) return null;

    // 토큰 유무에 따라 초기 경로 결정
    return <Redirect href={token ? ROUTES.MAP : ROUTES.LOGIN}/>;
}
