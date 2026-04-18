import { Stack } from "expo-router";
import { createContext, useContext, useState } from "react";

export type SignupData = {
  email: string;
  verifyCode: string;
  password: string;
  confirmPassword: string;
  nickname: string;
  department: string;
  profileImage?: string;
};

type SignupContextType = {
  data: SignupData;
  updateData: (partial: Partial<SignupData>) => void;
};

const SignupContext = createContext<SignupContextType | null>(null);

export const useSignup = () => {
  const ctx = useContext(SignupContext);
  if (!ctx) throw new Error("useSignup must be used within SignupLayout");
  return ctx;
};

export default function SignupLayout() {
  const [data, setData] = useState<SignupData>({
    email: "",
    verifyCode: "",
    password: "",
    confirmPassword: "",
    nickname: "",
    department: "",
    profileImage: undefined,
  });

  const updateData = (partial: Partial<SignupData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  return (
    <SignupContext.Provider value={{ data, updateData }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="email" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="profile" />
      </Stack>
    </SignupContext.Provider>
  );
}