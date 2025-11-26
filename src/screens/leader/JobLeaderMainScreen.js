import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StatusBar, Platform, TouchableOpacity, Modal, Alert, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssignJobScreen from './AssignJobScreen';
import GetJobLeaderScreen from './GetJobLeaderScreen';
import JobWorkingScreen from './JobWorkingScreen';
import HistoryTeamScreen from './HistoryTeamScreen';
import AttendanceListScreen from './AttendanceListScreen';
import { apiGetJobHistory, apiCheckStatusUser } from '../../services/apiService';

const Tab = createBottomTabNavigator();

const JobLeaderMainScreen = ({ navigation, route, onLogout }) => {
    const insets = useSafeAreaInsets();
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [isGetJob, setIsGetJob] = useState(false);
    const [valueJob, setValueJob] = useState('');
    const [idJob, setIdJob] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                const username = await AsyncStorage.getItem('username');
                const jobb = await AsyncStorage.getItem('job');
                const avatar = await AsyncStorage.getItem('avatar');

                id && setUserID(id);
                username && setUsername(username);
                jobb && setJob(jobb);
                avatar && setAvatar(avatar);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserData();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getHistoryJob();
            checkUserStatus();
        }, [])
    );

    const getHistoryJob = async () => {
        try {
            const id = await AsyncStorage.getItem('userID');
            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);

            if (filteredData.length > 0) {
                setValueJob(filteredData[0].noi_dung);
                setIdJob(filteredData[0].id);
            } else {
                setValueJob('');
                setIdJob('');
            }
        } catch (error) {
            console.error('Lỗi lấy lịch sử Job:', error);
        }
    };

    const checkUserStatus = async () => {
        try {
            const id = await AsyncStorage.getItem('userID');
            const res = await apiCheckStatusUser(id);
            const { message } = res;
            setIsGetJob(message === 1);
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái nhận việc:', error);
        }
    };

    const handleMenuOption = (option) => {
        setShowMenuModal(false);

        switch (option) {
            case 'history':
                navigation.navigate('JobHistory');
                break;
            case 'timesheet':
                navigation.navigate('BangChamCong');
                break;
            case 'changePassword':
                navigation.navigate('ChangePass');
                break;
            case 'appInfo':
                navigation.navigate('AppInfo');
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                break;
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('🚪 Leader: User confirmed logout');
                            if (onLogout) {
                                console.log('📞 Leader: Calling onLogout callback');
                                await onLogout();
                            } else {
                                console.log('⚠️ Leader: No onLogout callback, clearing storage manually');
                                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                            }
                        } catch (error) {
                            console.error('Lỗi khi đăng xuất:', error);
                        }
                    }
                }
            ]
        );
    };

    const renderMenuModal = () => {
        const menuOptions = [
            { key: 'history', title: 'Lịch sử công việc', icon: 'time-outline', color: '#06d6a0' },
            { key: 'timesheet', title: 'Bảng chấm công', icon: 'calendar-outline', color: '#118ab2' },
            { key: 'changePassword', title: 'Đổi mật khẩu', icon: 'lock-closed-outline', color: '#ffd166' },
            { key: 'appInfo', title: 'Thông tin ứng dụng', icon: 'information-circle-outline', color: '#3b82f6' },
            { key: 'logout', title: 'Đăng xuất', icon: 'log-out-outline', color: '#ff6b6b' },
        ];

        return (
            <Modal visible={showMenuModal} transparent={true} animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
                <TouchableOpacity style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'}} activeOpacity={1} onPress={() => setShowMenuModal(false)}>
                    <View style={{position: 'absolute', top: insets.top + 70, right: 20, backgroundColor: '#1a2332', borderRadius: 15, minWidth: 200, elevation: 15, borderWidth: 2, borderColor: '#10b981'}}>
                        {menuOptions.map((option, index) => (
                            <TouchableOpacity key={option.key} style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: index < menuOptions.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.1)'}} onPress={() => handleMenuOption(option.key)}>
                                <Ionicons name={option.icon} size={20} color={option.color} style={{marginRight: 12}} />
                                <Text style={{color: 'white', fontSize: 16, fontWeight: '600'}}>{option.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={{flex: 1, backgroundColor: '#1e293b'}}>
            <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
            <Tab.Navigator
                initialRouteName="AssignJob"
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {backgroundColor: '#334155', borderTopWidth: 1, borderTopColor: '#475569', height: 50 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 5},
                    tabBarActiveTintColor: '#10b981',
                    tabBarInactiveTintColor: '#94a3b8',
                    tabBarLabelStyle: {fontSize: 11, fontWeight: '600'}
                }}
            >
                <Tab.Screen
                    name="AssignJob"
                    options={{tabBarLabel: 'Giao việc', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="account-edit" color={color} size={24} />)}}
                >
                    {props => <AssignJobScreen {...props} navigation={navigation} job={job} onLogout={onLogout} />}
                </Tab.Screen>
                <Tab.Screen
                    name="GetJobLeader"
                    options={{tabBarLabel: 'Nhận việc', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="star" color={color} size={24} />)}}
                >
                    {props => <GetJobLeaderScreen {...props} navigation={navigation} isGetJob={isGetJob} setIsGetJob={setIsGetJob} valueJob={valueJob} setValueJob={setValueJob} idJob={idJob} setIdJob={setIdJob} onLogout={onLogout} />}
                </Tab.Screen>
                <Tab.Screen
                    name="JobWorking"
                    options={{tabBarLabel: 'Đang làm', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="account-wrench" color={color} size={24} />)}}
                >
                    {props => <JobWorkingScreen {...props} navigation={navigation} team={job} />}
                </Tab.Screen>
                <Tab.Screen
                    name="HistoryTeam"
                    options={{tabBarLabel: 'L.Sử đội', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="clipboard-text-clock" color={color} size={24} />)}}
                >
                    {props => <HistoryTeamScreen {...props} navigation={navigation} team={job} />}
                </Tab.Screen>
                <Tab.Screen
                    name="AttendanceList"
                    options={{tabBarLabel: 'Nv ĐDanh', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="account-box-multiple" color={color} size={24} />)}}
                >
                    {props => <AttendanceListScreen {...props} navigation={navigation} team={job} />}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
};

export default JobLeaderMainScreen;
