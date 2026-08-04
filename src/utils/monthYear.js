// Sinh danh sách tháng/năm cho picker (2 năm trước -> 1 năm sau năm hiện tại), mới nhất lên đầu.
export const generateMonthYearList = () => {
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
        for (let month = 1; month <= 12; month++) {
            list.push({ year, month, label: `Tháng ${month}/${year}`, value: `${month}-${year}` });
        }
    }
    return list.reverse();
};

export const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
};
