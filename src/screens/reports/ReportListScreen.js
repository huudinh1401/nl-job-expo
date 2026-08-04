import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import MonthYearPickerModal from '../../components/MonthYearPickerModal';
import { REPORT_TYPES, ATTENDANCE_TYPE_LABELS, LEAVE_SESSION_LABELS } from '../../constants/reportsConfig';
import { apiGetAttendanceReports, apiGetOvertimeReports, apiGetLeaveRequests, apiGetLeaveTypes } from '../../services/apiService';
import getErrorMessage from '../../utils/getErrorMessage';
import { getCurrentMonthYear } from '../../utils/monthYear';
import useLatestRequest from '../../hooks/useLatestRequest';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const FETCHERS = {
    attendance: apiGetAttendanceReports,
    overtime: apiGetOvertimeReports,
    leave: apiGetLeaveRequests,
};

const STATUS_FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
    { key: 'rejected', label: 'Từ chối' },
];

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

const ReportListScreen = ({ navigation, route }) => {
    const reportType = route.params?.reportType || 'attendance';
    const meta = REPORT_TYPES[reportType];
    const [statusFilter, setStatusFilter] = useState('all');
    const [{ month, year }, setMonthYear] = useState(getCurrentMonthYear());
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { start, isLatest } = useLatestRequest();

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const fetchData = useCallback(async () => {
        const requestId = start();
        setLoading(true);
        try {
            const params = { month, year };
            if (statusFilter !== 'all') params.status = statusFilter;

            const res = await FETCHERS[reportType](params);
            let items = res.data || [];

            // GET /leave-requests không trả tên loại nghỉ — tự map leave_type_id -> tên qua GET /leave-types.
            if (reportType === 'leave' && items.length > 0) {
                try {
                    const typesRes = await apiGetLeaveTypes();
                    const nameById = {};
                    (typesRes.data || []).forEach((t) => { nameById[t.id] = t.name; });
                    items = items.map((item) => ({ ...item, leave_type_name: nameById[item.leave_type_id] || item.leave_type_name }));
                } catch (typeError) {
                    // Không chặn hiển thị danh sách nếu chỉ lỗi lấy tên loại nghỉ.
                }
            }

            if (!isLatest(requestId)) return;
            setData(items);
        } catch (error) {
            if (!isLatest(requestId)) return;
            Alert.alert('Lỗi', getErrorMessage(error));
        } finally {
            if (isLatest(requestId)) setLoading(false);
        }
    }, [reportType, statusFilter, month, year]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const ItemView = ({ item }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('ReportDetail', { reportType, report: item })}
            activeOpacity={0.85}
            style={{ marginHorizontal: 12, marginVertical: 6, backgroundColor: '#334155', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#475569' }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{getSummaryLine(reportType, item)}</Text>
                    {!!item.reason && (
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{item.reason}</Text>
                    )}
                </View>
                <StatusBadge status={item.status} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <StatusBar barStyle='light-content' backgroundColor="#0f172a" />
                <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 15, paddingBottom: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: isAndroid15 ? 35 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ backgroundColor: meta.color, padding: 7, borderRadius: 15, marginRight: 15 }}>
                                <Ionicons name={meta.icon} size={24} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 17, fontWeight: '800', color: '#ffffff' }}>{meta.title}</Text>
                                <Text style={{ fontSize: 12, color: '#a5b4fc' }}>Của tôi</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate(meta.formRoute)} style={{ backgroundColor: meta.color, padding: 10, borderRadius: 12, marginRight: 8 }}>
                            <Ionicons name="add" size={20} color="#ffffff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#334155', padding: 10, borderRadius: 12 }}>
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

                <View style={{ flexDirection: 'row', marginHorizontal: 12, marginTop: 12 }}>
                    {STATUS_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            onPress={() => setStatusFilter(filter.key)}
                            style={{ flex: 1, marginRight: 6, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: statusFilter === filter.key ? meta.color : '#334155' }}
                        >
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>{filter.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ flex: 1, marginTop: 10 }}>
                    {loading ? (
                        <ActivityIndicator size="large" color={meta.color} style={{ marginTop: 40 }} />
                    ) : data.length > 0 ? (
                        <FlatList data={data} keyExtractor={(item) => String(item.id)} renderItem={ItemView} showsVerticalScrollIndicator={false} />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#334155', padding: 30, borderRadius: 20, alignItems: 'center' }}>
                                <Ionicons name={meta.icon} size={60} color="#6b7280" />
                                <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' }}>Không có dữ liệu</Text>
                            </View>
                        </View>
                    )}
                </View>

                <MonthYearPickerModal
                    visible={showMonthPicker}
                    month={month}
                    year={year}
                    accentColor={meta.color}
                    onSelect={(m, y) => { setMonthYear({ month: m, year: y }); setShowMonthPicker(false); }}
                    onClose={() => setShowMonthPicker(false)}
                />
            </SafeAreaView>
        </View>
    );
};

export default ReportListScreen;
