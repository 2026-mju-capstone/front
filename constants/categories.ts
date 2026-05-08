import {
    Book,
    CreditCard,
    Headphones,
    Package,
    Umbrella,
} from "lucide-react-native";

export const CATEGORY_MAP: Record<string, string> = {
    SMARTPHONE: "스마트폰",
    EARPHONES: "이어폰",
    BAG: "가방",
    WALLET: "지갑",
    CREDIT_CARD: "카드",
    STUDENT_ID_CARD: "학생증",
    TEXTBOOK: "교재",
    NOTEBOOK: "노트",
    UMBRELLA: "우산",
    WATER_BOTTLE: "물병",
    PENCIL_CASE: "필통",
    PLUSH_TOY: "인형",
    OTHER: "기타",
};

export const CATEGORY_ICON_MAP: Record<string, any> = {
    SMARTPHONE: Headphones,
    EARPHONES: Headphones,
    BAG: Package,
    WALLET: CreditCard,
    CREDIT_CARD: CreditCard,
    STUDENT_ID_CARD: CreditCard,
    TEXTBOOK: Book,
    NOTEBOOK: Book,
    UMBRELLA: Umbrella,
    WATER_BOTTLE: Package,
    PENCIL_CASE: Package,
    PLUSH_TOY: Package,
    OTHER: Package,
};

export const ITEM_TYPE_MAP: Record<string, string> = {
    LOST: "찾는중",
    FOUND: "발견됨",
};

export const ITEM_STATUS_STYLE: Record<
    string,
    { bg: string; text: string; dot: string }
> = {
    LOST: {bg: "#fff7ed", text: "#f97316", dot: "#f97316"},
    FOUND: {bg: "#dcfce7", text: "#16a34a", dot: "#22c55e"},
};

export const CATEGORIES: { label: string; value: string }[] = [
    {label: "스마트폰", value: "SMARTPHONE"},
    {label: "이어폰", value: "EARPHONES"},
    {label: "가방", value: "BAG"},
    {label: "지갑", value: "WALLET"},
    {label: "카드", value: "CREDIT_CARD"},
    {label: "학생증", value: "STUDENT_ID_CARD"},
    {label: "교재", value: "TEXTBOOK"},
    {label: "노트", value: "NOTEBOOK"},
    {label: "우산", value: "UMBRELLA"},
    {label: "물병", value: "WATER_BOTTLE"},
    {label: "필통", value: "PENCIL_CASE"},
    {label: "인형", value: "PLUSH_TOY"},
];

export const COLORS: { label: string; value: string }[] = [
    {label: "검정", value: "BLACK"},
    {label: "흰색", value: "WHITE"},
    {label: "회색", value: "GRAY"},
    {label: "빨강", value: "RED"},
    {label: "파랑", value: "BLUE"},
    {label: "초록", value: "GREEN"},
    {label: "노랑", value: "YELLOW"},
    {label: "갈색", value: "BROWN"},
    {label: "분홍", value: "PINK"},
    {label: "보라", value: "PURPLE"},
    {label: "주황", value: "ORANGE"},
    {label: "베이지", value: "BEIGE"},
];

export const CATEGORY_TO_API: Record<string, string> = {
    전체: "",
    스마트폰: "SMARTPHONE",
    이어폰: "EARPHONES",
    가방: "BAG",
    지갑: "WALLET",
    카드: "CREDIT_CARD",
    학생증: "STUDENT_ID_CARD",
    교재: "TEXTBOOK",
    노트: "NOTEBOOK",
    우산: "UMBRELLA",
    물병: "WATER_BOTTLE",
    필통: "PENCIL_CASE",
    인형: "PLUSH_TOY",
};

export const CATEGORY_OPTIONS = [
    "전체",
    "스마트폰",
    "이어폰",
    "가방",
    "지갑",
    "카드",
    "학생증",
    "교재",
    "노트",
    "우산",
    "물병",
    "필통",
    "인형",
];