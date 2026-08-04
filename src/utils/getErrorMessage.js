// Backend không có 1 shape lỗi thống nhất (xem mobile-api-guide.md §1.1):
// - middleware (401/403): { status, message }
// - controller (400/403/500): { success: false, message }
// - auth login/refresh-token: { error }
// → luôn ưu tiên đọc message, fallback qua error, rồi mới tới message mặc định.
const getErrorMessage = (error, fallback = 'Có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.') => {
    const data = error?.response?.data;
    return data?.message || data?.error || fallback;
};

export default getErrorMessage;
