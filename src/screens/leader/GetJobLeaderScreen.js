import React, { useState, useEffect } from 'react';
import { Text, View, Platform, Image, Alert, ActivityIndicator, StatusBar, TouchableOpacity, TextInput, ScrollView, Modal, TouchableWithoutFeedback, Keyboard, Dimensions, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGetJob, apiFinishJob, apiUpdateToaDo, apiUpdateStatusUser, apiGetJobHistory, apiCheckStatusUser } from '../../services/apiService';
import { CONG_TRINH_DEPARTMENT } from '../../constants/reportsConfig';

const { width } = Dimensions.get('window');
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const GetJobLeaderScreen = ({ navigation, route, isGetJob, setIsGetJob, valueJob, setValueJob, idJob, setIdJob, onLogout }) => {
    const [txtGhiChu, setTxtGhiChu] = useState('');
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [isLoadingFinish, setIsLoadingFinish] = useState(false);
    const [isLoadingGetJob, setIsLoadingGetJob] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [tempNote, setTempNote] = useState('');

    useEffect(() => {
        const fetchAndSetUserData = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                const username = await AsyncStorage.getItem('username');
                const job = await AsyncStorage.getItem('job');
                const avatar = await AsyncStorage.getItem('avatar');

                id && setUserID(id);
                username && setUsername(username);
                job && setJob(job);
                avatar && setAvatar(avatar);

                if (id) {
                    getHistoryJob(id);
                    checkUserStatus(id);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchAndSetUserData();

        if (isGetJob) {
            const id = setInterval(() => {
                updateLocation();
            }, 300000);
            setIntervalId(id);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isGetJob]);

    // App bị đẩy xuống nền (chưa kill) rồi mở lại: màn hình không mount lại nên không có gì tự
    // fetch lại trạng thái. Bắt sự kiện app quay lại foreground để tự làm mới.
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

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Yêu cầu quyền truy cập vị trí', 'Ứng dụng cần quyền truy cập vị trí để tiếp tục.');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Lỗi khi yêu cầu quyền truy cập vị trí:', error);
            return false;
        }
    };

    const updateLocation = async () => {
        try {
            const hasPermission = await requestLocationPermission();
            if (!hasPermission) return;

            const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = location.coords;
            await apiUpdateToaDo(idJob, `${latitude}, ${longitude}`);
        } catch (error) {
            console.error('Lỗi lấy vị trí:', error);
        }
    };

    const getHistoryJob = async (id) => {
        try {
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

    const updateStatusUser = async (id, stt) => {
        try {
            await apiUpdateStatusUser(id, stt);
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái user:', error);
        }
    };

    const handleGetJob = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        setIsLoadingGetJob(true);

        Alert.alert('Xác nhận nhận việc', 'Bạn có chắc chắn muốn nhận công việc này không?', [
            { text: 'Hủy', style: 'cancel', onPress: () => setIsLoadingGetJob(false) },
            {
                text: 'OK', onPress: async () => {
                    try {
                        const hasPermission = await requestLocationPermission();
                        if (!hasPermission) {
                            setIsLoadingGetJob(false);
                            return;
                        }

                        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        const { latitude, longitude } = location.coords;

                        await apiGetJob(idJob, 1, currentTime, `${latitude}, ${longitude}`);
                        await updateStatusUser(userID, 1);
                        setIsGetJob(true);
                    } catch (error) {
                        console.error('Lỗi:', error);
                        Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    } finally {
                        setIsLoadingGetJob(false);
                    }
                }
            }
        ]);
    };

    const handleFinishJob = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        setIsLoadingFinish(true);

        Alert.alert('Xác nhận hoàn thành công việc', 'Bạn đã chắc chắn hoàn thành công việc?', [
            { text: 'Hủy', style: 'cancel', onPress: () => setIsLoadingFinish(false) },
            {
                text: 'OK', onPress: async () => {
                    try {
                        const hasPermission = await requestLocationPermission();
                        if (!hasPermission) {
                            setIsLoadingFinish(false);
                            return;
                        }

                        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        const { latitude, longitude } = location.coords;

                        await apiFinishJob(idJob, currentTime, 0, `${latitude}, ${longitude}`, txtGhiChu);
                        await updateStatusUser(userID, 0);
                        setIsGetJob(false);
                        setValueJob('');
                        setTxtGhiChu('');
                    } catch (error) {
                        console.error('Lỗi:', error);
                        Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    } finally {
                        setIsLoadingFinish(false);
                    }
                }
            }
        ]);
    };

    const handleSaveNote = () => {
        setTxtGhiChu(tempNote);
        setShowNoteModal(false);
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
            console.error('Lỗi:', error);
        }
    };

    const handleDiemDanh = async () => {
        // try {
        //     const res = await apiCheckStatusUser(userID);
        //     if (res.success === false) {
        navigation.navigate('ChamCong');
        //     } else {
        //         Alert.alert('Bạn còn việc chưa hoàn thành!');
        //     }
        // } catch (error) {
        //     console.error('Lỗi:', error);
        //     Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        // }
    };

    const handleMenuOption = (option) => {
        setShowMenuModal(false);
        switch (option) {
            case 'history': navigation.navigate('JobHistory'); break;
            case 'timesheet': navigation.navigate('BangChamCong'); break;
            case 'changePassword': navigation.navigate('ChangePass'); break;
            case 'appInfo': navigation.navigate('AppInfo'); break;
            case 'reportsHub': navigation.navigate('ReportsHub'); break;
            case 'leaveForTeam': navigation.navigate('LeaveRequestForTeamForm'); break;
            case 'logout': handleLogout(); break;
        }
    };

    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                    try {
                        console.log('🚪 GetJobLeaderScreen: User confirmed logout');
                        if (onLogout) {
                            console.log('📞 GetJobLeaderScreen: Calling onLogout callback');
                            await onLogout();
                        } else {
                            console.log('⚠️ GetJobLeaderScreen: No onLogout callback, clearing storage manually');
                            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                        }
                    } catch (error) {
                        console.error('❌ GetJobLeaderScreen logout error:', error);
                        // Force logout via callback anyway
                        if (onLogout) {
                            await onLogout();
                        }
                    }
                }
            }
        ]);
    };

    const renderMenuModal = () => {
        const menuOptions = [
            { key: 'history', title: 'Lịch sử công việc', icon: 'time-outline', color: '#06d6a0' },
            { key: 'timesheet', title: 'Bảng chấm công', icon: 'calendar-outline', color: '#118ab2' },
            { key: 'reportsHub', title: 'Báo cáo & Nghỉ phép', icon: 'document-text-outline', color: '#8b5cf6' },
            ...(job === CONG_TRINH_DEPARTMENT ? [{ key: 'leaveForTeam', title: 'Viết đơn nghỉ phép cho NV', icon: 'people-outline', color: '#a855f7' }] : []),
            { key: 'changePassword', title: 'Đổi mật khẩu', icon: 'lock-closed-outline', color: '#ffd166' },
            { key: 'appInfo', title: 'Thông tin ứng dụng', icon: 'information-circle-outline', color: '#3b82f6' },
            { key: 'logout', title: 'Đăng xuất', icon: 'log-out-outline', color: '#ff6b6b' },
        ];

        return (
            <Modal visible={showMenuModal} transparent={true} animationType="fade" onRequestClose={() => setShowMenuModal(false)}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={() => setShowMenuModal(false)}>
                    <View style={{ position: 'absolute', top: 100, right: 20, backgroundColor: '#1a2332', borderRadius: 15, minWidth: 200, elevation: 15, borderWidth: 2, borderColor: '#10b981' }}>
                        {menuOptions.map((option, index) => (
                            <TouchableOpacity key={option.key} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: index < menuOptions.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.1)' }} onPress={() => handleMenuOption(option.key)}>
                                <Ionicons name={option.icon} size={20} color={option.color} style={{ marginRight: 12 }} />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>{option.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flex: 1, marginTop: isAndroid15 ? 35 : 0 }}>
                    <View style={{ height: 50, zIndex: 199, backgroundColor: '#1e3a8a', borderRadius: 12, justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flexDirection: 'row', paddingHorizontal: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="supervisor-account" size={24} color="#10b981" style={{ marginRight: 8 }} />
                            <Text style={{ textAlign: 'center', color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>Nhận Việc</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowMenuModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                            <Ionicons name="menu" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ flex: 1, paddingHorizontal: 10, paddingTop: 10 }} showsVerticalScrollIndicator={false}>
                        <View style={{ height: 120, justifyContent: 'center', alignItems: 'center', zIndex: 5, marginTop: 20 }}>
                            <View style={{ width: 90, height: 90, justifyContent: 'center', alignItems: 'center', borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#10b981', borderWidth: 3, elevation: 8 }}>
                                {avatar ? <Image source={{ uri: avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} /> : <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(240,240,240,0.2)', justifyContent: 'center', alignItems: 'center' }}><MaterialIcons name="person-outline" size={35} color="#ccc" /></View>}
                            </View>
                        </View>

                        <View style={{ backgroundColor: '#334155', marginTop: -55, marginHorizontal: 10, borderRadius: 20, paddingVertical: 25, paddingHorizontal: 20, paddingTop: 50, elevation: 6, borderWidth: 1, borderColor: '#475569' }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={{ fontSize: 20, color: 'white', fontWeight: '700', textAlign: 'center' }}>{username || 'Tên người dùng'}</Text>
                            </View>
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 }}>
                                    <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>👨‍💼 Leader: {job || 'Chức vụ'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ padding: 5, marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name='briefcase-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                <Text style={{ fontWeight: '700', color: 'white', fontSize: 18 }}>Công việc hiện tại</Text>
                            </View>
                            <TouchableOpacity style={{ backgroundColor: '#475569', width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, borderWidth: 1, borderColor: '#64748b' }} onPress={() => handleReload()}>
                                <Ionicons name='refresh-outline' size={20} color='#00FFFF' />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 5 }}>
                            <View style={{ backgroundColor: '#475569', borderRadius: 15, padding: 10, minHeight: 120, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, borderWidth: 1, borderColor: '#64748b' }}>
                                <Text style={{ fontSize: 15, color: valueJob ? 'white' : '#94a3b8', fontWeight: valueJob ? '600' : '400', lineHeight: 22 }}>
                                    {valueJob || '📋 Hiện tại chưa có công việc được giao...'}
                                </Text>
                            </View>
                        </View>

                        {isGetJob && (
                            <View style={{ padding: 5 }}>
                                {txtGhiChu ? (
                                    <View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Ionicons name='document-text-outline' size={20} color='#10b981' style={{ marginRight: 8 }} />
                                                <Text style={{ fontWeight: '700', color: 'white', fontSize: 16 }}>Ghi chú hiện tại</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => { setTempNote(txtGhiChu); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                                                <Text style={{ color: '#00FFFF', fontSize: 12, fontWeight: '600' }}>Chỉnh sửa</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                            <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20 }}>{txtGhiChu}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity onPress={() => { setTempNote(''); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 15, padding: 15, borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.3)', borderStyle: 'dashed', alignItems: 'center' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name='add-circle-outline' size={20} color='#10b981' style={{ marginRight: 8 }} />
                                            <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Thêm ghi chú công việc</Text>
                                        </View>
                                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>Nhấn để thêm ghi chú hoặc vấn đề phát sinh</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={{ marginHorizontal: 5, marginTop: 5, marginBottom: 10 }}>
                            {isGetJob ? (
                                <TouchableOpacity style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 27.5, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 15 }} onPress={() => handleFinishJob()} disabled={isLoadingFinish}>
                                    {isLoadingFinish ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang xử lý...</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name='checkmark-circle-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Hoàn thành công việc</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={{ height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: valueJob ? '#059669' : '#6b7280', borderRadius: 27.5, shadowColor: valueJob ? '#059669' : 'transparent', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: valueJob ? 15 : 5 }} onPress={() => handleGetJob()} disabled={!valueJob || isLoadingGetJob}>
                                    {isLoadingGetJob ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang nhận việc...</Text>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name='play-circle-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{valueJob ? 'Nhận công việc' : 'Chưa có việc'}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>

                <Modal visible={showNoteModal} transparent={true} animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableWithoutFeedback>
                                <View style={{ backgroundColor: '#334155', borderRadius: 20, padding: 10, width: '97%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 25 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name='create-outline' size={24} color='#10b981' style={{ marginRight: 10 }} />
                                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>Ghi chú công việc</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowNoteModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}>
                                            <Ionicons name='close' size={20} color='white' />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ marginBottom: 20 }}>
                                        <TextInput style={{ backgroundColor: '#475569', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 15, color: 'white', minHeight: 120, borderWidth: 2, borderColor: '#10b981' }} placeholder='💭 Nhập ghi chú chi tiết về công việc...' placeholderTextColor='#94a3b8' multiline={true} numberOfLines={6} value={tempNote} onChangeText={(text) => setTempNote(text)} autoFocus={true} />
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 15, marginRight: 10, alignItems: 'center' }} onPress={() => setShowNoteModal(false)}>
                                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Hủy</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={{ flex: 1, backgroundColor: '#10b981', padding: 15, borderRadius: 15, marginLeft: 10, alignItems: 'center' }} onPress={handleSaveNote}>
                                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>OK</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
            {renderMenuModal()}
        </View>
    );
};

export default GetJobLeaderScreen;
