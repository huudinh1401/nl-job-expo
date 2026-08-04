// Cấu hình dùng chung cho 3 module: báo cáo quên chấm công, báo cáo tăng ca, xin nghỉ phép.

// Chỉ 2 admin này được duyệt/từ chối — các admin khác chỉ xem (theo yêu cầu nghiệp vụ).
// So sánh dạng string vì AsyncStorage lưu userID dạng string.
export const REPORT_APPROVER_USER_IDS = ['2', '64'];

// Tài khoản bộ phận Kế toán được xem toàn bộ danh sách 3 module như admin (không được duyệt).
// Phải khớp CẢ id lẫn phòng ban (job/part) — id đúng nhưng đổi sang phòng ban khác thì không còn quyền này.
export const REPORT_VIEW_ALL_USER_IDS = ['66', '71'];
export const ACCOUNTING_DEPARTMENT = 'Kế toán';

// Phòng ban tạm thời chưa tự nộp đơn xin nghỉ phép được (chỉ liên hệ đội trưởng).
export const CONG_TRINH_DEPARTMENT = 'Công trình';

export const DEPARTMENT_FILTERS = ['Tất cả', 'Công trình', 'Máy tính', 'Photocopy', 'Dự án', 'Kế toán'];

export const STATUS_META = {
    pending: { label: 'Chờ duyệt', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    approved: { label: 'Đã duyệt', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    rejected: { label: 'Từ chối', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const REPORT_TYPES = {
    attendance: {
        key: 'attendance',
        title: 'Báo cáo quên chấm công',
        shortTitle: 'Quên chấm công',
        icon: 'time-outline',
        color: '#3b82f6',
        formRoute: 'AttendanceReportForm',
    },
    overtime: {
        key: 'overtime',
        title: 'Báo cáo tăng ca',
        shortTitle: 'Tăng ca',
        icon: 'flash-outline',
        color: '#f59e0b',
        formRoute: 'OvertimeReportForm',
    },
    leave: {
        key: 'leave',
        title: 'Xin nghỉ phép',
        shortTitle: 'Nghỉ phép',
        icon: 'airplane-outline',
        color: '#8b5cf6',
        formRoute: 'LeaveRequestForm',
    },
};

export const ATTENDANCE_TYPE_LABELS = {
    missed_in: 'Quên chấm vào',
    missed_out: 'Quên chấm ra',
    missed_both: 'Quên chấm vào & ra',
};

export const LEAVE_SESSION_LABELS = {
    full: 'Cả ngày',
    morning: 'Buổi sáng',
    afternoon: 'Buổi chiều',
};

export const canApproveReports = (userID) => REPORT_APPROVER_USER_IDS.includes(String(userID));

export const canViewAllReports = (userID, department) =>
    canApproveReports(userID) ||
    (REPORT_VIEW_ALL_USER_IDS.includes(String(userID)) && department === ACCOUNTING_DEPARTMENT);
