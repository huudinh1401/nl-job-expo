import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { apiSearchJobTheoNgayVaTeam } from '../../services/apiService';
import { ADMIN_TEAMS } from '../../constants/adminTeams';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AdminTeamHistoryScreen = ({ navigation, route }) => {
    const team = ADMIN_TEAMS.find((t) => t.key === route.params?.team) || ADMIN_TEAMS[0];

    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [history, setHistory] = useState([]);
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [valueDate, setValueDate] = useState(getCurrentDate());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        getHistory(valueDate);
    }, []);

    const getHistory = async (date) => {
        try {
            const res = await apiSearchJobTheoNgayVaTeam(date, team.apiPart);
            setHistory(res.data);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    };

    const handleConfirm = (event, date) => {
        if (Platform.OS === 'android') {
            setDatePickerVisibility(false);
        }
        if (date) {
            const formattedDate = date.toISOString().split('T')[0];
            setValueDate(formattedDate);
            setSelectedDate(date);
            if (Platform.OS === 'ios') {
                setDatePickerVisibility(false);
            }
            getHistory(formattedDate);
        }
    };

    const ItemView = ({ item, index }) => (
        <View style={{ marginHorizontal: 12, marginVertical: 6, backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 30, height: 30, backgroundColor: team.color, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 15 }}>
                    <Image source={{ uri: item.avatar }} style={{ width: 45, height: 45, borderRadius: 22 }} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '700', marginBottom: 4 }}>{item.name}</Text>
                        <View style={{ backgroundColor: team.color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>{item.department}</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={{ marginTop: 15, backgroundColor: '#f1f5f9', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ color: '#334155', fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' }}>{item.noi_dung}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
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

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
                <StatusBar barStyle='light-content' backgroundColor={team.color} />
                <View style={{ backgroundColor: team.color, paddingHorizontal: 15, paddingBottom: 15, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, paddingTop: isAndroid15 ? 35 : 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 7, borderRadius: 15, marginRight: 15 }}>
                                <Ionicons name={team.icon} size={24} color="#ffffff" />
                            </View>
                            <View>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#ffffff' }}>Lịch Sử Công Việc</Text>
                                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.85)' }}>Đội {team.label}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 8, borderRadius: 12 }}>
                            <Ionicons name="arrow-back" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ marginHorizontal: 12, marginTop: 10, backgroundColor: '#ffffff', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Chọn ngày</Text>
                    <TouchableOpacity
                        onPress={() => setDatePickerVisibility(true)}
                        style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 15, borderWidth: 2, borderColor: team.color, alignItems: 'center', paddingHorizontal: 12, height: 45, justifyContent: 'space-between' }}
                    >
                        <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: '500' }}>{valueDate}</Text>
                        <Ionicons name="calendar-outline" size={22} color={team.color} />
                    </TouchableOpacity>
                    {isDatePickerVisible && (
                        <DateTimePicker value={selectedDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleConfirm} />
                    )}
                </View>

                <View style={{ flex: 1, marginTop: 10 }}>
                    {history.length > 0 ? (
                        <FlatList data={history} keyExtractor={(item, index) => index.toString()} renderItem={ItemView} showsVerticalScrollIndicator={false} />
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <View style={{ backgroundColor: '#ffffff', padding: 30, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                                <Ionicons name="briefcase-outline" size={60} color="#cbd5e1" />
                                <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' }}>Không có dữ liệu</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 5, textAlign: 'center' }}>Thử chọn ngày khác</Text>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminTeamHistoryScreen;
