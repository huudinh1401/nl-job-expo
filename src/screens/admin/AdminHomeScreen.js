import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StatusBar, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import AdminHeaderScreen from './AdminHeaderScreen';
import { ADMIN_TEAMS } from '../../constants/adminTeams';
import { apiGetAttendanceReports, apiGetOvertimeReports, apiGetLeaveRequests } from '../../services/apiService';
import useLatestRequest from '../../hooks/useLatestRequest';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const GRID_ITEMS = [
    ...ADMIN_TEAMS.map((team) => ({
        key: `history-${team.key}`,
        title: `LS ${team.label}`,
        subtitle: 'Lịch sử công việc',
        icon: 'time-outline',
        color: team.color,
        route: 'AdminTeamHistory',
        params: { team: team.key },
    })),
    ...ADMIN_TEAMS.map((team) => ({
        key: `working-${team.key}`,
        title: team.label,
        subtitle: 'Đang làm việc',
        icon: team.icon,
        color: team.color,
        route: 'AdminTeamWorking',
        params: { team: team.key },
    })),
];

const BOTTOM_TABS = [
    { key: 'home', label: 'Trang chủ', icon: 'grid-outline' },
    { key: 'notifications', label: 'Thông báo', icon: 'notifications-outline', route: 'AdminNotifications' },
    { key: 'changePassword', label: 'Đổi mật khẩu', icon: 'lock-closed-outline', route: 'ChangePass' },
    { key: 'profile', label: 'Cá nhân', icon: 'person-outline', route: 'AdminProfile' },
];

const AdminHomeScreen = ({ navigation }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const isMountedRef = useRef(true);
    const { start, isLatest } = useLatestRequest();

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        return () => { isMountedRef.current = false; };
    }, []);

    // Chỉ tính pending trong tháng hiện tại (API không hỗ trợ lấy "tất cả thời gian" trong 1 lần gọi).
    const fetchPendingCount = useCallback(() => {
        const requestId = start();
        Promise.all([
            apiGetAttendanceReports({ status: 'pending' }),
            apiGetOvertimeReports({ status: 'pending' }),
            apiGetLeaveRequests({ status: 'pending' }),
        ])
            .then(([attendanceRes, overtimeRes, leaveRes]) => {
                if (!isMountedRef.current || !isLatest(requestId)) return;
                const total = (attendanceRes.data?.length || 0) + (overtimeRes.data?.length || 0) + (leaveRes.data?.length || 0);
                setPendingCount(total);
            })
            .catch(() => {});
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchPendingCount();
        }, [fetchPendingCount])
    );

    // Cập nhật badge ngay khi có push notification tới lúc app đang mở (không cần biết trước "type" cụ thể).
    useEffect(() => {
        const subscription = Notifications.addNotificationReceivedListener(() => {
            fetchPendingCount();
        });
        return () => subscription.remove();
    }, [fetchPendingCount]);

    const handleGridPress = (item) => navigation.navigate(item.route, item.params);

    const handleTabPress = (tab) => {
        if (tab.route) {
            navigation.navigate(tab.route);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />

                <View style={{ marginTop: isAndroid15 ? 25 : 0, paddingHorizontal: 12, paddingTop: 8 }}>
                    <AdminHeaderScreen />
                </View>

                <ScrollView
                    style={{ flex: 1, marginTop: 16 }}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 }}>CHỨC NĂNG QUẢN LÝ</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {GRID_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => handleGridPress(item)}
                                activeOpacity={0.85}
                                style={{ width: '31%', backgroundColor: '#334155', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#475569' }}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name={item.icon} size={22} color="#ffffff" />
                                </View>
                                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{item.title}</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 }}>{item.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 }}>DUYỆT ĐƠN TỪ NHÂN VIÊN</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AdminApprovals')}
                        activeOpacity={0.85}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#475569' }}
                    >
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                            <Ionicons name="checkmark-done-outline" size={22} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>Duyệt đơn</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>Chấm công · Tăng ca · Nghỉ phép</Text>
                        </View>
                        {pendingCount > 0 && (
                            <View style={{ backgroundColor: '#ef4444', minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginRight: 8 }}>
                                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{pendingCount}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                </ScrollView>

                <View style={{ flexDirection: 'row', height: 64, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#334155', paddingBottom: Platform.OS === 'ios' ? 4 : 0 }}>
                    {BOTTOM_TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => handleTabPress(tab)}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={tab.icon} size={22} color={tab.key === 'home' ? '#3b82f6' : '#94a3b8'} />
                            <Text style={{ color: tab.key === 'home' ? '#3b82f6' : '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 }}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminHomeScreen;
