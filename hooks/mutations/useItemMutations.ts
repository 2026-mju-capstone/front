import {useMutation, useQueryClient} from "@tanstack/react-query";
import {itemService} from "@/api/services/item";
import {CreateItemRequest} from "@/api/types";

export const useItemMutations = {
    useCreateItem: () => {
        const queryClient = useQueryClient();
        return useMutation({
            mutationFn: (data: CreateItemRequest) => itemService.createItem(data),
            onSuccess: () => {
                // 아이템 생성 성공 시 목록 새로고침 유도
                queryClient.invalidateQueries({queryKey: ["items"]});
            },
        });
    },
};
