import { useQuery } from "@tanstack/react-query";
import { userService } from "../../api/services/user";

export const useProfile = () => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => userService.getProfile(),
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
    gcTime: 1000 * 60 * 10, // 10분간 메모리 보관
  });
};
