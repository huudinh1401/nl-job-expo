import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, Alert, Image, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { apiGetJobHistory, apiSearchJobTheoNgayVaTeam } from '../../services/apiService';

const arrTeam = [{ key: '0', team: 'Tất cả' }, { key: '1', team: 'Công trình' }, { key: '2', team: 'Máy tính' }, { key: '3', team: 'Photocopy' }];
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AdminHistoryScreen = ({ navigation }) => {
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [history, setHistory] = useState([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTeamVisible, setTeamVisibility] = useState(false);
    const [valueDate, setValueDate] = useState(getCurrentDate());
    const [valueTeam, setValueTeam] = useState('Tất cả');
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        getHistory();
    }, []);

    const ItemView = ({ item, index }) => {
        return (
            <View style={{ marginHorizontal: 12, marginVertical: 6, backgroundColor: '#374151', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#475569', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151' }}>
                    <View style={{ width: 30, height: 30, backgroundColor: '#6366f1', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#6366f1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 5 }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15, backgroundColor: '#374151' }}>
                        <View style={{ elevation: 4 }}>
                            <Image source={{ uri: item.avatar }} style={{ width: 45, height: 45, borderRadius: 22 }} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12, backgroundColor: '#374151' }}>
                            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{item.name}</Text>
                            <View style={{ backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>{item.department}</Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={{ marginTop: 15, backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' }}>{item.noi_dung}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, backgroundColor: '#374151' }}>
                    <View style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flex: item.end ? 0.45 : 1, alignItems: 'center' }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>Bắt đầu</Text>
                        {item.start && <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{item.start}</Text>}
                    </View>
                    {item.end && (
                        <View style={{ backgroundColor: '#f59e0b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, flex: 0.45, alignItems: 'center' }}>
                            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600', marginBottom: 2 }}>Kết thúc</Text>
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>{item.end}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const ItemViewTeam = ({ item, index }) => {
        return (
            <View style={{ marginHorizontal: 20, marginVertical: 2, backgroundColor: '#ffffff' }}>
                <TouchableOpacity style={{ paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 12, marginVertical: 2 }} onPress={() => handleSelectTeam(item.team)}>
                    <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>{item.team}</Text>
                </TouchableOpacity>
                {index < arrTeam.length - 1 && <View style={{ height: 1, backgroundColor: '#e5e7eb', marginHorizontal: 20 }} />}
            </View>
        );
    };

    const getHistory = async () => {
        try {
            const res = await apiGetJobHistory();
            const data = res.data.slice(0, 50);
            setHistory(data);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    };

    const handleConfirm = async (event, date) => {
        if (Platform.OS === 'android') {
            setDatePickerVisibility(false);
        }
        if (date) {
            const formattedDate = date.toISOString().split("T")[0];
            setValueDate(formattedDate);
            setSelectedDate(date);
            if (Platform.OS === 'ios') {
                setDatePickerVisibility(false);
            }
            try {
                if (valueTeam === 'Tất cả') {
                    const res = await apiSearchJobTheoNgayVaTeam(formattedDate);
                    setHistory(res.data);
                } else {
                    const res = await apiSearchJobTheoNgayVaTeam(formattedDate, valueTeam);
                    setHistory(res.data);
                }
            } catch (error) {
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
                }
            }
        }
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const handleSelectTeam = async (team) => {
        setValueTeam(team);
        setTeamVisibility(false);
        try {
            if (team === 'Tất cả') {
                const res = await apiSearchJobTheoNgayVaTeam(valueDate);
                setHistory(res.data);
            } else {
                const res = await apiSearchJobTheoNgayVaTeam(valueDate, team);
                setHistory(res.data);
            }
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <StatusBar barStyle={'light-content'} backgroundColor="#0f172a" />
                <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 15, paddingBottom: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: isAndroid15 ? 35 : 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a' }}>
                            <View style={{ backgroundColor: '#6366f1', padding: 7, borderRadius: 15, marginRight: 15 }}>
                                <Ionicons name="time-outline" size={24} color="#ffffff" />
                            </View>
                            <View style={{ backgroundColor: '#0f172a' }}>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Lịch Sử Công Việc</Text>
                                <Text style={{ fontSize: 14, color: '#a5b4fc' }}>Theo dõi hoạt động nhân viên</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#6366f1', padding: 8, borderRadius: 12 }}>
                            <Ionicons name="arrow-back" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: '#374151', borderRadius: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#374151' }}>
                        <Ionicons name="filter" size={20} color="#00FFFF" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#00FFFF' }}>Bộ lọc tìm kiếm</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151' }}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chọn ngày</Text>
                            <View style={{ flexDirection: 'row', backgroundColor: '#475569', borderRadius: 15, borderWidth: 2, borderColor: '#6366f1', alignItems: 'center', paddingHorizontal: 12, height: 45 }}>
                                <TextInput style={{ color: '#ffffff', flex: 1, fontSize: 14, fontWeight: '500', textAlign: 'center' }} placeholder='Chọn ngày...' placeholderTextColor='#94a3b8' value={valueDate} editable={false} />
                                <TouchableOpacity onPress={showDatePicker}>
                                    <Ionicons name="calendar-outline" size={22} color="#00FFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chọn đội</Text>
                            <View style={{ flexDirection: 'row', backgroundColor: '#475569', borderRadius: 15, borderWidth: 2, borderColor: '#10b981', alignItems: 'center', paddingHorizontal: 12, height: 45 }}>
                                <TextInput style={{ color: '#ffffff', flex: 1, fontSize: 14, fontWeight: '500', textAlign: 'center' }} placeholder='Chọn đội...' placeholderTextColor='#94a3b8' value={valueTeam} editable={false} />
                                <TouchableOpacity onPress={() => setTeamVisibility(!isTeamVisible)}>
                                    <Ionicons name="chevron-down-outline" size={22} color="#10b981" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    {isDatePickerVisible && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={handleConfirm}
                        />
                    )}
                </View>
                <View style={{ flex: 1, marginTop: 10 }}>
                    {history.length > 0 ? (
                        <FlatList data={history} keyExtractor={(item, index) => index.toString()} renderItem={ItemView} showsVerticalScrollIndicator={false} />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e293b' }}>
                            <View style={{ backgroundColor: '#374151', padding: 30, borderRadius: 20, alignItems: 'center' }}>
                                <Ionicons name="briefcase-outline" size={60} color="#6b7280" />
                                <Text style={{ color: '#9ca3af', fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' }}>Không có dữ liệu</Text>
                                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 5, textAlign: 'center' }}>Thử thay đổi bộ lọc tìm kiếm</Text>
                            </View>
                        </View>
                    )}
                </View>
                <Modal visible={isTeamVisible} transparent={true} animationType={'slide'} onRequestClose={() => { setTeamVisibility(!isTeamVisible) }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
                        <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20, paddingBottom: 30, maxHeight: 300, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15, backgroundColor: '#ffffff' }}>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>Chọn đội làm việc</Text>
                                <TouchableOpacity style={{ backgroundColor: '#6b7280', width: 35, height: 35, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }} onPress={() => { setTeamVisibility(false); }}>
                                    <Ionicons name="close" size={20} color="#ffffff" />
                                </TouchableOpacity>
                            </View>
                            <FlatList data={arrTeam} keyExtractor={(item, index) => index.toString()} renderItem={ItemViewTeam} />
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

export default AdminHistoryScreen;
