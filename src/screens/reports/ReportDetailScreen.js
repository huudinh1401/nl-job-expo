import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../components/StatusBadge';
import { REPORT_TYPES, ATTENDANCE_TYPE_LABELS, LEAVE_SESSION_LABELS } from '../../constants/reportsConfig';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const Row = ({ label, value }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>{value}</Text>
        </View>
    );
};

const getTypeSpecificRows = (reportType, report) => {
    if (reportType === 'attendance') {
        return (
            <>
                <Row label="Ngày báo cáo" value={report.report_date} />
                <Row label="Loại báo cáo" value={ATTENDANCE_TYPE_LABELS[report.type] || report.type} />
                <Row label="Giờ vào đề xuất" value={report.proposed_check_in} />
                <Row label="Giờ ra đề xuất" value={report.proposed_check_out} />
            </>
        );
    }
    if (reportType === 'overtime') {
        return (
            <>
                <Row label="Ngày tăng ca" value={report.overtime_date} />
                <Row label="Số giờ tăng ca" value={`${parseFloat(report.hours)} giờ`} />
            </>
        );
    }
    const sameDay = report.start_date === report.end_date;
    return (
        <>
            <Row label="Loại nghỉ phép" value={report.leave_type_name} />
            <Row label="Từ ngày" value={report.start_date} />
            {!sameDay && <Row label="Đến ngày" value={report.end_date} />}
            <Row label="Buổi nghỉ" value={LEAVE_SESSION_LABELS[report.session]} />
            <Row label="Số ngày nghỉ" value={`${parseFloat(report.days_count)} ngày`} />
        </>
    );
};

const ReportDetailScreen = ({ navigation, route }) => {
    const reportType = route.params?.reportType || 'attendance';
    const report = route.params?.report || {};
    const meta = REPORT_TYPES[reportType];

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: meta.color, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name={meta.icon} size={20} color="#ffffff" />
                    </View>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 17, fontWeight: 'bold' }}>{meta.title}</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }} showsVerticalScrollIndicator={false}>
                    <View style={{ backgroundColor: '#334155', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#475569' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>Người gửi</Text>
                            <StatusBadge status={report.status} />
                        </View>
                        <Row label="Nhân viên" value={report.username ? `${report.username} · ${report.part}` : undefined} />
                        {getTypeSpecificRows(reportType, report)}
                        <Row label="Lý do" value={report.reason} />
                        {report.status !== 'pending' && (
                            <>
                                <Row label="Người duyệt" value={report.reviewed_by_name} />
                                {report.status === 'rejected' && <Row label="Lý do từ chối" value={report.reject_reason} />}
                            </>
                        )}
                    </View>

                    <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 16, padding: 14, marginTop: 15, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                        <Text style={{ color: '#93c5fd', fontSize: 12, textAlign: 'center' }}>
                            Không thể chỉnh sửa hoặc xoá sau khi gửi. Nếu sai thông tin, chờ admin xử lý rồi tạo báo cáo mới.
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default ReportDetailScreen;
