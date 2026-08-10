import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View, StatusBar, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
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
    { key: 'changePassword', label: 'Đổi mật khẩu', icon: 'lock-closed-outline', route: 'ChangePass' },
    { key: 'appInfo', label: 'Thông tin', icon: 'information-circle-outline', route: 'AppInfo' },
    { key: 'logout', label: 'Đăng xuất', icon: 'log-out-outline' },
];

const AdminHomeScreen = ({ navigation, onLogout }) => {
    const insets = useSafeAreaInsets();
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

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: async () => {
                    if (onLogout) {
                        await onLogout();
                    }
                },
            },
        ]);
    };

    const handleTabPress = (tab) => {
        if (tab.key === 'logout') {
            handleLogout();
            return;
        }
        if (tab.route) {
            navigation.navigate(tab.route);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <StatusBar barStyle='dark-content' backgroundColor="#f8fafc" />

                <View style={{ marginTop: isAndroid15 ? 25 : 0, paddingHorizontal: 12, paddingTop: 8 }}>
                    <AdminHeaderScreen />
                </View>

                <ScrollView
                    style={{ flex: 1, marginTop: 16 }}
                    contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 }}>CHỨC NĂNG QUẢN LÝ</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {GRID_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                onPress={() => handleGridPress(item)}
                                activeOpacity={0.85}
                                style={{ width: '31%', backgroundColor: '#ffffff', borderRadius: 18, paddingVertical: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}
                            >
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                    <Ionicons name={item.icon} size={22} color="#ffffff" />
                                </View>
                                <Text style={{ color: '#1e293b', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>{item.title}</Text>
                                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '500', textAlign: 'center', marginTop: 2 }}>{item.subtitle}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 }}>DUYỆT ĐƠN TỪ NHÂN VIÊN</Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AdminApprovals')}
                        activeOpacity={0.85}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }}
                    >
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                            <Ionicons name="checkmark-done-outline" size={22} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#1e293b', fontSize: 15, fontWeight: '700' }}>Duyệt đơn</Text>
                            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 }}>Chấm công · Tăng ca · Nghỉ phép</Text>
                        </View>
                        {pendingCount > 0 && (
                            <View style={{ backgroundColor: '#ef4444', minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginRight: 8 }}>
                                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>{pendingCount}</Text>
                            </View>
                        )}
                        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                </ScrollView>

                <View style={{ flexDirection: 'row', height: 64 + insets.bottom, paddingBottom: insets.bottom, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                    {BOTTOM_TABS.map((tab) => {
                        const isHome = tab.key === 'home';
                        const tabColor = tab.key === 'logout' ? '#ef4444' : isHome ? '#3b82f6' : '#64748b';
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => handleTabPress(tab)}
                                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                                activeOpacity={0.7}
                            >
                                <View style={{ backgroundColor: isHome ? 'rgba(59, 130, 246, 0.12)' : 'transparent', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 14 }}>
                                    <Ionicons name={tab.icon} size={22} color={tabColor} />
                                </View>
                                <Text style={{ color: tabColor, fontSize: 11, fontWeight: '600', marginTop: 4 }}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminHomeScreen;
