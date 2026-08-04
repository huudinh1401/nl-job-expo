import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, View, Platform, PermissionsAndroid, Image, Alert, Modal, ActivityIndicator, StatusBar, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Linking } from 'react-native';
import { Icon } from 'react-native-elements';
import Geolocation from '@react-native-community/geolocation';
import socket from '../../config/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCheckStatusUser, apiFinishJob, apiGetAllUser, apiGetJob, apiGetJobHistory, apiGetUserInfo, apiGiaoJob, apiPushNoti, apiPushNotiSuper, apiUpdateStatusUser, apiUpdateToaDo } from '../../config/apiService';
import { isTablet, width, height } from '../../config/deviceConfig'
import HeaderLeader from './headerLeader';
import ModalSelectNV from './modalSelectNV';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AssignJob = ({ isGetJob, navigation, setIsGetJob, jobUser, setJobUser, route }) => {
    const [deviceTokenUser, setDeviceTokenUser] = useState('');
    const [statusUser, setStatusUser] = useState('');
    const [visible, setVisible] = useState(false);
    const [isLoadingGiaoJob, setIsLoadingGiaoJob] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [text, setText] = useState('');
    const [txtSelectNV, setTxtSelectNV] = useState('');
    const [idUserJob, setIdUserJob] = useState('');
    const [visibleModalSelectNV, setVisibleModalSelectNV] = useState(false);
    const [editable, setEditable] = useState(true);
    const [idJob, setIdJob] = useState('');
    const [users, setUsers] = useState([]);
    const [location, setLocation] = useState(null);

    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'ios') {
                Geolocation.getCurrentPosition(
                    (position) => {
                    },
                    (error) => {
                        console.log('Lỗi khi lấy vị trí:', error);
                        if (error.code === 1) {
                            console.log('Quyền truy cập vị trí bị từ chối.');
                            showAlert();
                        }
                    }
                );
            } else if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Yêu cầu truy cập vị trí",
                        message: "Ứng dụng cần truy cập vị trí của bạn trong thời gian làm việc để lưu trữ vị trí này trên cơ sở dữ liệu. Quản trị viên sẽ theo dõi vị trí của bạn trên trang web của công ty để đánh giá hiệu suất công việc dựa trên khu vực bạn làm việc.",
                        buttonNeutral: "Hỏi lại sau",
                        buttonNegative: "Hủy",
                        buttonPositive: "Đồng ý",
                    }
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                } else {
                    console.log('Quyền truy cập vị trí bị từ chối');
                    showAlert();
                }
            }
        } catch (error) {
            console.error('Lỗi khi yêu cầu quyền truy cập vị trí:', error);
        }
    };

    const openSettings = () => {
        Linking.openSettings();
    };

    const showAlert = () => {
        Alert.alert(
            'Yêu cầu quyền truy cập vị trí',
            'Ứng dụng cần truy cập vị trí của bạn trong thời gian làm việc để lưu trữ vị trí này trên cơ sở dữ liệu. Quản trị viên sẽ theo dõi vị trí của bạn trên trang web của công ty để đánh giá hiệu suất công việc dựa trên khu vực bạn làm việc.',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đi đến cài đặt', onPress: () => openSettings() },
            ]
        );
    };

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        requestLocationPermission();
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                const username = await AsyncStorage.getItem('username');
                const jobb = await AsyncStorage.getItem('job');
                const avatar = await AsyncStorage.getItem('avatar');

                id && setUserID(id);
                username && setUsername(username);
                jobb && setJob(jobb);
                avatar && setAvatar(avatar);
                getStatusUser(id)
                if (jobb) {
                    await getAllUser(jobb);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();
        socket.connect();
        return () => { socket.disconnect(); };
    }, []);

    const getStatusUser = async (id) => {
        try {
            const res = await apiGetUserInfo(id);
            console.log('stt user ', res)
            setStatusUser(res.status)
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }

    const getAllUser = async (job) => {
        try {
            const user = await apiGetAllUser();

            let userss;
            if (job === 'Dự án') {
                // Nếu là bộ phận Dự án, lấy user của 4 bộ phận: Dự án, Máy tính, Công trình, Photocopy
                const targetDepartments = ['Dự án', 'Máy tính', 'Công trình', 'Photocopy'];
                userss = user.filter(user => targetDepartments.includes(user.part));
            } else {
                // Các bộ phận khác chỉ lấy user của bộ phận đó
                userss = user.filter(user => user.part === job);
            }

            setUsers(userss);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }

    const handleGiaoJob = async (id, deviceToken) => {
        const notificationType = 'new_job';
        const customMessage = 'Bạn có công việc mới, vào xem ngay!';
        const fetchGiaoJob = async () => {
            try {
                const data = await apiGiaoJob(text, id);
                setUsers(prevData =>
                    prevData.map(item =>
                        item.id === id ? { ...item, status: -1 } : item
                    )
                );
                socket.emit('sendJob', { message: 'Toi da giao Job' });
                socket.emit('getJob', { message: 'Toi da nhan Job' });
                updateStatusUser(id, -1)
                if (deviceToken) {
                    const noti = await apiPushNotiSuper(deviceToken, notificationType, customMessage);
                }
            } catch (error) {
                console.log('loi: ', error)
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
                }
            }
        }
        fetchGiaoJob()
    };

    const handleOutsidePress = () => {
        setVisible(false);
        Keyboard.dismiss();
    };

    const handleShowModal = async () => {
        setVisibleModalSelectNV(true)
        getAllUser(job);
    }

    const handleDiemDanh = () => {
        // Không cần check trạng thái user nữa - cho phép chấm công bất cứ lúc nào
        // try {
        //     const id = await AsyncStorage.getItem('userID')
        //     const res = await apiGetUserInfo(id);
        //     if (res.status === 0) {
        //         navigation.navigate('ChamCong')
        //     } else {
        //         Alert.alert('Bạn còn việc chưa hoàn thành!')
        //     }
        // } catch (error) {
        //     if (error.response && error.response.status !== 401 && error.response.status !== 403) {
        //         Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
        //     }
        // }
        navigation.navigate('ChamCong');
    };

    const updateStatusUser = async (id, stt) => {
        try {
            const res = await apiUpdateStatusUser(id, stt);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <TouchableWithoutFeedback onPress={() => handleOutsidePress()}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                    <View style={{ flex: 1, marginTop: isAndroid15 ? 35 : 0 }}>
                        <View style={{ height: 50, zIndex: 199, marginHorizontal: 5 }}>
                            <HeaderLeader navigation={navigation} visible={visible} setVisible={setVisible} title={'Leader Giao việc'} />
                        </View>

                        <View style={{ flex: 1, paddingHorizontal: 10, paddingTop: 10 }}>
                            <TouchableOpacity
                                style={{ height: 45, paddingHorizontal: 20, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center', borderRadius: 20, position: 'absolute', top: 8, right: 18, zIndex: 99, flexDirection: 'row', elevation: 3 }}
                                onPress={() => handleDiemDanh()} activeOpacity={0.8}
                            >
                                <Icon name="fingerprint" type="material" size={20} color="white" style={{ marginRight: 6 }} />
                                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>Điểm danh</Text>
                            </TouchableOpacity>

                            <View style={{ alignItems: 'center', marginTop: 5, marginBottom: 10 }}>
                                <View style={{
                                    width: 96, height: 96, borderRadius: 60, backgroundColor: 'white', borderWidth: 1, borderColor: '#10b981', alignItems: 'center', justifyContent: 'center',
                                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5, zIndex: 9,
                                }}>
                                    {avatar ? <Image source={{ uri: avatar }} style={{ width: 80, height: 80 }} /> : <Icon name="person" type="material" size={40} color="#64748b" />}
                                </View>
                                <View style={{
                                    backgroundColor: '#334155', marginTop: -45, marginHorizontal: 5, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 65, paddingTop: 50, width: '100%',
                                    shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 12, borderWidth: 1, borderColor: '#475569'
                                }}>
                                    <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent' }}>
                                        <Text style={{ fontSize: 18, color: 'white', fontWeight: '700', textAlign: 'center' }}>{username || 'Tên người dùng'}</Text>
                                    </View>
                                    <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                                        <View style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 }}>
                                            <Text style={{ fontSize: 12, color: 'white', fontWeight: '600' }}>👨‍💼 Leader: {job || 'Chức vụ'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ backgroundColor: '#334155', borderRadius: 16, padding: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <Icon name="assignment" type="material" size={24} color="#07e3f7" style={{ marginRight: 8 }} />
                                    <Text style={{ fontWeight: 'bold', color: '#07e3f7', fontSize: 18 }}>Nội dung công việc</Text>
                                </View>

                                <TextInput style={{ minHeight: 120, borderColor: '#475569', borderWidth: 2, padding: 16, textAlignVertical: 'top', fontSize: 16, color: '#f1f5f9', borderRadius: 12, backgroundColor: '#1e293b', opacity: editable ? 1 : 0.6 }} multiline={true} numberOfLines={5} placeholder="Nhập nội dung công việc chi tiết tại đây..." placeholderTextColor="#64748b" value={text} onChangeText={(text) => setText(text)} editable={editable} />
                            </View>

                            <Modal visible={visibleModalSelectNV} transparent={true} animationType={'slide'} onRequestClose={() => { setVisibleModalSelectNV(!visibleModalSelectNV) }}>
                                <ModalSelectNV setVisibleModalSelectNV={setVisibleModalSelectNV} users={users} setIdUserJob={setIdUserJob} deviceTokenUser={deviceTokenUser} setDeviceTokenUser={setDeviceTokenUser} handleGiaoJob={handleGiaoJob} text={text} setText={setText} />
                            </Modal>

                            <TouchableOpacity
                                style={{
                                    width: '100%', height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: text ? '#10b981' : '#64748b', borderRadius: 14, flexDirection: 'row',
                                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20
                                }}
                                onPress={() => { Keyboard.dismiss(); handleShowModal() }} disabled={text === ''} activeOpacity={0.8}
                            >
                                <Icon name="people" type="material" size={24} color="white" style={{ marginRight: 8 }} />
                                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Chọn nhân viên thực hiện</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </View>
    );
}

export default AssignJob;