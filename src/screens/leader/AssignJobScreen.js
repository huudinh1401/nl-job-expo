import React, { useState, useEffect } from 'react';
import { Text, View, Platform, Image, Alert, StatusBar, TouchableOpacity, TextInput, Keyboard, Modal, ScrollView, Dimensions, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGetAllUser, apiGiaoJob, apiUpdateStatusUser, apiPushNotiSuper, apiGetUserInfo } from '../../services/apiService';
import ModalSelectEmployee from './components/ModalSelectEmployee';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AssignJobScreen = ({ navigation, job, onLogout }) => {
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [text, setText] = useState('');
    const [users, setUsers] = useState([]);
    const [visibleModalSelectNV, setVisibleModalSelectNV] = useState(false);

    useEffect(() => {
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                const username = await AsyncStorage.getItem('username');
                const avatar = await AsyncStorage.getItem('avatar');

                id && setUserID(id);
                username && setUsername(username);
                avatar && setAvatar(avatar);

                if (job) {
                    await getAllUser(job);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();
    }, [job]);

    const getAllUser = async (job) => {
        try {
            const user = await apiGetAllUser();
            let userss;
            if (job === 'Dự án') {
                const targetDepartments = ['Dự án', 'Máy tính', 'Công trình', 'Photocopy'];
                userss = user.filter(user => targetDepartments.includes(user.part));
            } else {
                userss = user.filter(user => user.part === job);
            }
            setUsers(userss);
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        }
    };

    const handleGiaoJob = async (id, deviceToken) => {
        const notificationType = 'new_job';
        const customMessage = 'Bạn có công việc mới, vào xem ngay!';
        try {
            await apiGiaoJob(text, id);
            setUsers(prevData =>
                prevData.map(item =>
                    item.id === id ? { ...item, status: -1 } : item
                )
            );
            await updateStatusUser(id, -1);
            if (deviceToken) {
                await apiPushNotiSuper(deviceToken, notificationType, customMessage);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        }
    };

    const updateStatusUser = async (id, stt) => {
        try {
            await apiUpdateStatusUser(id, stt);
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái user:', error);
        }
    };

    const handleShowModal = async () => {
        setVisibleModalSelectNV(true);
        await getAllUser(job);
    };

    const handleDiemDanh = async () => {
        // try {
        //     const id = await AsyncStorage.getItem('userID');
        //     const res = await apiGetUserInfo(id);
        //     if (res.status === 0) {
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
            case 'logout': handleLogout(); break;
        }
    };

    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất', style: 'destructive', onPress: async () => {
                    try {
                        console.log('🚪 AssignJobScreen: User confirmed logout');
                        if (onLogout) {
                            console.log('📞 AssignJobScreen: Calling onLogout callback');
                            await onLogout();
                        } else {
                            console.log('⚠️ AssignJobScreen: No onLogout callback, clearing storage manually');
                            await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                        }
                    } catch (error) {
                        console.error('❌ AssignJobScreen logout error:', error);
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
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: '#1e293b' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flex: 1, marginTop: isAndroid15 ? 35 : 0 }}>
                    <View style={{ height: 50, zIndex: 199, marginHorizontal: 5, backgroundColor: '#1e3a8a', borderRadius: 12, justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flexDirection: 'row', paddingHorizontal: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="supervisor-account" size={24} color="#10b981" style={{ marginRight: 8 }} />
                            <Text style={{ textAlign: 'center', color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>Leader Giao Việc</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity onPress={handleDiemDanh} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,107,53,0.9)', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                                <Ionicons name="camera" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowMenuModal(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
                                <Ionicons name="menu" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={{ flex: 1, paddingHorizontal: 10 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                        ontentContainerStyle={{ paddingBottom: 20 }}
                    >
                        <View style={{ height: 120, justifyContent: 'center', alignItems: 'center', zIndex: 5, marginTop: 0 }}>
                            <View style={{ width: 90, height: 90, justifyContent: 'center', alignItems: 'center', borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#10b981', borderWidth: 3, elevation: 8 }}>
                                {avatar ? <Image source={{ uri: avatar }} style={{ width: 70, height: 70, borderRadius: 40 }} /> : <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(240,240,240,0.2)', justifyContent: 'center', alignItems: 'center' }}><MaterialIcons name="person-outline" size={35} color="#ccc" /></View>}
                            </View>
                        </View>

                        <View style={{ backgroundColor: '#334155', marginTop: -55, marginHorizontal: 10, borderRadius: 20, paddingVertical: 15, paddingHorizontal: 20, paddingTop: 50, elevation: 6, borderWidth: 1, borderColor: '#475569' }}>
                            <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={{ fontSize: 20, color: 'white', fontWeight: '700', textAlign: 'center' }}>{username || 'Tên người dùng'}</Text>
                            </View>
                            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <View style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 }}>
                                    <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>👨‍💼 Leader: {job || 'Chức vụ'}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ backgroundColor: '#334155', borderRadius: 16, padding: 10, marginBottom: 10, marginTop: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <MaterialIcons name="assignment" size={24} color="#07e3f7" style={{ marginRight: 8 }} />
                                <Text style={{ fontWeight: 'bold', color: '#07e3f7', fontSize: 18 }}>Nội dung công việc</Text>
                            </View>

                            <TextInput style={{ minHeight: 120, borderColor: '#475569', borderWidth: 2, padding: 16, textAlignVertical: 'top', fontSize: 16, color: '#f1f5f9', borderRadius: 12, backgroundColor: '#1e293b' }} multiline={true} numberOfLines={5} placeholder="Nhập nội dung công việc chi tiết tại đây..." placeholderTextColor="#64748b" value={text} onChangeText={(text) => setText(text)} />
                        </View>

                        <TouchableOpacity style={{ width: '100%', height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: text ? '#10b981' : '#64748b', borderRadius: 14, flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20 }} onPress={() => { Keyboard.dismiss(); handleShowModal(); }} disabled={text === ''} activeOpacity={0.8}>
                            <MaterialIcons name="people" size={24} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Chọn nhân viên thực hiện</Text>
                        </TouchableOpacity>
                        <View style={{ height: 80, width: '100%' }} />
                    </ScrollView>

                    <Modal visible={visibleModalSelectNV} transparent={true} animationType={'slide'} onRequestClose={() => setVisibleModalSelectNV(!visibleModalSelectNV)}>
                        <ModalSelectEmployee setVisibleModalSelectNV={setVisibleModalSelectNV} users={users} handleGiaoJob={handleGiaoJob} text={text} setText={setText} />
                    </Modal>
                </View>
            </SafeAreaView>
            {renderMenuModal()}
        </KeyboardAvoidingView>
    );
};

export default AssignJobScreen;