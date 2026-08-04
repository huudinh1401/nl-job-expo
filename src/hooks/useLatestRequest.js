import { useRef, useCallback } from 'react';

// Chống race condition khi user đổi filter liên tục: chỉ áp dụng kết quả của request mới nhất,
// bỏ qua response của các request cũ hơn lỡ trả về sau.
export default function useLatestRequest() {
    const latestIdRef = useRef(0);

    const start = useCallback(() => {
        latestIdRef.current += 1;
        return latestIdRef.current;
    }, []);

    const isLatest = useCallback((id) => id === latestIdRef.current, []);

    return { start, isLatest };
}
