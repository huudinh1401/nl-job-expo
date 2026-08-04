import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, View, Platform, PermissionsAndroid, Image, Alert, ActivityIndicator, StatusBar, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Linking, Modal, ScrollView } from 'react-native';
import { Icon } from 'react-native-elements';
import HeaderLeader from './headerLeader';
import Geolocation from '@react-native-community/geolocation';
import socket from '../../config/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFinishJob, apiGetJob, apiGetJobHistory, apiUpdateStatusUser, apiUpdateToaDo } from '../../config/apiService';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const GetJobLeader = ({ isGetJob, navigation, setIsGetJob, jobUser, setJobUser, route, valueJob, setValueJob, idJob, setIdJob }) => {
    const [txtGhiChu, setTxtGhiChu] = useState('');
    const [jobWorking, setJobWorking] = useState([]);
    const [visible, setVisible] = useState(false);
    const [isLoadingFinish, setIsLoadingFinish] = useState(false);
    const [isLoadingGetJob, setIsLoadingGetJob] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [text, setText] = useState('');
    const [editable, setEditable] = useState(true);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [tempNote, setTempNote] = useState('');

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
                        message: "Ứng dụng cần quyền truy cập vị trí để sử dụng tính năng này.",
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
        } catch (error) { console.error('Lỗi khi yêu cầu quyền truy cập vị trí:', error); }
    };

    const openSettings = () => {
        Linking.openSettings();
    };

    const showAlert = () => {
        Alert.alert(
            'Yêu cầu quyền truy cập vị trí',
            'Ứng dụng cần quyền truy cập vị trí để tiếp tục. Vui lòng vào cài đặt để bật quyền.',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đi đến cài đặt', onPress: () => openSettings() },
            ]
        );
    };

    const updateLocation = () => {
        const fetchUpdateLocationJobs = async (id, toa_do) => {
            try {
                const data = await apiUpdateToaDo(id, toa_do);
            } catch (error) { }
        };

        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                fetchUpdateLocationJobs(jobUser.id ? jobUser.id : idJob, `${latitude}, ${longitude}`);
            },
            (error) => {
                console.error(`Lỗi lấy vị trí: ${error.message}`);
                if (error.code === 1) { Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.'); }
            },
            { enableHighAccuracy: Platform.OS === 'ios' ? true : false, timeout: 20000, maximumAge: 30000 }
        );
    };

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        requestLocationPermission();
        const fetchAndSetUserData = async () => {
            try {
                let id;
                if (route && route.params && route.params.userIDD) { id = route.params.userIDD; }
                else { id = await AsyncStorage.getItem('userID'); }

                if (id) {
                    setUserID(id);
                    const username = await AsyncStorage.getItem('username');
                    const job = await AsyncStorage.getItem('job');
                    const avatar = await AsyncStorage.getItem('avatar');

                    username && setUsername(username);
                    job && setJob(job);
                    avatar && setAvatar(avatar);

                    getHistoryJob(id);
                    if (!socket.connected) { socket.connect(); }
                    socket.on('jobsent', (data) => {
                        console.log('Nhận được job từ user:');
                        getHistoryJob(id);
                    });
                } else { console.error('User ID not found in route or AsyncStorage'); }
            } catch (error) { console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error); }
        }
        fetchAndSetUserData();
        if (isGetJob) {
            const id = setInterval(() => {
                updateLocation();
            }, 300000);
            setIntervalId(id);
        }
    }, []);

    useEffect(() => {
        if (isGetJob) {
            const id = setInterval(() => {
                updateLocation();
            }, 300000);
            setIntervalId(id);
        }

        return () => {
            if (intervalId) { clearInterval(intervalId); }
        };
    }, [isGetJob]);

    const getHistoryJob = async (id) => {
        try {
            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);
            setValueJob(filteredData[0].noi_dung)
            setIdJob(filteredData[0].id)
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) { Alert.alert('Lỗi lấy lịch sử Job!', 'Vui lòng kiểm tra lại kết nối mạng.'); }
        }
    }

    const updateStatusUser = async (id, stt) => {
        if (!id) {
            console.error('updateStatusUser: userID is null or undefined');
            return;
        }
        try {
            const res = await apiUpdateStatusUser(id, stt);
            console.log('Cập nhật status user thành công:', res);
        } catch (error) {
            console.error('Lỗi updateStatusUser:', error);
            if (error.response && error.response.status !== 401 && error.response.status !== 403) { Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.'); }
        }
    }

    const handleGetJob = () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        setIsLoadingGetJob(true)
        const confirmGetJob = () => {
            Alert.alert(
                'Xác nhận nhận việc',
                'Bạn có chắc chắn muốn nhận công việc này không?',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => { setIsLoadingGetJob(false); }, },
                    { text: 'OK', onPress: () => { getCurrentPosition(); }, },
                ]
            );
        };
        const fetchJobs = async (id, status, start, toa_do) => {
            try {
                const data = await apiGetJob(id, status, start, toa_do);
                await updateStatusUser(userID, 1);
                setIsGetJob(true);
                setEditable(false);
                socket.emit('getJob', { message: 'Toi da nhan Job' });
            } catch (error) {
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                if (error.response && error.response.status !== 401 && error.response.status !== 403) { Alert.alert('Lỗi nhận việc!', 'Vui lòng kiểm tra lại kết nối mạng.'); }
            } finally { setIsLoadingGetJob(false); }
        };
        const getCurrentPosition = () => {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchJobs(jobUser.id ? jobUser.id : idJob, 1, currentTime, `${latitude}, ${longitude}`);
                },
                (error) => {
                    console.error(`Lỗi lấy vị trí: ${error.message}`);
                    Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    if (error.code === 1) { Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.'); }
                    setIsLoadingGetJob(false);
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 30000 }
            );
        };
        confirmGetJob();
    };

    const handleFinishJob = async () => {
        const currentTime = new Date().toTimeString().split(' ')[0];
        const status = 0;
        setIsLoadingFinish(true)
        const confirmFinishJob = () => {
            Alert.alert(
                'Xác nhận hoàn thành công việc', 'Bạn đã chắc chắn hoàn thành công việc?',
                [
                    { text: 'Hủy', style: 'cancel', onPress: () => { setIsLoadingFinish(false); }, },
                    { text: 'OK', onPress: () => { getCurrentPosition(); }, },
                ]
            );
        };

        const fetchFinishJobs = async (id, end, status, toa_do, note) => {
            try {
                const data = await apiFinishJob(id, end, status, toa_do, note);
                await updateStatusUser(userID, 0);
                setIsGetJob(false);
                setEditable(true);
                setJobUser([]);
                setJobWorking([]);
                setValueJob('');
                setText('');
                socket.emit('getJob', { message: 'Toi da hoan thanh Job' });
            } catch (error) {
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                if (error.response && error.response.status !== 401 && error.response.status !== 403) { Alert.alert('Lỗi hoàn thành việc!', 'Vui lòng kiểm tra lại kết nối mạng.'); }
            } finally { setIsLoadingFinish(false); }
        };

        const getCurrentPosition = () => {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    fetchFinishJobs(jobUser.id ? jobUser.id : idJob, currentTime, status, `${latitude}, ${longitude}`, txtGhiChu);
                },
                (error) => {
                    console.error(`Lỗi lấy vị trí: ${error.message}`);
                    Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    if (error.code === 1) { Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.'); }
                    setIsLoadingFinish(false);
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
            );
        };
        confirmFinishJob();
    };

    const handleOutsidePress = () => {
        setVisible(false);
        Keyboard.dismiss();
    };
    const handleSaveNote = () => {
        setTxtGhiChu(tempNote);
        setShowNoteModal(false);
    };
    const handleReload = async () => {
        try {
            let id;
            if (route && route.params && route.params.userIDD) { id = route.params.userIDD; }
            else { id = await AsyncStorage.getItem('userID'); }
            if (id) {
                setUserID(id);
                getHistoryJob(id);
            } else { console.error('User ID not found in route or AsyncStorage'); }
        } catch (error) { console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error); }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flex: 8, marginTop: isAndroid15 ? 35 : 0 }}>
                    <View style={{ height: 45, zIndex: 9 }}>
                        <HeaderLeader navigation={navigation} visible={visible} setVisible={setVisible} title={'Nhận Việc'} />
                    </View>

                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                        <View style={{ paddingHorizontal: 5 }}>
                            {/* Avatar section giống Job */}
                            <View style={{ height: 140, justifyContent: 'center', alignItems: 'center', zIndex: 5, backgroundColor: 'transparent' }}>
                                <View style={{
                                    width: 96, height: 96, justifyContent: 'center', alignItems: 'center', borderRadius: 48, backgroundColor: 'white', borderColor: '#10b981', borderWidth: 2,
                                    shadowColor: '#10b981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 15
                                }}>
                                    {avatar ? <Image source={{ uri: avatar }} style={{ width: 80, height: 80 }} /> : <View style={{ width: 80, height: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                                        <Icon name='person-outline' type='ionicon' size={40} color='#ccc' />
                                    </View>}
                                </View>
                            </View>

                            {/* Thông tin user giống Job */}
                            <View style={{
                                backgroundColor: '#334155', marginTop: -65, marginHorizontal: 5, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 10, paddingTop: 50,
                                shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 12, borderWidth: 1, borderColor: '#475569'
                            }}>
                                <View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent' }}>
                                    <Text style={{ fontSize: 20, color: 'white', fontWeight: '700', textAlign: 'center' }}>{username || 'Tên người dùng'}</Text>
                                </View>
                                <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                                    <View style={{ backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 }}>
                                        <Text style={{ fontSize: 14, color: 'white', fontWeight: '600' }}>👨‍💼 Leader: {job || 'Chức vụ'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Section công việc giống Job */}
                            <View style={{ padding: 5, marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                    <Icon name='briefcase-outline' type='ionicon' size={24} color='white' style={{ marginRight: 10 }} />
                                    <Text style={{ fontWeight: '700', color: 'white', fontSize: 18 }}>Công việc hiện tại</Text>
                                </View>
                                <TouchableOpacity style={{ backgroundColor: '#475569', width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5, borderWidth: 1, borderColor: '#64748b' }} onPress={() => handleReload()}>
                                    <Icon name='refresh-outline' type='ionicon' size={20} color='#00FFFF' />
                                </TouchableOpacity>
                            </View>

                            {/* Input công việc giống Job */}
                            <View style={{ padding: 5, backgroundColor: 'transparent' }}>
                                <View style={{ backgroundColor: '#475569', borderRadius: 15, padding: 10, minHeight: 120, shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8, borderWidth: 1, borderColor: '#64748b' }}>
                                    <Text style={{ fontSize: 15, color: valueJob ? 'white' : '#94a3b8', fontWeight: valueJob ? '600' : '400', lineHeight: 22 }}>
                                        {valueJob || '📋 Hiện tại chưa có công việc được giao...'}
                                    </Text>
                                </View>
                            </View>

                            {/* Hiển thị ghi chú nếu đã có hoặc nút thêm ghi chú giống Job */}
                            {isGetJob && (
                                <View style={{ padding: 5, backgroundColor: 'transparent' }}>
                                    {txtGhiChu ? (
                                        <View style={{ backgroundColor: 'transparent' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, backgroundColor: 'transparent' }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                    <Icon name='document-text-outline' type='ionicon' size={20} color='#10b981' style={{ marginRight: 8 }} />
                                                    <Text style={{ fontWeight: '700', color: 'white', fontSize: 16 }}>Ghi chú hiện tại</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => { setTempNote(txtGhiChu); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                                                    <Text style={{ color: '#00FFFF', fontSize: 12, fontWeight: '600' }}>Chỉnh sửa</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                                <Text style={{ fontSize: 14, color: '#94a3b8', lineHeight: 20 }}>
                                                    {txtGhiChu}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity onPress={() => { setTempNote(''); setShowNoteModal(true); }} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 15, padding: 15, borderWidth: 2, borderColor: 'rgba(16, 185, 129, 0.3)', borderStyle: 'dashed', alignItems: 'center' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <Icon name='add-circle-outline' type='ionicon' size={20} color='#10b981' style={{ marginRight: 8 }} />
                                                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '600' }}>Thêm ghi chú công việc</Text>
                                            </View>
                                            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 5 }}>Nhấn để thêm ghi chú hoặc vấn đề phát sinh</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                            {/* Ghi chú section khi đang làm việc - TextInput đơn giản */}
                            {isGetJob && (
                                <View style={{ padding: 5, marginTop: 15, backgroundColor: 'transparent' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: 'transparent' }}>
                                        <Icon name='document-text-outline' type='ionicon' size={20} color='#fbbf24' style={{ marginRight: 8 }} />
                                        <Text style={{ fontWeight: '700', color: 'white', fontSize: 16 }}>Ghi chú công việc</Text>
                                    </View>
                                    <TextInput style={{ backgroundColor: '#475569', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 15, color: 'white', minHeight: 80, borderWidth: 2, borderColor: '#fbbf24' }} placeholder='💭 Nhập vấn đề phát sinh trong công việc...' placeholderTextColor='#94a3b8' multiline={true} numberOfLines={3} value={txtGhiChu} onChangeText={(text) => setTxtGhiChu(text)} scrollEnabled={false} />
                                </View>
                            )}

                            {/* Nút hành động giống Job */}
                            <View style={{ marginHorizontal: 5, marginTop: 5, marginBottom: 10, backgroundColor: 'transparent' }}>
                                {isGetJob ? (
                                    <TouchableOpacity
                                        style={{
                                            height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 27.5,
                                            shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 15
                                        }}
                                        onPress={() => handleFinishJob()} disabled={isLoadingFinish}
                                    >
                                        {isLoadingFinish ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang xử lý...</Text>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <Icon name='checkmark-circle-outline' type='ionicon' size={24} color='white' style={{ marginRight: 10 }} />
                                                <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Hoàn thành công việc</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={{
                                            height: 55, justifyContent: 'center', alignItems: 'center', backgroundColor: valueJob ? '#059669' : '#6b7280', borderRadius: 27.5,
                                            shadowColor: valueJob ? '#059669' : 'transparent', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: valueJob ? 15 : 5
                                        }}
                                        onPress={() => handleGetJob()} disabled={!valueJob || isLoadingGetJob}
                                    >
                                        {isLoadingGetJob ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                                                <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Đang nhận việc...</Text>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <Icon name='play-circle-outline' type='ionicon' size={24} color='white' style={{ marginRight: 10 }} />
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
                </View>

                {/* Modal Ghi chú */}
                <Modal visible={showNoteModal} transparent={true} animationType="slide" onRequestClose={() => setShowNoteModal(false)}>
                    <TouchableWithoutFeedback onPress={handleOutsidePress}>
                        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginTop: -190 }}>
                            <TouchableWithoutFeedback>
                                <View style={{ backgroundColor: '#334155', borderRadius: 20, padding: 10, width: '97%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 25 }}>
                                    {/* Header */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: 'transparent' }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                            <Icon name='create-outline' type='ionicon' size={24} color='#10b981' style={{ marginRight: 10 }} />
                                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>Ghi chú công việc</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setShowNoteModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 20 }}>
                                            <Icon name='close' type='ionicon' size={20} color='white' />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ marginBottom: 20, backgroundColor: 'transparent' }}>
                                        <TextInput
                                            style={{ backgroundColor: '#475569', borderRadius: 15, padding: 15, textAlignVertical: 'top', fontSize: 15, color: 'white', minHeight: 120, borderWidth: 2, borderColor: '#10b981' }}
                                            placeholder='💭 Nhập ghi chú chi tiết về công việc...'
                                            placeholderTextColor='#94a3b8' multiline={true} numberOfLines={6} value={tempNote}
                                            onChangeText={(text) => setTempNote(text)} autoFocus={true}
                                        />
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
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
        </View>
    );
}
export default GetJobLeader;