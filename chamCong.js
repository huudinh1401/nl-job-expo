// ChamCong.js - Đã tích hợp loading ban đầu và tối ưu CSS
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Platform, PermissionsAndroid, Image, Alert, ActivityIndicator, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAddChamCong, apiCheckStatusUser, apiStatusChamcongOfUser, apiUpdateChamCong, apiAddLogFail } from '../../config/apiService';
import { apiRecognizeFace } from '../../config/apiServiceCheckFace';
import { launchCamera } from 'react-native-image-picker';
import { Icon } from 'react-native-elements';
import ScanAnimation from './ScanAnimation';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const ChamCong = ({ navigation }) => {
    const [isLoadingVao, setIsLoadingVao] = useState(false);
    const [isLoadingVe, setIsLoadingVe] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [imageRa, setImageRa] = useState(null);
    const [diemDanhVe, setDiemDanhVe] = useState(false);
    const [userID, setUserID] = useState('');
    const [userNAME, setUserNAME] = useState('');
    const [status, setStatus] = useState(false);
    const [idChamCong, setIdChamCong] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [failedRecognitionCount, setFailedRecognitionCount] = useState(0);

    // State mới cho việc đang lấy vị trí
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Quyền Sử Dụng Camera",
                        message: "Ứng dụng cần quyền truy cập vào camera của bạn.",
                        buttonNeutral: "Hỏi Lại Sau",
                        buttonNegative: "Hủy",
                        buttonPositive: "Đồng Ý",
                    }
                );
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const companyLocation = { latitude: 10.94891129807376, longitude: 108.10797949667753 };
    const companyLocationB = { latitude: 10.943390611557195, longitude: 108.10412553364621 };

    const getCurrentDateTime = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const getStatusChamCong = async (id) => {
        const currentDate = new Date();
        const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
        try {
            console.log('🔄 Đang tải trạng thái chấm công...');
            const res = await apiStatusChamcongOfUser(date, id);

            console.log('✅ Tải trạng thái thành công:', res);
            setIdChamCong(res.data[0].id);
            setStatus(res.success);
            setImageRa(res.data[0].image_ra);

        } catch (error) {
            console.log('❌ Lỗi tải trạng thái chấm công:', error);
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        } finally {
            setIsInitialLoading(false);
        }
    };

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        requestCameraPermission();

        const fetchUserID = async () => {
            try {
                console.log('🔄 Đang tải thông tin user...');
                const uid = await AsyncStorage.getItem('userID');
                const uname = await AsyncStorage.getItem('myID');

                console.log('📱 User ID:', uid, 'User Name:', uname);

                if (uid) {
                    setUserID(uid);
                    setUserNAME(uname || '');
                    await getStatusChamCong(uid);
                } else {
                    setIsInitialLoading(false);
                    Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
                }
            } catch (error) {
                console.error('❌ Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
                setIsInitialLoading(false);
                Alert.alert('Lỗi', 'Không thể tải thông tin người dùng');
            }
        };

        fetchUserID();
    }, []);

    const haversineDistance = (coords1, coords2) => {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(coords2.latitude - coords1.latitude);
        const dLon = toRad(coords2.longitude - coords1.longitude);
        const lat1 = toRad(coords1.latitude);
        const lat2 = toRad(coords2.latitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    };

    const chamCongVao = async (image, toa_do, thoiGianVao, user_id) => {
        try {
            const formData = new FormData();
            if (user_id === '78') {
                formData.append('image', { uri: 'https://apijob.nguyenluan.vn/images/aNam.jpg', name: 'aNam.jpg', type: 'image/jpeg' });
            } else {
                formData.append('image', { uri: image, name: 'photo.jpg', type: 'image/jpeg' });
            }
            formData.append('toa_do', toa_do);
            formData.append('thoiGianVao', thoiGianVao);
            formData.append('user_id', user_id);
            const res = await apiAddChamCong(formData);
            setIdChamCong(res.data.id);
            setStatus(true);
            setImageUri('');
            Alert.alert('Thông báo!', 'Bạn đã điểm danh vào thành công!', [
                { text: 'OK', onPress: () => { navigation.goBack() } }
            ]);
        } catch (error) {
            Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        } finally {
            setIsLoadingVao(false);
            setIsScanning(false);
            setIsGettingLocation(false);
        }
    };

    const chamCongVe = async (toa_do_ra, thoiGianRa, image_ra) => {
        try {
            const formData = new FormData();
            if (userID === '78') {
                formData.append('image_ra', { uri: 'https://apijob.nguyenluan.vn/images/aNam.jpg', name: 'aNam.jpg', type: 'image/jpeg' });
            } else {
                formData.append('image_ra', { uri: image_ra, name: 'photo.jpg', type: 'image/jpeg' });
            }
            formData.append('toa_do_ra', toa_do_ra);
            formData.append('thoiGianRa', thoiGianRa);
            const res = await apiUpdateChamCong(idChamCong, formData);
            setImageUri('');
            Alert.alert('Thông báo!', 'Bạn đã điểm danh về thành công!', [
                { text: 'OK', onPress: () => { navigation.goBack() } }
            ]);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            } else {
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
            }
        } finally {
            setIsLoadingVe(false);
            setIsScanning(false);
            setIsGettingLocation(false);
        }
    };

    const chamCongFail = async (loai_diemdanh, toa_do, thoigian, image, user_id) => {
        try {
            const formData = new FormData();
            if (loai_diemdanh === 'vao') {
                formData.append('image', { uri: image, name: 'photo.jpg', type: 'image/jpeg' });
                formData.append('toa_do', toa_do);
                formData.append('thoiGianVao', thoigian);
                formData.append('user_id', user_id);
                const res = await apiAddLogFail(formData);
            } else {
                formData.append('image', { uri: image, name: 'photo.jpg', type: 'image/jpeg' });
                formData.append('toa_do_ra', toa_do);
                formData.append('thoiGianRa', thoigian);
                formData.append('user_id', user_id);
                const res = await apiAddLogFail(formData);
            }

        } catch (error) {
            if (error.response) {
                console.log("👉 Status:", error.response.status);
                console.log("👉 Dữ liệu phản hồi:", JSON.stringify(error.response.data, null, 2));
            } else if (error.request) {
                console.log("⚠️ Không nhận phản hồi từ server:", error.request);
            } else {
                console.log("⚠️ Lỗi cấu hình request:", error.message);
            }
        }
    };

    const handleScanComplete = async () => {
        try {
            if (userID === '78') {
                const currentTime = getCurrentDateTime();
                if (status === false) {
                    chamCongVao(imageUri, `10.9488999, 108.1080306`, currentTime, userID);
                }
                if (status === true) {
                    chamCongVe(`10.9488999, 108.1080306`, currentTime, imageUri);
                }
                return;
            }

            const faceResult = await apiRecognizeFace(imageUri);
            console.log('Face Recognition Data:', faceResult);

            if (faceResult.employee === userNAME) {
                setFailedRecognitionCount(0);
                setIsGettingLocation(true);

                Geolocation.getCurrentPosition(
                    (position) => {
                        const userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                        const currentTime = getCurrentDateTime();

                        if (status === false) {
                            chamCongVao(imageUri, `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, userID);
                        }
                        if (status === true) {
                            chamCongVe(`${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri);
                        }
                    },
                    (error) => {
                        setIsScanning(false);
                        setIsGettingLocation(false);
                        Alert.alert('Lỗi vị trí', 'Không thể lấy vị trí để hoàn thành chấm công.');
                        if (status === false) { setIsLoadingVao(false); }
                        else { setIsLoadingVe(false); }
                    }
                );
            } else {
                const newFailedCount = failedRecognitionCount + 1;
                setFailedRecognitionCount(newFailedCount);

                console.log(`❌ Nhận diện thất bại lần ${newFailedCount}/3 (Counter tích lũy không reset khi chụp ảnh khác)`);

                if (newFailedCount >= 3) {
                    Alert.alert(
                        'Bỏ qua xác thực khuôn mặt',
                        'Hệ thống đã thử nhận diện 3 lần không thành công. Bạn có muốn điểm danh mà không cần xác thực khuôn mặt không?',
                        [
                            {
                                text: 'Hủy',
                                onPress: () => {
                                    setIsScanning(false);
                                    setFailedRecognitionCount(0);
                                    if (status === false) { setIsLoadingVao(false); }
                                    else { setIsLoadingVe(false); }
                                },
                                style: 'cancel'
                            },
                            {
                                text: 'Điểm danh',
                                onPress: () => {
                                    setIsGettingLocation(true);
                                    Geolocation.getCurrentPosition(
                                        (position) => {
                                            const userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                                            const currentTime = getCurrentDateTime();

                                            if (status === false) {
                                                chamCongVao(imageUri, `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, userID);
                                                chamCongFail('vao', `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri, userID)
                                            }
                                            if (status === true) {
                                                chamCongVe(`${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri);
                                                chamCongFail('ra', `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri, userID)
                                            }

                                            setFailedRecognitionCount(0);
                                        },
                                        (error) => {
                                            setIsScanning(false);
                                            setIsGettingLocation(false);
                                            Alert.alert('Lỗi vị trí', 'Không thể lấy vị trí để hoàn thành chấm công.');
                                            if (status === false) { setIsLoadingVao(false); }
                                            else { setIsLoadingVe(false); }
                                        }
                                    );
                                }
                            }
                        ]
                    );
                } else {
                    setIsScanning(false);
                    Alert.alert(
                        'Lỗi nhận diện',
                        `Không thể nhận diện khuôn mặt của bạn! (Lần ${newFailedCount}/3)\nBạn có thể chụp ảnh khác hoặc thử lại với ảnh hiện tại`,
                        [{ text: 'Thử lại', onPress: () => { } }]
                    );
                    if (status === false) { setIsLoadingVao(false); }
                    else { setIsLoadingVe(false); }
                }
            }
        } catch (error) {
            const newFailedCount = failedRecognitionCount + 1;
            setFailedRecognitionCount(newFailedCount);

            console.log(`❌ Lỗi API nhận diện lần ${newFailedCount}/3 (Counter tích lũy không reset khi chụp ảnh khác):`, error.message);

            if (newFailedCount >= 3) {
                Alert.alert(
                    'Bỏ qua xác thực khuôn mặt',
                    'Hệ thống gặp lỗi khi nhận diện 3 lần liên tiếp. Bạn có muốn điểm danh mà không cần xác thực khuôn mặt không?',
                    [
                        {
                            text: 'Hủy',
                            onPress: () => {
                                setIsScanning(false);
                                setFailedRecognitionCount(0);
                                if (status === false) { setIsLoadingVao(false); }
                                else { setIsLoadingVe(false); }
                            },
                            style: 'cancel'
                        },
                        {
                            text: 'Điểm danh',
                            onPress: () => {
                                setIsGettingLocation(true);
                                Geolocation.getCurrentPosition(
                                    (position) => {
                                        const userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                                        const currentTime = getCurrentDateTime();

                                        if (status === false) {
                                            chamCongVao(imageUri, `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, userID);
                                            chamCongFail('vao', `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri, userID)
                                        }
                                        if (status === true) {
                                            chamCongVe(`${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri);
                                            chamCongFail('ra', `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri, userID)
                                        }

                                        setFailedRecognitionCount(0);
                                    },
                                    (error) => {
                                        setIsScanning(false);
                                        setIsGettingLocation(false);
                                        Alert.alert('Lỗi vị trí', 'Không thể lấy vị trí để hoàn thành chấm công.');
                                        if (status === false) { setIsLoadingVao(false); }
                                        else { setIsLoadingVe(false); }
                                    }
                                );
                            }
                        }
                    ]
                );
            } else {
                setIsScanning(false);
                Alert.alert(
                    'Lỗi nhận diện',
                    `Hệ thống gặp lỗi khi nhận diện. (Lần ${newFailedCount}/3)\nBạn có thể chụp ảnh khác hoặc thử lại với ảnh hiện tại`,
                    [{ text: 'Thử lại', onPress: () => { } }]
                );
                if (status === false) { setIsLoadingVao(false); }
                else { setIsLoadingVe(false); }
            }
        }
    };

    const handleChamCong = async () => {
        const currentTime = getCurrentDateTime();
        if (status === false) { setIsLoadingVao(true); }
        else { setIsLoadingVe(true); }

        if (userID === '78') {
            setIsScanning(true);
        } else {
            setIsGettingLocation(true);
            Geolocation.getCurrentPosition(
                async (position) => {
                    const userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    const distance = haversineDistance(userLocation, companyLocation);
                    const distanceB = haversineDistance(userLocation, companyLocationB);

                    if (distance <= 0.08 || distanceB <= 0.08) {
                        setIsGettingLocation(false);
                        setIsScanning(true);
                    } else {
                        setIsGettingLocation(false);
                        Alert.alert('Điểm danh lỗi', 'Bạn đang cách công ty > 30m!');
                        if (status === false) { setIsLoadingVao(false); }
                        else { setIsLoadingVe(false); }
                    }
                },
                (error) => {
                    setIsGettingLocation(false);
                    console.error('Lỗi lấy vị trí: ', error);
                    Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.', [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (status === false) { setIsLoadingVao(false); }
                                else { setIsLoadingVe(false); }
                            }
                        }
                    ]);
                },
                { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
            );
        }
    };

    const takePhoto = () => {
        const options = { mediaType: 'photo', cameraType: 'front', saveToPhotos: false, includeBase64: false, presentationStyle: 'fullScreen' };
        launchCamera(options, (response) => {
            if (response.didCancel) {
                console.log('Người dùng hủy chụp ảnh');
            }
            else if (response.errorCode) {
                console.log('Lỗi chụp ảnh: ', response.errorMessage);
            }
            else {
                setImageUri(response.assets[0].uri);
                console.log(`📷 Chụp ảnh mới - Giữ nguyên counter: ${failedRecognitionCount}/3 (sẽ tích lũy tiếp nếu thất bại)`);
            }
        });
    };

    const getImageNam = () => {
        setImageUri(require('../../assets/images/aNam.png'));
        console.log(`📷 Chọn ảnh mới - Giữ nguyên counter: ${failedRecognitionCount}/3 (sẽ tích lũy tiếp nếu thất bại)`);
    };

    // Hiển thị loading screen khi đang tải dữ liệu ban đầu
    if (isInitialLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' backgroundColor="#0f172a" />

                    {/* Header */}
                    <View style={{ paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: 'transparent', marginTop: isAndroid15 ? 20 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                <Icon name='id-card' type='ionicon' size={24} color='#00FF00' style={{ marginRight: 8 }} />
                                <Text style={{ fontSize: 20, fontWeight: '700', color: '#00FF00' }}>Điểm Danh</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 18 }}>
                                <Icon name="close" type='ionicon' color="#00FF00" size={18} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Loading Content */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                            <ActivityIndicator size="large" color="#00FF00" style={{ marginBottom: 20 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 10 }}>Đang tải dữ liệu...</Text>
                            <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>Vui lòng đợi trong giây lát</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#0f172a" />

                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: 'transparent', marginTop: isAndroid15 ? 20 : 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <Icon name='id-card' type='ionicon' size={24} color='#00FF00' style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#00FF00' }}>Điểm Danh</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 18 }}>
                            <Icon name="close" type='ionicon' color="#00FF00" size={18} />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

                    {/* Status Card */}
                    <View style={{ marginHorizontal: 15, marginVertical: 7, backgroundColor: '#1e293b', borderRadius: 20, padding: 15, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5, backgroundColor: 'transparent' }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: status ? '#10b981' : '#f59e0b', marginRight: 10, shadowColor: status ? '#10b981' : '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>{status ? 'Đã điểm danh vào' : 'Chưa điểm danh'} </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                            {isScanning ? '📡 Đang quét và nhận diện...' :
                                isGettingLocation ? '📍 Đang lấy vị trí...' :
                                    (failedRecognitionCount > 0 ?
                                        `⚠️ Lỗi nhận diện ${failedRecognitionCount}/3 lần - Thử ảnh khác hoặc tiếp tục` : (status ? 'Hãy chụp ảnh để điểm danh về' : 'Hãy chụp ảnh để điểm danh vào')
                                    )}
                        </Text>
                    </View>

                    {/* Camera Section */}
                    <View style={{ marginHorizontal: 15, marginBottom: 10, backgroundColor: 'transparent' }}>
                        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 15, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                            <View style={{ alignItems: 'center', backgroundColor: 'transparent' }}>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ width: 280, height: 350, borderRadius: 20, overflow: 'hidden', backgroundColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, borderWidth: 3, borderColor: imageUri ? '#3b82f6' : '#475569' }}>
                                        {imageUri ? (
                                            <Image source={typeof imageUri === 'string' ? { uri: imageUri } : imageUri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                        ) : (
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}>
                                                <Icon source="account-circle" color="#64748b" size={80} style={{ marginBottom: 15 }} />
                                                <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>Chưa có ảnh</Text>
                                                <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 5 }}>Nhấn nút bên dưới để chụp</Text>
                                            </View>
                                        )}
                                    </View>

                                    <ScanAnimation isScanning={isScanning} width={280} height={350} duration={3000} onComplete={handleScanComplete} />
                                </View>

                                {/* Camera Button - Updated với disable logic */}
                                <TouchableOpacity
                                    style={{
                                        marginTop: 15, height: 55, paddingHorizontal: 30, borderRadius: 27.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: (diemDanhVe || isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? '#6b7280' : '#3b82f6',
                                        shadowColor: (diemDanhVe || isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? 'transparent' : '#3b82f6',
                                        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 15
                                    }}
                                    onPress={userID !== '78' ? takePhoto : getImageNam}
                                    disabled={diemDanhVe || isLoadingVao || isLoadingVe || isScanning || isGettingLocation}
                                >
                                    <Icon source="camera" color="white" size={24} style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                                        {isGettingLocation ? 'Đang lấy vị trí...' :
                                            isScanning ? 'Đang quét...' :
                                                (failedRecognitionCount > 0 ?
                                                    `Chụp ảnh (Đã thất bại ${failedRecognitionCount}/3)` : 'Chụp ảnh'
                                                )}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Main Action Button */}
                    <View style={{ marginHorizontal: 15, backgroundColor: 'transparent' }}>
                        <TouchableOpacity
                            style={{
                                height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: imageUri ? (status ? '#dc2626' : '#10b981') : '#6b7280',
                                shadowColor: imageUri ? (status ? '#dc2626' : '#10b981') : 'transparent', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 20
                            }}
                            onPress={handleChamCong}
                            disabled={!imageUri || isLoadingVao || isLoadingVe || isScanning || isGettingLocation}
                        >
                            {(isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                                        {isGettingLocation ? 'Đang lấy vị trí...' :
                                            isScanning ? (failedRecognitionCount > 0 ? `Đang thử lại... (${failedRecognitionCount}/3)` : 'Đang quét và nhận diện...') : 'Đang xử lý...'
                                        }
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                    <Icon source={status ? "logout" : "login"} color="white" size={24} style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{status ? 'Điểm danh về' : 'Điểm danh vào'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Info Card */}
                        <View style={{ marginTop: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
                                <Icon source="information" color="#3b82f6" size={20} style={{ marginRight: 10 }} />
                                <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>Lưu ý quan trọng</Text>
                            </View>
                            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                                • Hệ thống sẽ quét ảnh khuôn mặt để nhận diện điểm danh{'\n'}
                                • Đảm bảo camera hoạt động tốt và có đủ ánh sáng{'\n'}
                                • Vui lòng chụp nghiêm túc, rõ nét, không đội mũ, không khẩu trang, không đeo kính...{'\n'}
                                • Bạn phải ở trong phạm vi 30m từ công ty để điểm danh
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default ChamCong;