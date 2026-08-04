import { useState, useEffect } from 'react';
import { Text, View, Alert, ActivityIndicator, StatusBar, TouchableOpacity, TextInput, Modal, ScrollView, Image, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../../services/socketService';
import { apiCheckStatusUser, apiFinishJob, apiGetJob, apiGetJobHistory, apiGetUserInfo, apiUpdateStatusUser, apiUpdateToaDo } from '../../services/apiService';
import ExpoGoWarning from '../../components/ExpoGoWarning';
import { canViewAllReports } from '../../constants/reportsConfig';

const JobScreen = ({ navigation, route, onLogout }) => {
    const insets = useSafeAreaInsets();
    const [txtGhiChu, setTxtGhiChu] = useState('');
    const [statusUser, setStatusUser] = useState('');
    const [jobWorking, setJobWorking] = useState([]);
    const [visible, setVisible] = useState(false);
    const [isLoadingFinish, setIsLoadingFinish] = useState(false);
    const [isLoadingGetJob, setIsLoadingGetJob] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [idJob, setIdJob] = useState('');
    const [location, setLocation] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [tempNote, setTempNote] = useState('');
    const [isGetJob, setIsGetJob] = useState(false);
    const [valueJob, setValueJob] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);

    const requestLocationPermission = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert();
                return;
            }
        } catch (error) {
            console.error('Lỗi khi yêu cầu quyền truy cập vị trí:', error);
        }
    };

    const showAlert = () => {
        Alert.alert(
            'Yêu cầu quyền truy cập vị trí',
            'Ứng dụng cần truy cập vị trí của bạn trong thời gian làm việc để lưu trữ vị trí này trên cơ sở dữ liệu.',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đi đến cài đặt', onPress: () => Location.requestForegroundPermissionsAsync() },
            ]
        );
    };

    const updateLocation = async () => {
        const fetchUpdateLocationJobs = async (id, toa_do) => {
            try {
                await apiUpdateToaDo(id, toa_do);
            } catch (error) {
                console.log('Lỗi update location:', error);
            }
        };

        try {
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setLocation(location);
            fetchUpdateLocationJobs(idJob, `${latitude}, ${longitude}`);
        } catch (error) {
            console.error(`Lỗi lấy vị trí: ${error.message}`);
        }
    };

    useEffect(() => {
        requestLocationPermission();
        const fetchAndSetUserData = async () => {
            try {
                let id;
                if (route && route.params && route.params.userIDD) {
                    id = route.params.userIDD;
                } else {
                    id = await AsyncStorage.getItem('userID');
                }
                if (id) {
                    setUserID(id);
                    const username = await AsyncStorage.getItem('username');
                    const job = await AsyncStorage.getItem('job');
                    const avatar = await AsyncStorage.getItem('avatar');
                    username && setUsername(username);
                    job && setJob(job);
                    avatar && setAvatar(avatar);

                    socketService.connect(id);
                    socketService.on('jobsent', (data) => {
                        getHistoryJob(id);
                        checkUserStatus(id);
                    });

                    getStatusUser(id);
                    getHistoryJob(id);
                    checkUserStatus(id);
                } else {
                    console.error('User ID not found');
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        }
        fetchAndSetUserData();
    }, []);

    useEffect(() => {
        console.log('isGetJob', isGetJob);
        if (isGetJob) {
            const id = setInterval(() => {
                if (userID !== '78') {
                    updateLocation();
                }
            }, 300000); // 5 phút
            setIntervalId(id);
        }
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };

    }, [isGetJob]);

    // Kênh dự phòng khi socket 'jobsent' không tới (không có nơi nào trong app emit sự kiện này,
    // chắc là do backend bắn) — dùng luôn push notification (đã xác nhận tới được) để làm mới
    // giao diện công việc lúc app đang mở.
    useEffect(() => {
        if (!userID) return;
        const subscription = Notifications.addNotificationReceivedListener((notification) => {
            const type = notification?.request?.content?.data?.type;
            if (['new_job', 'update_job', 'edit_job', 'delete_job'].includes(type)) {
                getHistoryJob(userID);
                checkUserStatus(userID);
            }
        });
        return () => subscription.remove();
    }, [userID]);

    // App bị đẩy xuống nền (chưa kill) rồi mở lại: màn hình KHÔNG mount lại nên effect lúc mount
    // không tự chạy, và notification-listener ở trên cũng không đảm bảo bắt được lúc app đang ở nền
    // (đặc biệt iOS hạn chế JS chạy nền). Bắt sự kiện app quay lại foreground để tự làm mới.
    useEffect(() => {
        if (!userID) return;
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                getHistoryJob(userID);
                checkUserStatus(userID);
            }
        });
        return () => subscription.remove();
    }, [userID]);

    const getHistoryJob = async (id) => {
        try {
            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);
            if (filteredData.length > 0) {
                setJobWorking(filteredData);
                setValueJob(filteredData[0].noi_dung);
                setIdJob(filteredData[0].id);
            } else {
                setJobWorking(filteredData);
                setValueJob('');
                setIdJob('');
            }
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi lấy lịch sử Job!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    };

    const checkUserStatus = async (userID) => {
        try {
            const res = await apiCheckStatusUser(userID);
            const { message } = res;
            if (message === 1) {
                setIsGetJob(true);
            } else {
                setIsGetJob(false);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái nhận việc:', error);
        }
    };
    const updateStatusUser = async (id, stt) => {
        try {
            await apiUpdateStatusUser(id, stt);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    };

    const getStatusUser = async (id) => {
        try {
            const res = await apiGetUserInfo(id);
            setStatusUser(res.status);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    };

    const handleGetJob = () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        setIsLoadingGetJob(true);

        const confirmGetJob = () => {
            Alert.alert(
                'Xác nhận nhận việc',
                'Bạn có chắc chắn muốn nhận công việc này không?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => { setIsLoadingGetJob(false); },
                    },
                    {
                        text: 'OK',
                        onPress: () => { getCurrentPosition(); },
                    },
                ]
            );
        };

        const fetchJobs = async (id, status, start, toa_do) => {
            try {
                await apiGetJob(id, status, start, toa_do);
                await updateStatusUser(userID, 1);
                setIsGetJob(true);
                setStatusUser(1);
                socketService.emit('getJob', { message: 'Toi da nhan Job' });
            } catch (error) {
                console.log(error);
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi nhận việc!', 'Vui lòng kiểm tra lại kết nối mạng.');
                }
            } finally {
                setIsLoadingGetJob(false);
            }
        };

        const getCurrentPosition = async () => {
            if (userID === '78') {
                const fixedLatitude = 10.9488999;
                const fixedLongitude = 108.1080306;
                fetchJobs(idJob, 1, currentTime, `${fixedLatitude}, ${fixedLongitude}`);
                return;
            }

            try {
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                setLocation(location);
                fetchJobs(idJob, 1, currentTime, `${latitude}, ${longitude}`);
            } catch (error) {
                console.error(`Lỗi lấy vị trí: ${error.message}`);
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                setIsLoadingGetJob(false);
            }
        };

        confirmGetJob();
    };

    const handleFinishJob = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const status = 0;
        setIsLoadingFinish(true);

        const confirmFinishJob = () => {
            Alert.alert(
                'Xác nhận hoàn thành công việc',
                'Bạn đã chắc chắn hoàn thành công việc?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => { setIsLoadingFinish(false); },
                    },
                    {
                        text: 'OK',
                        onPress: () => { getCurrentPosition(); },
                    },
                ]
            );
        };

        const fetchFinishJobs = async (id, end, status, toa_do, note) => {
            try {
                await apiFinishJob(id, end, status, toa_do, note);
                await updateStatusUser(userID, 0);
                setIsGetJob(false);
                setJobWorking([]);
                setValueJob('');
                setTxtGhiChu('');
                setStatusUser(0);
                socketService.emit('getJob', { message: 'Toi da hoan thanh Job' });
            } catch (error) {
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi hoàn thành việc!', 'Vui lòng kiểm tra lại kết nối mạng.');
                }
            } finally {
                setIsLoadingFinish(false);
            }
        };

        const getCurrentPosition = async () => {
            try {
                let location = await Location.getCurrentPositionAsync({});
                const { latitude, longitude } = location.coords;
                setLocation(location);
                fetchFinishJobs(idJob, currentTime, status, `${latitude}, ${longitude}`, txtGhiChu);
            } catch (error) {
                console.error(`Lỗi lấy vị trí: ${error.message}`);
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                setIsLoadingFinish(false);
            }
        };

        confirmFinishJob();
    };

    const handleSaveNote = () => {
        setTxtGhiChu(tempNote);
        setShowNoteModal(false);
    };

    const handleDiemDanh = () => {
        // if (statusUser === 0) {
        navigation.navigate('ChamCong');
        // } else {
        //     Alert.alert('Bạn còn việc chưa hoàn thành!');
        // }
    };

    const handleReload = async () => {
        try {
            let id;
            if (route && route.params && route.params.userIDD) {
                id = route.params.userIDD;
            } else {
                id = await AsyncStorage.getItem('userID');
            }
            if (id) {
                setUserID(id);
                getHistoryJob(id);
                checkUserStatus(id);
            }
        } catch (error) {
            console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
        }
    };
    const handleMenuOption = (option) => {
        setShowMenuModal(false);

        switch (option) {
            case 'history':
                // Navigate to history screen
                navigation.navigate('JobHistory');
                break;
            case 'timesheet':
                // Navigate to timesheet screen
                navigation.navigate('BangChamCong');
                break;
            case 'changePassword':
                // Navigate to change password screen
                navigation.navigate('ChangePass');
                break;
            case 'appInfo':
                // Navigate to app info screen
                navigation.navigate('AppInfo');
                break;
            case 'reportsHub':
                navigation.navigate('ReportsHub');
                break;
            case 'viewAllReports':
                navigation.navigate('AdminApprovals');
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
                            console.log('🚪 JobScreen: User confirmed logout');
                            socketService.disconnect();

                            if (onLogout) {
                                console.log('📞 JobScreen: Calling onLogout callback');
                                await onLogout();
                            } else {
                                console.log('⚠️ JobScreen: No onLogout callback, clearing storage manually');
                                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                            }
                        } catch (error) {
                            console.error('❌ JobScreen logout error:', error);
                            // Force logout via callback anyway
                            if (onLogout) {
                                await onLogout();
                            }
                        }
                    }
                }
            ]
        );
    };

    const renderNoteModal = () => {
        return (
            <Modal visible={showNoteModal} transparent={true} animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginTop: -180 }}>
                    <View style={{ backgroundColor: '#334155', margin: 20, borderRadius: 20, padding: 20, width: '90%', elevation: 15, borderWidth: 1, borderColor: '#475569' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                <Ionicons name='create-outline' size={24} color='#3b82f6' style={{ marginRight: 10 }} />
                                <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>Ghi chú công việc</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowNoteModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}>
                                <Ionicons name='close' size={20} color='white' />
                            </TouchableOpacity>
                        </View>

                        <View style={{ marginBottom: 20, backgroundColor: 'transparent' }}>
                            <TextInput
                                style={{ backgroundColor: '#475569', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 15, color: 'white', minHeight: 120, borderWidth: 2, borderColor: '#3b82f6' }}
                                placeholder='💭 Nhập ghi chú chi tiết về công việc...'
                                placeholderTextColor='#94a3b8'
                                multiline={true}
                                numberOfLines={6}
                                value={tempNote}
                                onChangeText={(text) => setTempNote(text)}
                                autoFocus={true}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 15, marginRight: 10, alignItems: 'center' }} onPress={() => setShowNoteModal(false)}>
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 1, backgroundColor: '#3b82f6', padding: 15, borderRadius: 15, marginLeft: 10, alignItems: 'center' }} onPress={handleSaveNote}>
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    const renderMenuModal = () => {
        const menuOptions = [
            { key: 'history', title: 'Lịch sử công việc', icon: 'time-outline', color: '#06d6a0' },
            { key: 'timesheet', title: 'Bảng chấm công', icon: 'calendar-outline', color: '#118ab2' },
            { key: 'reportsHub', title: 'Báo cáo & Nghỉ phép', icon: 'document-text-outline', color: '#8b5cf6' },
            ...(canViewAllReports(userID, job) ? [{ key: 'viewAllReports', title: 'Xem báo cáo toàn công ty', icon: 'eye-outline', color: '#06b6d4' }] : []),
            { key: 'changePassword', title: 'Đổi mật khẩu', icon: 'lock-closed-outline', color: '#ffd166' },
            { key: 'appInfo', title: 'Thông tin ứng dụng', icon: 'information-circle-outline', color: '#3b82f6' },
            { key: 'logout', title: 'Đăng xuất', icon: 'log-out-outline', color: '#ff6b6b' },
        ];

        return (
            <Modal visible={showMenuModal} transparent={true} animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
                    activeOpacity={1}
                    onPress={() => setShowMenuModal(false)}
                >
                    <View style={{ position: 'absolute', top: insets.top + 70, right: 20, backgroundColor: '#1a2332', borderRadius: 15, minWidth: 200, elevation: 15, borderWidth: 2, borderColor: '#059669' }}>
                        {menuOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.key}
                                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: index < menuOptions.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.1)' }}
                                onPress={() => handleMenuOption(option.key)}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={20}
                                    color={option.color}
                                    style={{ marginRight: 12 }}
                                />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                    {option.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b', paddingTop: insets.top }}>
            <StatusBar barStyle='light-content' backgroundColor="#059669" />

            {/* Header */}
            <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: '#059669' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                        <Image source={require('../../../assets/images/nl-konen.png')} style={{ width: 36, height: 36, borderRadius: 18 }} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>JOB NLTECH</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleDiemDanh} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                        <Ionicons name="camera" size={22} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowMenuModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                        <Ionicons name="menu-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Expo Go Warning */}
                <ExpoGoWarning />

                <View style={{ paddingHorizontal: 20 }}>

                    {/* Avatar section */}
                    <View style={{ height: 140, justifyContent: 'center', alignItems: 'center', zIndex: 5, marginTop: 20, backgroundColor: 'transparent' }}>
                        <View style={{ width: 110, height: 110, justifyContent: 'center', alignItems: 'center', borderRadius: 55, backgroundColor: 'white', borderColor: '#3b82f6', borderWidth: 4, elevation: 8 }}>
                            {avatar ?
                                <Image source={{ uri: avatar }} style={{ width: 96, height: 96, borderRadius: 48 }} /> :
                                <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name='person-outline' size={40} color='#ccc' />
                                </View>
                            }
                        </View>
                    </View>

                    {/* Thông tin user */}
                    <View style={{ backgroundColor: '#334155', marginTop: -55, marginHorizontal: 10, borderRadius: 20, paddingVertical: 25, paddingHorizontal: 20, paddingTop: 50, elevation: 6, borderWidth: 1, borderColor: '#475569' }}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent' }}>
                            <Text style={{ fontSize: 20, color: 'white', fontWeight: '700', textAlign: 'center' }}>{username || 'Tên người dùng'}</Text>
                        </View>
                        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <View style={{ backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 }}>
                                <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>🏢 {job || 'Chức vụ'}</Text>
                            </View>
                        </View>
                    </View>
                    {/* Section công việc */}
                    <View style={{ padding: 5, marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <Ionicons name='briefcase-outline' size={24} color='white' style={{ marginRight: 10 }} />
                            <Text style={{ fontWeight: '700', color: 'white', fontSize: 18 }}>Công việc hiện tại</Text>
                        </View>
                        <TouchableOpacity
                            style={{ backgroundColor: '#475569', width: 45, height: 45, justifyContent: 'center', alignItems: 'center', borderRadius: 22.5, elevation: 3, borderWidth: 1, borderColor: '#64748b' }}
                            onPress={handleReload}
                        >
                            <Ionicons name='refresh-outline' size={24} color='#00FFFF' />
                        </TouchableOpacity>
                    </View>

                    {/* Input công việc */}
                    <View style={{ padding: 5, marginTop: 10, backgroundColor: 'transparent' }}>
                        <View style={{ backgroundColor: '#475569', borderRadius: 15, padding: 10, minHeight: 120, elevation: 4, borderWidth: 1, borderColor: '#64748b' }}>
                            <Text style={{ fontSize: 15, color: valueJob ? 'white' : '#94a3b8', fontWeight: valueJob ? '600' : '400', lineHeight: 22 }}>
                                {valueJob || '📋 Hiện tại chưa có công việc được giao...'}
                            </Text>
                        </View>
                    </View>

                    {/* Hiển thị ghi chú */}
                    {isGetJob && (
                        <View style={{ padding: 5, marginTop: 15, backgroundColor: 'transparent' }}>
                            {txtGhiChu ? (
                                <View style={{ backgroundColor: 'transparent' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, backgroundColor: 'transparent' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                            <Ionicons name='document-text-outline' size={20} color='#3b82f6' style={{ marginRight: 8 }} />
                                            <Text style={{ fontWeight: '700', color: 'white', fontSize: 16 }}>Ghi chú hiện tại</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => { setTempNote(txtGhiChu); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                                            <Text style={{ color: '#00FFFF', fontSize: 12, fontWeight: '600' }}>Chỉnh sửa</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                        <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20 }}>
                                            {txtGhiChu}
                                        </Text>
                                    </View>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => { setTempNote(''); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 15, padding: 15, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.3)', borderStyle: 'dashed', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <Ionicons name='add-circle-outline' size={20} color='#3b82f6' style={{ marginRight: 8 }} />
                                        <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: '600' }}>Thêm ghi chú công việc</Text>
                                    </View>
                                    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>Nhấn để thêm ghi chú hoặc vấn đề phát sinh</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    {/* Nút hành động */}
                    <View style={{ marginHorizontal: 5, marginTop: 25, marginBottom: 20, backgroundColor: 'transparent' }}>
                        {isGetJob ? (
                            <TouchableOpacity
                                style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 27.5, elevation: 8 }}
                                onPress={handleFinishJob}
                                disabled={isLoadingFinish}
                            >
                                {isLoadingFinish ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang xử lý...</Text>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <Ionicons name='checkmark-circle-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Hoàn thành công việc</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: valueJob ? '#059669' : '#6b7280', borderRadius: 27.5, elevation: valueJob ? 8 : 3 }}
                                onPress={handleGetJob}
                                disabled={!valueJob || isLoadingGetJob}
                            >
                                {isLoadingGetJob ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang nhận việc...</Text>
                                    </View>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <Ionicons name='play-circle-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                                            {valueJob ? 'Nhận công việc' : 'Chưa có việc'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Modal Ghi chú */}
            {renderNoteModal()}

            {/* Modal Menu */}
            {renderMenuModal()}

            {/* Nút chấm công floating */}
            {/* <TouchableOpacity
                style={{ position: 'absolute', right: 5, top: '18%', width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 107, 53, 0.7)', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)' }}
                onPress={handleDiemDanh}
                activeOpacity={0.8}
            >
                
                <Ionicons name='camera' size={28} color='white' />
            </TouchableOpacity> */}
            {/* <MaterialIcons name="camera" size={28} color="white" /> */}
        </View>
    );
};

export default JobScreen;