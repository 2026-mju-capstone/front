import {useQuery} from '@tanstack/react-query';
import {authService} from '../../api/services/auth';

export const useValidateToken = () => {
    return useQuery({
        queryKey: ['validateToken'],
        queryFn: () => authService.validateToken(),
        retry: false,
        enabled: false,
    });
};

export const useCheckNickname = (nickname: string) => {
    return useQuery({
        queryKey: ['checkNickname', nickname],
        queryFn: () => authService.checkNickname(nickname),
        enabled: nickname.length > 0,
        retry: false,
    });
};
