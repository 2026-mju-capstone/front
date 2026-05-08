import {useEffect, useState} from 'react';

/**
 * 특정 값의 변경을 지연시켜 반환하는 디바운스 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
