import api from './api';

const apiLogin = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

const apiGetJobHistory = async () => {
    const response = await api.get('/jobs/history');
    return response.data;
};

const apiGetJob = async (id, status, start, toa_do) => { //api nhan viec
    const response = await api.put(`/jobs/${id}`, { status, start, toa_do });
    return response.data;
};

const apiUpdateToaDo = async (id, toa_do) => { //api cap nhat vi tri 
    const response = await api.put(`/jobs/${id}`, { toa_do });
    return response.data;
};

const apiFinishJob = async (id, end, status, toa_do, note) => { // api hoan thanh cong viec
    const response = await api.put(`/jobs/${id}`, { end, status, toa_do, note });
    return response.data;
};

const apiGetUserInfo = async (id) => { //api lay thong tin User theo UserID
    const response = await api.get(`/users/${id}`);
    return response.data;
};

const apiCheckStatusUser = async (id) => { //api lay trang thai User co dang lam j hay ko
    const response = await api.get(`/jobs/user/${id}`);
    return response.data;
};

const apiChangePass = async (id, oldPassword, newPassword) => { //api doi pass
    const response = await api.put(`/users/change-password/${id}`, { oldPassword, newPassword });
    return response.data;
};

const apiHistoryJobOfUser = async (id) => { //api lay lich su cong viec cua User
    const response = await api.get(`/jobs/alljobuser/${id}`);
    return response.data;
};

const apiGetJobWorkingMayTinh = async () => { //api lay danh sach cong viec dang lam team may tinh
    const response = await api.get(`/jobs/maytinh`);
    return response.data;
};

const apiGetJobWorkingPhoTo = async () => { //api lay danh sach cong viec dang lam team Photo
    const response = await api.get(`/jobs/photo`);
    return response.data;
};

const apiGetJobWorkingCongTrinh = async () => { //api lay danh sach cong viec dang lam team cong trinh
    const response = await api.get(`/jobs/congtrinh`);
    return response.data;
};

const apiStatusChamcongOfUser = async (ngay, nhanVien) => { //api lay danh sach cong viec dang lam team cong trinh
    const response = await api.post(`/chamcongs/`, { ngay, nhanVien });
    return response.data;
};

const apiAddChamCong = async (formData) => { //api add thoong tin chaams coong leen server
    const response = await api.post(`/chamcongs/add`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const apiUpdateChamCong = async (id, formData) => { //api add thoong tin chaams coong leen server
    const response = await api.put(`/chamcongs/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

const apiBangChamCong = async (nhanVien, thang, nam) => { //api lay lich su diem danh tinh bang cham cong
    const response = await api.post(`/chamcongs/`, { nhanVien, thang, nam });
    return response.data;
};

const apiGetAllUser = async () => { //api lay thông tin tat ca user
    const response = await api.get(`/users/user`);
    return response.data;
};

const apiGiaoJob = async (noi_dung, user_id) => { //api giao viec
    const response = await api.post(`/jobs/`, { noi_dung, user_id });
    return response.data;
};

const apiUpdateStatusUser = async (id, status) => { //api cap nhat trang thai user
    const response = await api.put(`/users/change-user_status/${id}`, { status });
    return response.data;
};

const apiUpdateDeviceToken = async (id, device_token) => { //api cap nhat deviceToken
    const response = await api.put(`/users/update_device_token/${id}`, { device_token });
    return response.data;
};

const apiPushNoti = async (device_token) => { //api ban thong bao
    const response = await api.post(`/users/firebase`, { device_token });
    return response.data;
};

const apiNvTeamDiemDanh = async (boPhan, ngay) => { //api lay danh diem danh nv team xem ai di lam, ai vang
    const response = await api.post(`/chamcongs/`, { boPhan, ngay });
    return response.data;
};

const apiSearchJobTheoNgayVaTeam = async (date, part) => { //api lay danh diem danh nv team xem ai di lam, ai vang
    const response = await api.post(`/jobs/search`, { date, part });
    return response.data;
};

const apiGetMayTinhViecMoi = async () => { //api lay danh sach cong viec moi team cong trinh
    const response = await api.get(`/jobs/maytinh_viecmoi`);
    return response.data;
};

const apiGetPhotoViecMoi = async () => { //api lay danh sach cong viec moi team cong trinh
    const response = await api.get(`/jobs/photo_viecmoi`);
    return response.data;
};

const apiGetCongTrinhViecMoi = async () => { //api lay danh sach cong viec moi team cong trinh
    const response = await api.get(`/jobs/congtrinh_viecmoi`);
    return response.data;
};

const apiDeleteJob = async (id) => { //api lay danh sach cong viec dang lam team cong trinh
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
};

const apiPushNotiSuper = async (device_token, notificationType, customMessage) => { //api ban thong bao
    const response = await api.post(`/users/firebase_new`, { device_token, notificationType, customMessage });
    return response.data;
};

const apiUpdateNoiDung = async (id, noi_dung) => { //api cap nhat vi tri
    const response = await api.put(`/jobs/${id}`, { noi_dung });
    return response.data;
};

// ===== Báo cáo quên chấm công =====
const apiCreateAttendanceReport = async (payload) => { //api nhan vien tao bao cao quen cham cong
    const response = await api.post('/attendance-reports', payload);
    return response.data;
};

const apiGetAttendanceReports = async (params = {}) => { //api lay danh sach bao cao quen cham cong
    const response = await api.get('/attendance-reports', { params });
    return response.data;
};

const apiGetAttendanceReportById = async (id) => {
    const response = await api.get(`/attendance-reports/${id}`);
    return response.data;
};

const apiApproveAttendanceReport = async (id) => { //admin only
    const response = await api.put(`/attendance-reports/${id}/approve`);
    return response.data;
};

const apiRejectAttendanceReport = async (id, reject_reason) => { //admin only
    const response = await api.put(`/attendance-reports/${id}/reject`, { reject_reason });
    return response.data;
};

// ===== Báo cáo tăng ca =====
const apiCreateOvertimeReport = async (payload) => { //api nhan vien tao bao cao tang ca
    const response = await api.post('/overtime-reports', payload);
    return response.data;
};

const apiGetOvertimeReports = async (params = {}) => { //api lay danh sach bao cao tang ca
    const response = await api.get('/overtime-reports', { params });
    return response.data;
};

const apiGetOvertimeReportById = async (id) => {
    const response = await api.get(`/overtime-reports/${id}`);
    return response.data;
};

const apiApproveOvertimeReport = async (id) => { //admin only
    const response = await api.put(`/overtime-reports/${id}/approve`);
    return response.data;
};

const apiRejectOvertimeReport = async (id, reject_reason) => { //admin only
    const response = await api.put(`/overtime-reports/${id}/reject`, { reject_reason });
    return response.data;
};

// ===== Loại nghỉ phép =====
const apiGetLeaveTypes = async () => { //api lay danh sach loai nghi phep (active) cho moi user
    const response = await api.get('/leave-types');
    return response.data;
};

const apiGetAllLeaveTypes = async () => { //admin only, gom ca inactive
    const response = await api.get('/leave-types/all');
    return response.data;
};

// ===== Xin nghỉ phép =====
const apiCreateLeaveRequest = async (payload) => { //api nhan vien tao don xin nghi phep
    const response = await api.post('/leave-requests', payload);
    return response.data;
};

const apiGetLeaveRequests = async (params = {}) => { //api lay danh sach don xin nghi phep
    const response = await api.get('/leave-requests', { params });
    return response.data;
};

const apiGetLeaveRequestById = async (id) => {
    const response = await api.get(`/leave-requests/${id}`);
    return response.data;
};

const apiApproveLeaveRequest = async (id) => { //admin only
    const response = await api.put(`/leave-requests/${id}/approve`);
    return response.data;
};

const apiRejectLeaveRequest = async (id, reject_reason) => { //admin only
    const response = await api.put(`/leave-requests/${id}/reject`, { reject_reason });
    return response.data;
};

export {
    apiLogin,
    apiGetJobHistory,
    apiGetJob,
    apiUpdateToaDo,
    apiFinishJob,
    apiGetUserInfo,
    apiCheckStatusUser,
    apiChangePass,
    apiHistoryJobOfUser,
    apiGetJobWorkingMayTinh,
    apiGetJobWorkingPhoTo,
    apiGetJobWorkingCongTrinh,
    apiStatusChamcongOfUser,
    apiAddChamCong,
    apiUpdateChamCong,
    apiBangChamCong,
    apiGetAllUser,
    apiGiaoJob,
    apiUpdateStatusUser,
    apiUpdateDeviceToken,
    apiPushNoti,
    apiNvTeamDiemDanh,
    apiSearchJobTheoNgayVaTeam,
    apiGetMayTinhViecMoi,
    apiGetPhotoViecMoi,
    apiGetCongTrinhViecMoi,
    apiDeleteJob,
    apiPushNotiSuper,
    apiUpdateNoiDung,
    apiCreateAttendanceReport,
    apiGetAttendanceReports,
    apiGetAttendanceReportById,
    apiApproveAttendanceReport,
    apiRejectAttendanceReport,
    apiCreateOvertimeReport,
    apiGetOvertimeReports,
    apiGetOvertimeReportById,
    apiApproveOvertimeReport,
    apiRejectOvertimeReport,
    apiGetLeaveTypes,
    apiGetAllLeaveTypes,
    apiCreateLeaveRequest,
    apiGetLeaveRequests,
    apiGetLeaveRequestById,
    apiApproveLeaveRequest,
    apiRejectLeaveRequest
};