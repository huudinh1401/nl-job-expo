import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, Platform, StatusBar, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { apiGetAllUser, apiNvTeamDiemDanh } from '../../services/apiService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AttendanceListScreen = ({ navigation, team }) => {
    const [diemDanhNv, setDiemDanhNV] = useState([]);
    const [homNay, setHomNay] = useState(null);

    useFocusEffect(
        useCallback(() => {
            getDsNvDiemDanh();
        }, [team])
    );

    const getDsNvDiemDanh = async () => {
        try {
            const today = new Date();
            today.setHours(today.getHours() + 7);
            const formattedDate = today.toISOString().split('T')[0];
            setHomNay(formattedDate);

            const resAllUser = await apiGetAllUser();

            let userTeam;
            let allAttendanceData = [];

            if (team === 'Dự án') {
                const allDepartments = ['Dự án', 'Máy tính', 'Công trình', 'Photocopy'];
                const filteredData = resAllUser.filter(record =>
                    allDepartments.includes(record.part)
                );
                userTeam = filteredData.map(item => item.username);

                const attendancePromises = allDepartments.map(dept =>
                    apiNvTeamDiemDanh(dept, formattedDate)
                );
                const attendanceResults = await Promise.all(attendancePromises);

                attendanceResults.forEach(res => {
                    if (res.data) {
                        allAttendanceData = [...allAttendanceData, ...res.data];
                    }
                });
            } else {
                const filteredData = resAllUser.filter(record => record.part === team);
                userTeam = filteredData.map(item => item.username);

                const res = await apiNvTeamDiemDanh(team, formattedDate);
                if (res.data) {
                    allAttendanceData = res.data;
                }
            }

            if (allAttendanceData.length > 0) {
                const userDiemDanh = allAttendanceData.map(item => item.username);
                const userAttendance = userTeam.map(user => ({
                    username: user,
                    status: userDiemDanh.includes(user) ? 'Đi làm' : 'Vắng'
                }));
                setDiemDanhNV(userAttendance);
            } else {
                const userDiemDanh = [];
                const userAttendance = userTeam.map(user => ({
                    username: user,
                    status: userDiemDanh.includes(user) ? 'Đi làm' : 'Vắng'
                }));
                setDiemDanhNV(userAttendance);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
        }
    };

    const ItemView = ({ item, index }) => {
        const isPresent = item.status === 'Đi làm';
        return (
            <View style={{width: (width - 20) / 2, height: 80, margin: 3, backgroundColor: '#475569', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3}}>
                <View style={{flex: 1, padding: 12, justifyContent: 'space-between'}}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: '#f1f5f9', fontSize: isTablet ? 18 : 14, textAlign: 'center', fontWeight: 'bold'}}>{item.username}</Text>
                    </View>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                        <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: isPresent ? '#10b981' : '#ef4444', marginRight: 6}} />
                        <Text style={{color: isPresent ? '#10b981' : '#ef4444', fontSize: isTablet ? 16 : 12, fontWeight: '600'}}>{item.status}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{flex: 1, backgroundColor: '#1e293b'}}>
            <SafeAreaView style={{flex: 1}}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />

                <View style={{paddingHorizontal: 8, paddingVertical: 12, marginTop: isAndroid15 ? 25 : 0}}>
                    <View style={{backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
                            <MaterialIcons name="people" size={20} color="#00FFFF" style={{marginRight: 8}} />
                            <Text style={{color: '#00FFFF', fontSize: 16, fontWeight: 'bold'}}>Nhân viên điểm danh: {team}</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                            <MaterialIcons name="event" size={20} color="#FFFF00" style={{marginRight: 8}} />
                            <Text style={{color: '#FFFF00', fontSize: 16, fontWeight: 'bold'}}>Ngày: {homNay}</Text>
                        </View>
                    </View>
                </View>

                <View style={{flex: 1, paddingHorizontal: 4}}>
                    <FlatList data={diemDanhNv} keyExtractor={(item, index) => index.toString()} horizontal={false} numColumns={2} renderItem={ItemView} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 16}} />
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AttendanceListScreen;
