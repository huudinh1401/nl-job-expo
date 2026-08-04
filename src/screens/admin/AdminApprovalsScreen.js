import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import MonthYearPickerModal from '../../components/MonthYearPickerModal';
import { REPORT_TYPES, DEPARTMENT_FILTERS, ATTENDANCE_TYPE_LABELS, LEAVE_SESSION_LABELS, canApproveReports } from '../../constants/reportsConfig';
import {
    apiGetAttendanceReports, apiApproveAttendanceReport, apiRejectAttendanceReport,
    apiGetOvertimeReports, apiApproveOvertimeReport, apiRejectOvertimeReport,
    apiGetLeaveRequests, apiApproveLeaveRequest, apiRejectLeaveRequest,
    apiGetLeaveTypes,
} from '../../services/apiService';
import getErrorMessage from '../../utils/getErrorMessage';
import { getCurrentMonthYear } from '../../utils/monthYear';
import useLatestRequest from '../../hooks/useLatestRequest';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const FETCHERS = { attendance: apiGetAttendanceReports, overtime: apiGetOvertimeReports, leave: apiGetLeaveRequests };
const APPROVERS = { attendance: apiApproveAttendanceReport, overtime: apiApproveOvertimeReport, leave: apiApproveLeaveRequest };
const REJECTERS = { attendance: apiRejectAttendanceReport, overtime: apiRejectOvertimeReport, leave: apiRejectLeaveRequest };

const STATUS_OPTIONS = [
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Từ chối' },
    { key: 'all', label: 'Tất cả trạng thái' },
];
const TYPE_OPTIONS = [{ key: 'all', label: 'Tất cả loại đơn' }, ...Object.values(REPORT_TYPES).map((t) => ({ key: t.key, label: t.title }))];
const DEPARTMENT_OPTIONS = DEPARTMENT_FILTERS.map((d) => ({ key: d, label: d }));

const getSummaryLine = (reportType, item) => {
    if (reportType === 'attendance') {
        return `${ATTENDANCE_TYPE_LABELS[item.type] || item.type} · ${item.report_date}`;
    }
    if (reportType === 'overtime') {
        return `${item.overtime_date} · ${parseFloat(item.hours)} giờ`;
    }
    const sameDay = item.start_date === item.end_date;
    return `${item.start_date}${sameDay ? '' : ` → ${item.end_date}`} · ${LEAVE_SESSION_LABELS[item.session]} · ${parseFloat(item.days_count)} ngày`;
};

const FilterButton = ({ label, onPress }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 12, height: 42, marginRight: 8 }}>
        <Text style={{ flex: 1, color: '#ffffff', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{label}</Text>
        <Ionicons name="chevron-down" size={14} color="#94a3b8" />
    </TouchableOpacity>
);

const AdminApprovalsScreen = ({ navigation }) => {
    const [userID, setUserID] = useState(null);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [typeFilter, setTypeFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('Tất cả');
    const [activePicker, setActivePicker] = useState(null); // 'status' | 'type' | 'department' | null
    const [{ month, year }, setMonthYear] = useState(getCurrentMonthYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isMutating, setIsMutating] = useState(false);

    const [dataByType, setDataByType] = useState({ attendance: [], overtime: [], leave: [] });
    const [loading, setLoading] = useState(true);
    const { start, isLatest } = useLatestRequest();

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        AsyncStorage.getItem('userID').then(setUserID);
    }, []);

    const canApprove = canApproveReports(userID);

    // Admin không truyền userId -> lấy toàn bộ. GET /leave-requests không trả tên loại nghỉ nên map thêm qua GET /leave-types.
    const fetchAll = useCallback(async () => {
        const requestId = start();
        setLoading(true);
        try {
            const monthYearParams = { month, year };
            const [attendanceRes, overtimeRes, leaveRes, leaveTypesRes] = await Promise.all([
                FETCHERS.attendance(monthYearParams),
                FETCHERS.overtime(monthYearParams),
                FETCHERS.leave(monthYearParams),
                apiGetLeaveTypes(),
            ]);
            const nameById = {};
            (leaveTypesRes.data || []).forEach((t) => { nameById[t.id] = t.name; });
            const leaveItems = (leaveRes.data || []).map((item) => ({ ...item, leave_type_name: nameById[item.leave_type_id] || item.leave_type_name }));

            if (!isLatest(requestId)) return;
            setDataByType({
                attendance: attendanceRes.data || [],
                overtime: overtimeRes.data || [],
                leave: leaveItems,
            });
        } catch (error) {
            if (!isLatest(requestId)) return;
            Alert.alert('Lỗi', getErrorMessage(error));
        } finally {
            if (isLatest(requestId)) setLoading(false);
        }
    }, [month, year]);

    useFocusEffect(
        useCallback(() => {
            fetchAll();
        }, [fetchAll])
    );

    // Có notification tới lúc đang mở màn này (app đang chạy) -> tự refetch để thấy đơn mới ngay, không cần chờ back ra vào lại.
    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(() => {
            fetchAll();
        });
        return () => subscription.remove();
    }, [fetchAll]);

    const combinedList = useMemo(() => {
        const merged = Object.entries(dataByType).flatMap(([reportType, items]) =>
            items.map((item) => ({ ...item, reportType }))
        );
        return merged
            .filter((item) => typeFilter === 'all' || item.reportType === typeFilter)
            .filter((item) => departmentFilter === 'Tất cả' || item.part === departmentFilter)
            .filter((item) => statusFilter === 'all' || item.status === statusFilter)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [dataByType, typeFilter, departmentFilter, statusFilter]);

    const pendingCount = useMemo(
        () => Object.values(dataByType).flat().filter((item) => item.status === 'pending').length,
        [dataByType]
    );

    const handleApprove = (item) => {
        Alert.alert('Duyệt đơn', `Duyệt đơn của ${item.username}?`, [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Duyệt',
                onPress: async () => {
                    setIsMutating(true);
                    try {
                        await APPROVERS[item.reportType](item.id);
                        await fetchAll();
                    } catch (error) {
                        Alert.alert('Lỗi', getErrorMessage(error));
                    } finally {
                        setIsMutating(false);
                    }
                },
            },
        ]);
    };

    const handleConfirmReject = async () => {
        if (!rejectReason.trim()) {
            Alert.alert('Lỗi', 'Lý do từ chối không được để trống.');
            return;
        }
        if (rejectReason.length > 255) {
            Alert.alert('Lỗi', 'Lý do từ chối không được vượt quá 255 ký tự.');
            return;
        }

        setIsMutating(true);
        try {
            await REJECTERS[rejectTarget.reportType](rejectTarget.id, rejectReason.trim());
            setRejectTarget(null);
            setRejectReason('');
            await fetchAll();
        } catch (error) {
            Alert.alert('Lỗi', getErrorMessage(error));
        } finally {
            setIsMutating(false);
        }
    };

    const ItemView = ({ item }) => {
        const typeMeta = REPORT_TYPES[item.reportType];
        return (
            <View style={{ marginHorizontal: 12, marginVertical: 6, backgroundColor: '#334155', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#475569' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: typeMeta.color, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                        <Ionicons name={typeMeta.icon} size={13} color="#ffffff" />
                    </View>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{item.username} · {item.part}</Text>
                    <StatusBadge status={item.status} />
                </View>
                <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: 34 }}>{typeMeta.shortTitle} · {getSummaryLine(item.reportType, item)}</Text>
                {!!item.reason && <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, marginLeft: 34 }} numberOfLines={2}>{item.reason}</Text>}
                {item.status === 'rejected' && !!item.reject_reason && (
                    <Text style={{ color: '#fca5a5', fontSize: 12, marginTop: 4, marginLeft: 34 }}>Lý do từ chối: {item.reject_reason}</Text>
                )}
                {canApprove && item.status === 'pending' && (
                    <View style={{ flexDirection: 'row', marginTop: 10, marginLeft: 34 }}>
                        <TouchableOpacity disabled={isMutating} onPress={() => handleApprove(item)} style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 9, borderRadius: 10, marginRight: 8, alignItems: 'center', opacity: isMutating ? 0.6 : 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Duyệt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity disabled={isMutating} onPress={() => setRejectTarget(item)} style={{ flex: 1, backgroundColor: '#ef4444', paddingVertical: 9, borderRadius: 10, alignItems: 'center', opacity: isMutating ? 0.6 : 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Từ chối</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const pickerOptions = activePicker === 'status' ? STATUS_OPTIONS : activePicker === 'type' ? TYPE_OPTIONS : DEPARTMENT_OPTIONS;
    const pickerValue = activePicker === 'status' ? statusFilter : activePicker === 'type' ? typeFilter : departmentFilter;
    const handlePick = (key) => {
        if (activePicker === 'status') setStatusFilter(key);
        else if (activePicker === 'type') setTypeFilter(key);
        else setDepartmentFilter(key);
        setActivePicker(null);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <StatusBar barStyle='light-content' backgroundColor="#0f172a" />
                <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 15, paddingBottom: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: isAndroid15 ? 35 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ backgroundColor: '#8b5cf6', padding: 7, borderRadius: 15, marginRight: 15 }}>
                                <Ionicons name="checkmark-done-outline" size={22} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Duyệt đơn</Text>
                                <Text style={{ fontSize: 12, color: '#a5b4fc' }}>
                                    {canApprove ? `${pendingCount} đơn chờ duyệt · tháng ${month}/${year}` : `Chỉ xem · tháng ${month}/${year}`}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#8b5cf6', padding: 8, borderRadius: 12 }}>
                            <Ionicons name="arrow-back" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => setShowMonthPicker(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12, marginTop: 12, backgroundColor: '#334155', borderRadius: 12, paddingVertical: 10 }}
                >
                    <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Tháng {month}/{year}</Text>
                    <Ionicons name="chevron-down" size={14} color="#94a3b8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {/* 1 hàng filter gọn: trạng thái · loại đơn · phòng ban */}
                <View style={{ flexDirection: 'row', marginHorizontal: 12, marginTop: 10 }}>
                    <FilterButton label={STATUS_OPTIONS.find((o) => o.key === statusFilter)?.label} onPress={() => setActivePicker('status')} />
                    <FilterButton label={TYPE_OPTIONS.find((o) => o.key === typeFilter)?.label} onPress={() => setActivePicker('type')} />
                    <View style={{ flex: 1, marginRight: 0 }}>
                        <FilterButton label={departmentFilter} onPress={() => setActivePicker('department')} />
                    </View>
                </View>

                <View style={{ flex: 1, marginTop: 10 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
                    ) : combinedList.length > 0 ? (
                        <FlatList data={combinedList} keyExtractor={(item) => `${item.reportType}-${item.id}`} renderItem={ItemView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }} />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#334155', padding: 30, borderRadius: 20, alignItems: 'center' }}>
                                <Ionicons name="checkmark-done-outline" size={60} color="#6b7280" />
                                <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' }}>Không có đơn nào</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Modal chọn filter (dùng chung cho cả 3 filter) */}
                <Modal visible={!!activePicker} transparent animationType="slide" onRequestClose={() => setActivePicker(null)}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setActivePicker(null)}>
                        <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20, paddingBottom: 30, maxHeight: '60%' }}>
                            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 }}>
                                {activePicker === 'status' ? 'Chọn trạng thái' : activePicker === 'type' ? 'Chọn loại đơn' : 'Chọn phòng ban'}
                            </Text>
                            <FlatList
                                data={pickerOptions}
                                keyExtractor={(item) => item.key}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => handlePick(item.key)}
                                        style={{ paddingVertical: 14, paddingHorizontal: 20, backgroundColor: item.key === pickerValue ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}
                                    >
                                        <Text style={{ color: item.key === pickerValue ? '#c4b5fd' : '#ffffff', fontSize: 15, fontWeight: '600' }}>{item.label}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Modal lý do từ chối */}
                <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#1e293b', margin: 20, borderRadius: 20, padding: 20, width: '90%', borderWidth: 1, borderColor: '#334155' }}>
                            <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 12 }}>Lý do từ chối</Text>
                            <TextInput
                                style={{ backgroundColor: '#334155', borderRadius: 12, padding: 14, textAlignVertical: 'top', fontSize: 14, color: 'white', minHeight: 90, borderWidth: 2, borderColor: '#ef4444' }}
                                placeholder='Nhập lý do từ chối...'
                                placeholderTextColor='#64748b'
                                multiline
                                maxLength={255}
                                value={rejectReason}
                                onChangeText={setRejectReason}
                            />
                            <View style={{ flexDirection: 'row', marginTop: 16 }}>
                                <TouchableOpacity disabled={isMutating} onPress={() => { setRejectTarget(null); setRejectReason(''); }} style={{ flex: 1, backgroundColor: '#334155', paddingVertical: 12, borderRadius: 12, marginRight: 8, alignItems: 'center' }}>
                                    <Text style={{ color: '#ffffff', fontWeight: '600' }}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity disabled={isMutating} onPress={handleConfirmReject} style={{ flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center', opacity: isMutating ? 0.6 : 1 }}>
                                    {isMutating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#ffffff', fontWeight: '700' }}>Xác nhận từ chối</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <MonthYearPickerModal
                    visible={showMonthPicker}
                    month={month}
                    year={year}
                    accentColor="#8b5cf6"
                    onSelect={(m, y) => { setMonthYear({ month: m, year: y }); setShowMonthPicker(false); }}
                    onClose={() => setShowMonthPicker(false)}
                />
            </SafeAreaView>
        </View>
    );
};

export default AdminApprovalsScreen;
