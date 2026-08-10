import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Platform, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { REPORT_TYPES, ATTENDANCE_TYPE_LABELS } from '../../constants/reportsConfig';
import { apiCreateAttendanceReport } from '../../services/apiService';
import getErrorMessage from '../../utils/getErrorMessage';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;
const meta = REPORT_TYPES.attendance;

const toDateStr = (date) => date.toISOString().split('T')[0];
const toTimeStr = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const AttendanceReportFormScreen = ({ navigation }) => {
    const [reportDate, setReportDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [type, setType] = useState('missed_both');
    const [checkIn, setCheckIn] = useState(new Date());
    const [showCheckInPicker, setShowCheckInPicker] = useState(false);
    const [checkOut, setCheckOut] = useState(new Date());
    const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const needCheckIn = type === 'missed_in' || type === 'missed_both';
    const needCheckOut = type === 'missed_out' || type === 'missed_both';

    const handleSubmit = async () => {
        if (needCheckIn && needCheckOut && toTimeStr(checkOut) <= toTimeStr(checkIn)) {
            Alert.alert('Lỗi', 'Giờ ra phải sau giờ vào (không hỗ trợ ca qua đêm).');
            return;
        }
        if (reason.length > 255) {
            Alert.alert('Lỗi', 'Lý do không được vượt quá 255 ký tự.');
            return;
        }

        const payload = { report_date: toDateStr(reportDate), type, reason };
        if (needCheckIn) payload.proposed_check_in = toTimeStr(checkIn);
        if (needCheckOut) payload.proposed_check_out = toTimeStr(checkOut);

        const summaryLines = [
            `Ngày báo cáo: ${toDateStr(reportDate)}`,
            `Loại: ${ATTENDANCE_TYPE_LABELS[type]}`,
        ];
        if (needCheckIn) summaryLines.push(`Giờ vào đề xuất: ${toTimeStr(checkIn)}`);
        if (needCheckOut) summaryLines.push(`Giờ ra đề xuất: ${toTimeStr(checkOut)}`);
        summaryLines.push(`Lý do: ${reason || '(không có)'}`);

        Alert.alert(
            'Xác nhận gửi báo cáo',
            `Vui lòng kiểm tra lại thông tin trước khi gửi:\n\n${summaryLines.join('\n')}`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Gửi báo cáo', onPress: () => submitReport(payload) },
            ]
        );
    };

    const submitReport = async (payload) => {
        setIsSubmitting(true);
        try {
            await apiCreateAttendanceReport(payload);
            Alert.alert('Thành công', 'Tạo báo cáo quên chấm công thành công', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#1e293b' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: meta.color, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name={meta.icon} size={20} color="#ffffff" />
                    </View>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 17, fontWeight: 'bold' }}>Tạo {meta.title}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }} showsVerticalScrollIndicator={false}>
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Ngày báo cáo *</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between', marginBottom: 18 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{toDateStr(reportDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color={meta.color} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker value={reportDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setReportDate(date); }} />
                    )}

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Loại báo cáo *</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                        {Object.entries(ATTENDANCE_TYPE_LABELS).map(([key, label]) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setType(key)}
                                style={{ flex: 1, marginRight: 6, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: type === key ? meta.color : '#334155' }}
                            >
                                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {needCheckIn && (
                        <>
                            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Giờ vào đề xuất *</Text>
                            <TouchableOpacity onPress={() => setShowCheckInPicker(true)} style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between', marginBottom: 18 }}>
                                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{toTimeStr(checkIn)}</Text>
                                <Ionicons name="time-outline" size={20} color={meta.color} />
                            </TouchableOpacity>
                            {showCheckInPicker && (
                                <DateTimePicker value={checkIn} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowCheckInPicker(Platform.OS === 'ios'); if (date) setCheckIn(date); }} />
                            )}
                        </>
                    )}

                    {needCheckOut && (
                        <>
                            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Giờ ra đề xuất *</Text>
                            <TouchableOpacity onPress={() => setShowCheckOutPicker(true)} style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between', marginBottom: 18 }}>
                                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{toTimeStr(checkOut)}</Text>
                                <Ionicons name="time-outline" size={20} color={meta.color} />
                            </TouchableOpacity>
                            {showCheckOutPicker && (
                                <DateTimePicker value={checkOut} mode="time" is24Hour display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowCheckOutPicker(Platform.OS === 'ios'); if (date) setCheckOut(date); }} />
                            )}
                        </>
                    )}

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Lý do (tối đa 255 ký tự)</Text>
                    <TextInput
                        style={{ backgroundColor: '#334155', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 14, color: 'white', minHeight: 90, borderWidth: 2, borderColor: '#475569', marginBottom: 20 }}
                        placeholder='Ví dụ: Quên bấm máy chấm công...'
                        placeholderTextColor='#64748b'
                        multiline
                        maxLength={255}
                        value={reason}
                        onChangeText={setReason}
                    />

                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: meta.color, borderRadius: 27.5, opacity: isSubmitting ? 0.7 : 1 }}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Gửi báo cáo</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default AttendanceReportFormScreen;
