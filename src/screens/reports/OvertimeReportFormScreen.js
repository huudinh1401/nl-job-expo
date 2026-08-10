import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Platform, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { REPORT_TYPES } from '../../constants/reportsConfig';
import { apiCreateOvertimeReport } from '../../services/apiService';
import getErrorMessage from '../../utils/getErrorMessage';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;
const meta = REPORT_TYPES.overtime;

const toDateStr = (date) => date.toISOString().split('T')[0];

const OvertimeReportFormScreen = ({ navigation }) => {
    const [overtimeDate, setOvertimeDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [hours, setHours] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const handleSubmit = async () => {
        const hoursNumber = parseFloat(hours.replace(',', '.'));
        if (!hours || Number.isNaN(hoursNumber)) {
            Alert.alert('Lỗi', 'Số giờ tăng ca là bắt buộc và phải là số.');
            return;
        }
        if (hoursNumber <= 0 || hoursNumber > 24) {
            Alert.alert('Lỗi', 'Số giờ tăng ca phải lớn hơn 0 và không vượt quá 24.');
            return;
        }
        if (Math.round(hoursNumber * 10) !== hoursNumber * 10) {
            Alert.alert('Lỗi', 'Số giờ tăng ca chỉ được có tối đa 1 chữ số thập phân.');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Lỗi', 'Lý do là bắt buộc.');
            return;
        }
        if (reason.length > 255) {
            Alert.alert('Lỗi', 'Lý do không được vượt quá 255 ký tự.');
            return;
        }

        const payload = { overtime_date: toDateStr(overtimeDate), hours: hoursNumber, reason: reason.trim() };

        Alert.alert(
            'Xác nhận gửi báo cáo',
            `Vui lòng kiểm tra lại thông tin trước khi gửi:\n\nNgày tăng ca: ${payload.overtime_date}\nSố giờ: ${payload.hours}\nLý do: ${payload.reason}`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Gửi báo cáo', onPress: () => submitReport(payload) },
            ]
        );
    };

    const submitReport = async (payload) => {
        setIsSubmitting(true);
        try {
            await apiCreateOvertimeReport(payload);
            Alert.alert('Thành công', 'Tạo báo cáo tăng ca thành công', [
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
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Ngày tăng ca *</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between', marginBottom: 18 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{toDateStr(overtimeDate)}</Text>
                        <Ionicons name="calendar-outline" size={20} color={meta.color} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker value={overtimeDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowDatePicker(Platform.OS === 'ios'); if (date) setOvertimeDate(date); }} />
                    )}

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Số giờ tăng ca * (0 - 24, tối đa 1 số thập phân)</Text>
                    <TextInput
                        style={{ backgroundColor: '#334155', borderRadius: 15, paddingHorizontal: 15, height: 50, fontSize: 15, color: 'white', borderWidth: 2, borderColor: '#475569', marginBottom: 18 }}
                        placeholder='Ví dụ: 2.5'
                        placeholderTextColor='#64748b'
                        keyboardType='decimal-pad'
                        value={hours}
                        onChangeText={setHours}
                    />

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Lý do * (tối đa 255 ký tự)</Text>
                    <TextInput
                        style={{ backgroundColor: '#334155', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 14, color: 'white', minHeight: 90, borderWidth: 2, borderColor: '#475569', marginBottom: 20 }}
                        placeholder='Ví dụ: Xử lý gấp đơn hàng ABC...'
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

export default OvertimeReportFormScreen;
