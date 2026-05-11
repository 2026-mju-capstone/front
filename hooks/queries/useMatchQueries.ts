import { useQuery } from "@tanstack/react-query";
import { matchService } from "../../api/services/match";

export const MATCH_QUERY_KEYS = {
  myMatches: ["myMatches"] as const,
};

export const useMatchQueries = {
  // 내 매칭 결과 목록
  useMyMatches: () =>
    useQuery({
      queryKey: MATCH_QUERY_KEYS.myMatches,
      queryFn: () => matchService.getMyMatches(),
      staleTime: 1000 * 30,
    }),
};
