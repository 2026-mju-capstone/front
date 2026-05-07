import {useQuery} from '@tanstack/react-query';
import {userService} from '../../api/services/user';

export const useProfile = () => {
    return useQuery({
        queryKey: ['userProfile'],
        queryFn: () => userService.getProfile(),
    });
};
