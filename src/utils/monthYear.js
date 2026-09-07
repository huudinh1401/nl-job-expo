// Sinh danh sách tháng/năm cho picker (2 năm trước -> tháng hiện tại), mới nhất lên đầu.
// Không cho chọn tháng tương lai vì dữ liệu mới nhất cũng chỉ có tới tháng hiện tại.
export const generateMonthYearList = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const list = [];
    for (let year = currentYear - 2; year <= currentYear; year++) {
        for (let month = 1; month <= 12; month++) {
            if (year === currentYear && month > currentMonth) continue;
            list.push({ year, month, label: `Tháng ${month}/${year}`, value: `${month}-${year}` });
        }
    }
    return list.reverse();
};

export const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
};

// Danh sách {month, year} của N tháng gần nhất tính từ tháng hiện tại.
// Backend /overtime-reports và /leave-requests luôn mặc định lọc theo tháng/năm hiện tại
// nếu không truyền month/year (không có cách lấy "tất cả, không giới hạn thời gian" trong 1 lần gọi),
// nên phải gọi lặp theo từng tháng rồi gộp ở client để có đủ đơn chờ duyệt của các tháng trước.
export const getRecentMonths = (count) => {
    const now = new Date();
    const list = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }
    return list;
};
