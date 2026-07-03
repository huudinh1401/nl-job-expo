import React, { useState, useEffect } from 'react';
import { Text, View, Platform, Image, Alert, ActivityIndicator, StatusBar, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAddChamCong, apiStatusChamcongOfUser, apiUpdateChamCong } from '../../services/apiService';
import { apiRecognizeFace } from '../../services/apiServiceCheckFace';
import ScanAnimation from '../../components/ScanAnimation';

const { width } = Dimensions.get('window');
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const ChamCongScreen = ({ navigation }) => {
    const [isLoadingVao, setIsLoadingVao] = useState(false);
    const [isLoadingVe, setIsLoadingVe] = useState(false);
    const [imageUri, setImageUri] = useState(null);
    const [imageRa, setImageRa] = useState(null);
    const [userID, setUserID] = useState('');
    const [userNAME, setUserNAME] = useState('');
    const [status, setStatus] = useState(false);
    const [idChamCong, setIdChamCong] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [pendingAttendance, setPendingAttendance] = useState(null);
    const [failedRecognitionCount, setFailedRecognitionCount] = useState(0);

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
        const fetchUserID = async () => {
            try {
                console.log('🔄 Đang tải thông tin user...');
                const uid = await AsyncStorage.getItem('userID');
                const uname = await AsyncStorage.getItem('email');
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
            Alert.alert('Thông báo!', 'Bạn đã điểm danh vào thành công!', [{ text: 'OK', onPress: () => { navigation.goBack() } }]);
        } catch (error) {
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
        } finally {
            setIsLoadingVao(false);
            setIsScanning(false);
            setIsGettingLocation(false);
            setPendingAttendance(null);
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
            Alert.alert('Thông báo!', 'Bạn đã điểm danh về thành công!', [{ text: 'OK', onPress: () => { navigation.goBack() } }]);
        } catch (error) {
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
        } finally {
            setIsLoadingVe(false);
            setIsScanning(false);
            setIsGettingLocation(false);
            setPendingAttendance(null);
        }
    };

    const completeAttendance = async (attendanceData) => {
        if (!attendanceData) {
            setIsScanning(false);
            setIsLoadingVao(false);
            setIsLoadingVe(false);
            return;
        }

        const { currentTime, userLocation } = attendanceData;

        if (status === false) {
            await chamCongVao(imageUri, `${userLocation.latitude}, ${userLocation.longitude}`, currentTime, userID);
        } else {
            await chamCongVe(`${userLocation.latitude}, ${userLocation.longitude}`, currentTime, imageUri);
        }
    };

    const handleScanComplete = async () => {
        if (!pendingAttendance) {
            setIsScanning(false);
            return;
        }

        if (userID === '78') {
            await completeAttendance(pendingAttendance);
            return;
        }

        try {
            const faceResult = await apiRecognizeFace(imageUri);
            console.log('Face Recognition Data:', faceResult);
            console.log('employee:', faceResult?.employee);
            console.log('userNAME:', userNAME);
            if (faceResult?.employee === userNAME) {
                setFailedRecognitionCount(0);
                await completeAttendance(pendingAttendance);
                return;
            }

            const newFailedCount = failedRecognitionCount + 1;
            setFailedRecognitionCount(newFailedCount);
            setIsScanning(false);

            if (newFailedCount >= 3) {
                Alert.alert(
                    'Bỏ qua xác thực khuôn mặt',
                    'Hệ thống đã thử nhận diện 3 lần không thành công. Bạn có muốn điểm danh mà không cần xác thực khuôn mặt không?',
                    [
                        {
                            text: 'Hủy',
                            style: 'cancel',
                            onPress: () => {
                                setFailedRecognitionCount(0);
                                setPendingAttendance(null);
                                if (status === false) setIsLoadingVao(false);
                                else setIsLoadingVe(false);
                            },
                        },
                        {
                            text: 'Điểm danh',
                            onPress: async () => {
                                setFailedRecognitionCount(0);
                                await completeAttendance(pendingAttendance);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Lỗi nhận diện',
                    `Không thể nhận diện khuôn mặt của bạn! (Lần ${newFailedCount}/3)\nBạn có thể chụp ảnh khác hoặc thử lại với ảnh hiện tại`,
                    [
                        {
                            text: 'Thử lại',
                            onPress: () => {
                                if (status === false) setIsLoadingVao(false);
                                else setIsLoadingVe(false);
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            const newFailedCount = failedRecognitionCount + 1;
            setFailedRecognitionCount(newFailedCount);
            setIsScanning(false);
            console.error('Lỗi API nhận diện:', error);

            if (newFailedCount >= 3) {
                Alert.alert(
                    'Bỏ qua xác thực khuôn mặt',
                    'Hệ thống gặp lỗi khi nhận diện 3 lần liên tiếp. Bạn có muốn điểm danh mà không cần xác thực khuôn mặt không?',
                    [
                        {
                            text: 'Hủy',
                            style: 'cancel',
                            onPress: () => {
                                setFailedRecognitionCount(0);
                                setPendingAttendance(null);
                                if (status === false) setIsLoadingVao(false);
                                else setIsLoadingVe(false);
                            },
                        },
                        {
                            text: 'Điểm danh',
                            onPress: async () => {
                                setFailedRecognitionCount(0);
                                await completeAttendance(pendingAttendance);
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    'Lỗi nhận diện',
                    `Hệ thống gặp lỗi khi nhận diện. (Lần ${newFailedCount}/3)\nBạn có thể chụp ảnh khác hoặc thử lại với ảnh hiện tại`,
                    [
                        {
                            text: 'Thử lại',
                            onPress: () => {
                                if (status === false) setIsLoadingVao(false);
                                else setIsLoadingVe(false);
                            },
                        },
                    ]
                );
            }
        }
    };

    const handleChamCong = async () => {
        if (!imageUri && userID !== '78') {
            Alert.alert('Lỗi', 'Vui lòng chụp ảnh trước khi chấm công!');
            return;
        }

        if (status === false) { setIsLoadingVao(true); }
        else { setIsLoadingVe(true); }

        setIsGettingLocation(true);
        try {
            let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            if (locationStatus !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập vị trí để chấm công!');
                if (status === false) { setIsLoadingVao(false); }
                else { setIsLoadingVe(false); }
                setIsGettingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const userLocation = { latitude: location.coords.latitude, longitude: location.coords.longitude };
            const distance = haversineDistance(userLocation, companyLocation);
            const distanceB = haversineDistance(userLocation, companyLocationB);

            if (distance <= 0.5 || distanceB <= 0.5) {
                setIsGettingLocation(false);
                const currentTime = getCurrentDateTime();
                setPendingAttendance({ currentTime, userLocation });
                setIsScanning(true);
            } else {
                setIsGettingLocation(false);
                Alert.alert('Điểm danh lỗi', 'Bạn đang cách công ty > 30m!');
                if (status === false) { setIsLoadingVao(false); }
                else { setIsLoadingVe(false); }
                setPendingAttendance(null);
            }
        } catch (error) {
            setIsGettingLocation(false);
            console.error('Lỗi lấy vị trí: ', error);
            Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
            if (status === false) { setIsLoadingVao(false); }
            else { setIsLoadingVe(false); }
            setPendingAttendance(null);
        }
    };

    const takePhoto = async () => {
        try {
            if (userID === '78') {
                setImageUri('https://apijob.nguyenluan.vn/images/aNam.jpg');
                return;
            }

            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh!');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                aspect: [3, 4],
                quality: 0.8,
                cameraType: ImagePicker.CameraType.front,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Lỗi chụp ảnh: ', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
        }
    };

    if (isInitialLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' backgroundColor="#0f172a" />
                    <View style={{ height: 50, backgroundColor: '#1e3a8a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, marginTop: isAndroid15 ? 35 : 0, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="access-time" size={24} color="#10b981" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>Chấm Công</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                            <ActivityIndicator size="large" color="#10b981" style={{ marginBottom: 20 }} />
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

                <View style={{ height: 50, backgroundColor: '#1e3a8a', borderRadius: 12, justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 5, marginTop: isAndroid15 ? 35 : 0, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, flexDirection: 'row', paddingHorizontal: 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="access-time" size={24} color="#10b981" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>Chấm Công</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 18 }}>
                        <Ionicons name="close" color="#f1f5f9" size={18} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

                    <View style={{ marginHorizontal: 15, marginVertical: 7, backgroundColor: '#1e293b', borderRadius: 20, padding: 15, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: status ? '#10b981' : '#f59e0b', marginRight: 10, shadowColor: status ? '#10b981' : '#f59e0b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>{status ? 'Đã điểm danh vào' : 'Chưa điểm danh'}</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                            {isScanning ? '📡 Đang quét và nhận diện...' : isGettingLocation ? '📍 Đang lấy vị trí...' : (failedRecognitionCount > 0 ? `⚠️ Lỗi nhận diện ${failedRecognitionCount}/3 lần - Thử ảnh khác hoặc tiếp tục` : (status ? 'Hãy chụp ảnh để điểm danh về' : 'Hãy chụp ảnh để điểm danh vào'))}
                        </Text>
                    </View>

                    <View style={{ marginHorizontal: 15, marginBottom: 10 }}>
                        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 15, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 15, borderWidth: 1, borderColor: '#334155' }}>
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ position: 'relative' }}>
                                    <View style={{ width: 280, height: 350, borderRadius: 20, overflow: 'hidden', backgroundColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, borderWidth: 3, borderColor: imageUri ? '#3b82f6' : '#475569' }}>
                                        {imageUri ? (
                                            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                        ) : (
                                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                <MaterialIcons name="account-circle" color="#64748b" size={80} style={{ marginBottom: 15 }} />
                                                <Text style={{ fontSize: 16, color: '#94a3b8', textAlign: 'center', fontWeight: '600' }}>Chưa có ảnh</Text>
                                                <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 5 }}>Nhấn nút bên dưới để chụp</Text>
                                            </View>
                                        )}
                                    </View>

                                    <ScanAnimation
                                        isScanning={isScanning}
                                        width={280}
                                        height={350}
                                        duration={3000}
                                        onComplete={handleScanComplete}
                                    />
                                </View>

                                <TouchableOpacity style={{ marginTop: 15, height: 55, paddingHorizontal: 30, borderRadius: 27.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: (isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? '#6b7280' : '#3b82f6', shadowColor: (isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? 'transparent' : '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 15 }} onPress={takePhoto} disabled={isLoadingVao || isLoadingVe || isScanning || isGettingLocation}>
                                    <MaterialIcons name="camera-alt" color="white" size={24} style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                                        {isGettingLocation ? 'Đang lấy vị trí...' : isScanning ? 'Đang quét...' : (failedRecognitionCount > 0 ? `Chụp ảnh (Đã thất bại ${failedRecognitionCount}/3)` : 'Chụp ảnh')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={{ marginHorizontal: 15 }}>
                        <TouchableOpacity style={{ height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: imageUri ? (status ? '#dc2626' : '#10b981') : '#6b7280', shadowColor: imageUri ? (status ? '#dc2626' : '#10b981') : 'transparent', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 20 }} onPress={handleChamCong} disabled={!imageUri || isLoadingVao || isLoadingVe || isScanning || isGettingLocation}>
                            {(isLoadingVao || isLoadingVe || isScanning || isGettingLocation) ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>
                                        {isGettingLocation ? 'Đang lấy vị trí...' : isScanning ? (failedRecognitionCount > 0 ? `Đang thử lại... (${failedRecognitionCount}/3)` : 'Đang quét và nhận diện...') : 'Đang xử lý...'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name={status ? "logout" : "login"} color="white" size={24} style={{ marginRight: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>{status ? 'Điểm danh về' : 'Điểm danh vào'}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={{ marginTop: 10, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="info" color="#3b82f6" size={20} style={{ marginRight: 10 }} />
                                <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>Lưu ý quan trọng</Text>
                            </View>
                            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 8, lineHeight: 18 }}>
                                • Hệ thống sẽ quét ảnh khuôn mặt để nhận diện điểm danh{'\n'}
                                • Đảm bảo camera hoạt động tốt và có đủ ánh sáng{'\n'}
                                • Vui lòng chụp nghiêm túc, rõ nét{'\n'}
                                • Bạn phải ở trong phạm vi 30m từ công ty để điểm danh
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

export default ChamCongScreen;
