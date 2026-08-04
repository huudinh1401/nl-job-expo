import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Platform, ScrollView, Alert, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { REPORT_TYPES, LEAVE_SESSION_LABELS, CONG_TRINH_DEPARTMENT } from '../../constants/reportsConfig';
import { apiGetLeaveTypes, apiCreateLeaveRequest } from '../../services/apiService';
import getErrorMessage from '../../utils/getErrorMessage';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;
const meta = REPORT_TYPES.leave;

const toDateStr = (date) => date.toISOString().split('T')[0];

const countDays = (start, end) => Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

const CongTrinhNotice = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
        <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="call-outline" size={44} color={meta.color} />
        </View>
        <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Liên hệ đội trưởng để xin nghỉ</Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Đội Công trình hiện chưa tự viết đơn xin nghỉ phép trên app. Vui lòng liên hệ Anh Cương (đội trưởng đội Công trình) để viết đơn gửi Admin.
        </Text>
    </View>
);

const LeaveRequestFormScreen = ({ navigation }) => {
    const [department, setDepartment] = useState(null);
    const [role, setRole] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loadingTypes, setLoadingTypes] = useState(true);
    const [leaveTypeId, setLeaveTypeId] = useState(null);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [session, setSession] = useState('full');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        Promise.all([AsyncStorage.getItem('job'), AsyncStorage.getItem('role')]).then(([jobValue, roleValue]) => {
            setDepartment(jobValue || '');
            setRole(roleValue || '');
        });
    }, []);

    // Đội Công trình: chỉ đội trưởng (role=leader) tự viết đơn được, nhân viên thường phải liên hệ đội trưởng.
    const mustContactLeader = department === CONG_TRINH_DEPARTMENT && role !== 'leader';

    useEffect(() => {
        if (department === null || mustContactLeader) return;
        apiGetLeaveTypes()
            .then((res) => {
                const types = res.data || [];
                setLeaveTypes(types);
                if (types.length > 0) setLeaveTypeId(types[0].id);
            })
            .catch((error) => Alert.alert('Lỗi', getErrorMessage(error)))
            .finally(() => setLoadingTypes(false));
    }, [department, mustContactLeader]);

    const sameDay = toDateStr(startDate) === toDateStr(endDate);
    const selectedLeaveType = leaveTypes.find((t) => t.id === leaveTypeId);
    const estimatedDays = session === 'full' ? countDays(startDate, endDate) : 0.5;

    useEffect(() => {
        if (!sameDay && session !== 'full') setSession('full');
    }, [sameDay]);

    const handleSubmit = async () => {
        if (!leaveTypeId) {
            Alert.alert('Lỗi', 'Vui lòng chọn loại nghỉ phép.');
            return;
        }
        if (endDate < startDate) {
            Alert.alert('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu.');
            return;
        }
        if (startDate.getFullYear() !== endDate.getFullYear()) {
            Alert.alert('Lỗi', 'Yêu cầu nghỉ phép phải nằm trong cùng 1 năm.');
            return;
        }
        if (reason.length > 255) {
            Alert.alert('Lỗi', 'Lý do không được vượt quá 255 ký tự.');
            return;
        }

        setIsSubmitting(true);
        try {
            await apiCreateLeaveRequest({
                leave_type_id: leaveTypeId,
                start_date: toDateStr(startDate),
                end_date: toDateStr(endDate),
                session,
                reason,
            });
            Alert.alert('Thành công', 'Tạo yêu cầu nghỉ phép thành công', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            Alert.alert('Lỗi', getErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    };

    const header = (
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: meta.color, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name={meta.icon} size={20} color="#ffffff" />
            </View>
            <Text style={{ flex: 1, color: '#ffffff', fontSize: 17, fontWeight: 'bold' }}>{meta.title}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="arrow-back" size={22} color="#3b82f6" />
            </TouchableOpacity>
        </View>
    );

    if (department === null) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                    {header}
                </SafeAreaView>
            </View>
        );
    }

    if (mustContactLeader) {
        return (
            <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                    {header}
                    <CongTrinhNotice />
                </SafeAreaView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#1e293b' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                {header}

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15 }} showsVerticalScrollIndicator={false}>
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Loại nghỉ phép *</Text>
                    <TouchableOpacity
                        onPress={() => !loadingTypes && setShowTypePicker(true)}
                        style={{ flexDirection: 'row', backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between', marginBottom: 18 }}
                    >
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>{loadingTypes ? 'Đang tải...' : (selectedLeaveType?.name || 'Chọn loại nghỉ phép...')}</Text>
                        <Ionicons name="chevron-down-outline" size={20} color={meta.color} />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Từ ngày *</Text>
                            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={{ backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, paddingHorizontal: 10, height: 45, justifyContent: 'center' }}>
                                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>{toDateStr(startDate)}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Đến ngày *</Text>
                            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={{ backgroundColor: '#334155', borderRadius: 15, borderWidth: 2, borderColor: meta.color, paddingHorizontal: 10, height: 45, justifyContent: 'center' }}>
                                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>{toDateStr(endDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {showStartPicker && (
                        <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowStartPicker(Platform.OS === 'ios'); if (date) { setStartDate(date); if (date > endDate) setEndDate(date); } }} />
                    )}
                    {showEndPicker && (
                        <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, date) => { setShowEndPicker(Platform.OS === 'ios'); if (date) setEndDate(date); }} />
                    )}

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                        Buổi nghỉ {!sameDay && '(chỉ chọn được khi từ ngày = đến ngày)'}
                    </Text>
                    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                        {Object.entries(LEAVE_SESSION_LABELS).map(([key, label]) => {
                            const disabled = !sameDay && key !== 'full';
                            return (
                                <TouchableOpacity
                                    key={key}
                                    disabled={disabled}
                                    onPress={() => setSession(key)}
                                    style={{ flex: 1, marginRight: 6, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: session === key ? meta.color : '#334155', opacity: disabled ? 0.4 : 1 }}
                                >
                                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>{label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', borderRadius: 12, padding: 12, marginBottom: 18 }}>
                        <Text style={{ color: '#c4b5fd', fontSize: 12, textAlign: 'center' }}>Ước tính: {estimatedDays} ngày nghỉ (server sẽ tính lại chính xác)</Text>
                    </View>

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Lý do (tối đa 255 ký tự)</Text>
                    <TextInput
                        style={{ backgroundColor: '#334155', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 14, color: 'white', minHeight: 90, borderWidth: 2, borderColor: '#475569', marginBottom: 20 }}
                        placeholder='Ví dụ: Việc gia đình...'
                        placeholderTextColor='#64748b'
                        multiline
                        maxLength={255}
                        value={reason}
                        onChangeText={setReason}
                    />

                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting || loadingTypes} style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: meta.color, borderRadius: 27.5, opacity: (isSubmitting || loadingTypes) ? 0.7 : 1 }}>
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Gửi đơn</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>

                <Modal visible={showTypePicker} transparent animationType="slide" onRequestClose={() => setShowTypePicker(false)}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowTypePicker(false)}>
                        <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20, paddingBottom: 30, maxHeight: 320 }}>
                            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 }}>Chọn loại nghỉ phép</Text>
                            <FlatList
                                data={leaveTypes}
                                keyExtractor={(item) => String(item.id)}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{ paddingVertical: 15, paddingHorizontal: 20, backgroundColor: item.id === leaveTypeId ? 'rgba(139, 92, 246, 0.15)' : 'transparent' }}
                                        onPress={() => { setLeaveTypeId(item.id); setShowTypePicker(false); }}
                                    >
                                        <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>{item.name}</Text>
                                        {!!item.description && <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{item.description}</Text>}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default LeaveRequestFormScreen;
