import client from "../client";
import { ApiResponse } from "../types";

const lockerService = {
    unlock: (lockerId: number, itemId?: number) =>
        client.post<ApiResponse<null>>(
            `/api/lockers/${lockerId}/unlock`,
            itemId !== undefined ? { itemId } : {},
        ),
    lock: (lockerId: number) =>
        client.post<ApiResponse<null>>(`/api/lockers/${lockerId}/lock`),
};

export { lockerService };
