import client from "../client";
import {
    ApiResponse,
    ItemMatchResultResponse,
    MatchManualRequest,
    MatchManualResponse,
} from "../types";

export const matchService = {
  // 내 매칭 결과 조회
  getMyMatches: async () => {
    const res =
      await client.get<ApiResponse<ItemMatchResultResponse[]>>(
        "/api/matches/me",
      );
    return res.data;
  },

  // 매칭 수락
  confirmMatch: async (matchId: number) => {
    const res = await client.post<ApiResponse<number>>(
      `/api/matches/${matchId}/confirm`,
    );
    return res.data;
  },

  // 매칭 거절
  rejectMatch: async (matchId: number) => {
    const res = await client.post<ApiResponse<number>>(
      `/api/matches/${matchId}/reject`,
    );
    return res.data;
  },

  // 수동 매칭
  manualMatch: async (data: MatchManualRequest) => {
    const res = await client.post<ApiResponse<MatchManualResponse>>(
      "/api/matches/manual",
      data,
    );
    return res.data;
  },
};
