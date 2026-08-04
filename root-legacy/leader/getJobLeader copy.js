import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    Text,
    StyleSheet,
    View,
    Linking,
    Platform,
    PermissionsAndroid,
    Image,
    Alert,
    ActivityIndicator,
    StatusBar,
    TouchableOpacity,
    TextInput,
    Keyboard,
    ImageBackground,
    TouchableWithoutFeedback
} from 'react-native';
//import { Icon } from 'react-native-elements';
//import { useRoute } from '@react-navigation/native';
import HeaderLeader from './headerLeader';
import Geolocation from '@react-native-community/geolocation';
import socket from '../../config/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCheckStatusUser, apiFinishJob, apiGetJob, apiGetJobHistory, apiGetUserInfo, apiUpdateStatusUser, apiUpdateToaDo } from '../../config/apiService';
import { isTablet, width, height } from '../../config/deviceConfig'


const GetJobLeader = ({ isGetJob, navigation, setIsGetJob, jobUser, setJobUser, route, valueJob, setValueJob, idJob, setIdJob }) => {
    // const { userIDD } = route.params.userIDD ? route.params.userIDD : null;
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
    // const [user, setUser] = useState([]);
    const [location, setLocation] = useState(null);
    // const [loading, setLoading] = useState(true);

    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'ios') {
                Geolocation.getCurrentPosition(
                    (position) => {
                        //console.log('Vị trí hiện tại:', position);
                        // Quyền đã được cấp, có thể lấy vị trí
                        // getLocation();
                    },
                    (error) => {
                        console.log('Lỗi khi lấy vị trí:', error);
                        if (error.code === 1) { // Permission denied
                            console.log('Quyền truy cập vị trí bị từ chối.');
                            showAlert();
                        }
                    }
                );
            } else if (Platform.OS === 'android') {
                // Yêu cầu quyền truy cập vị trí cho Android
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
                //console.log('Authorization result:', granted);

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    // Quyền đã được cấp, có thể lấy vị trí
                    //getLocation();
                } else {
                    console.log('Quyền truy cập vị trí bị từ chối');
                    showAlert();
                }
            }
        } catch (error) {
            console.error('Lỗi khi yêu cầu quyền truy cập vị trí:', error);
        }
    };


    // Hàm để mở cài đặt ứng dụng
    const openSettings = () => {
        Linking.openSettings();
    };

    // Hàm để hiển thị thông báo yêu cầu quyền truy cập
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

            } catch (error) {

            }
        };
        //fetchUpdateLocationJobs(jobUser.id ? jobUser.id : idJob, `10, 108`)

        Geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation(position);
                fetchUpdateLocationJobs(jobUser.id ? jobUser.id : idJob, `${latitude}, ${longitude}`);
            },
            (error) => {
                console.error(`Lỗi lấy vị trí: ${error.message}`);
                if (error.code === 1) {
                    // Lỗi permission bị từ chối
                    Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.');
                }
            },
            { enableHighAccuracy: Platform.OS === 'ios' ? true : false, timeout: 20000, maximumAge: 30000 }
        );
    };

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        requestLocationPermission();
        const fetchAndSetUserData = async () => {
            try {
                // Kiểm tra nếu route.params có userID
                let id;
                if (route && route.params && route.params.userIDD) {
                    id = route.params.userIDD;
                } else {
                    id = await AsyncStorage.getItem('userID');
                }

                if (id) {
                    setUserID(id);

                    // Lấy thêm các thông tin khác từ AsyncStorage
                    const username = await AsyncStorage.getItem('username');
                    const job = await AsyncStorage.getItem('job');
                    const avatar = await AsyncStorage.getItem('avatar');

                    // Set state với các giá trị lấy được
                    username && setUsername(username);
                    job && setJob(job);
                    avatar && setAvatar(avatar);

                    // Lấy lịch sử công việc (giả sử hàm getHistoryJob tồn tại)
                    getHistoryJob(id);
                    if (!socket.connected) {
                        socket.connect();
                    }
                    socket.on('jobsent', (data) => {
                        console.log('Nhận được job từ user:');
                        getHistoryJob(id);
                    });
                } else {
                    console.error('User ID not found in route or AsyncStorage');
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        }

        fetchAndSetUserData();


        if (isGetJob) {
            const id = setInterval(() => {
                updateLocation();
            }, 300000); // 300000ms = 5 phút
            setIntervalId(id);
        }

        //Cleanup khi component unmount
        // return () => {
        //     socket.disconnect();
        // };

    }, []);
    useEffect(() => {
        if (isGetJob) {
            const id = setInterval(() => {
                updateLocation();
            }, 300000); // 300000ms = 5 phút
            setIntervalId(id);
        }

        // Khi isGetJob = false, xóa interval để dừng cập nhật vị trí
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isGetJob]);
    const getHistoryJob = async (id) => {
        try {
            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);
            //console.log('lich su aaa: ', filteredData[0].noi_dung)
            setValueJob(filteredData[0].noi_dung)
            setIdJob(filteredData[0].id)

        } catch (error) {
            //console.log('lich su a: ', error)
            //Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi lấy lịch sử Jobbbbb!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }
    const updateStatusUser = async (id, stt) => {
        try {
            const res = await apiUpdateStatusUser(id, stt);
            console.log('cap nhat Stt user: ', res)
        } catch (error) {
            //console.log('lich su: ', error)
            //Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi cập nhật trạng thái user!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
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
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => {
                            setIsLoadingGetJob(false); // Đảm bảo trạng thái loading được dừng khi huỷ
                        },
                    },
                    {
                        text: 'OK',
                        onPress: () => {
                            // Gọi hàm lấy vị trí khi người dùng xác nhận
                            getCurrentPosition();
                        },
                    },
                ]
            );
        };
        const fetchJobs = async (id, status, start, toa_do) => {
            try {
                const data = await apiGetJob(id, status, start, toa_do);
                //console.log('Công việc đã được nhanaj:', data.data.id);
                updateStatusUser(userID, 1);
                setIsGetJob(true);
                setEditable(false);
                socket.emit('getJob', { message: 'Toi da nhan Job' });
            } catch (error) {
                console.log(error);
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi nhận việc!', 'Vui lòng kiểm tra lại kết nối mạng.');
                }
            } finally {
                setIsLoadingGetJob(false);
            }
        };

        //fetchJobs(1, text, currentTime, userID, `10.23123131, 108.12312412412421`);

        const getCurrentPosition = () => {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation(position);
                    fetchJobs(jobUser.id ? jobUser.id : idJob, 1, currentTime, `${latitude}, ${longitude}`);
                },
                (error) => {
                    console.error(`Lỗi lấy vị trí: ${error.message}`);
                    Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    if (error.code === 1) {
                        // Lỗi permission bị từ chối
                        Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.'); sdsdsd
                    }
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
        //console.log('idJob', idJob)
        const confirmFinishJob = () => {
            Alert.alert(
                'Xác nhận hoàn thành công việc',
                'Bạn đã chắc chắn hoàn thành công việc?',
                [
                    {
                        text: 'Hủy',
                        style: 'cancel',
                        onPress: () => {
                            setIsLoadingFinish(false);
                        },
                    },
                    {
                        text: 'OK',
                        onPress: () => {
                            getCurrentPosition();
                        },
                    },
                ]
            );
        };
        const fetchFinishJobs = async (id, end, status, toa_do, note) => {
            try {
                const data = await apiFinishJob(id, end, status, toa_do, note);
                updateStatusUser(userID, 0);
                setIsGetJob(false);
                setEditable(true);
                setJobUser([])
                setJobWorking[[]]
                setValueJob('')
                setText('');
                socket.emit('getJob', { message: 'Toi da hoan thanh Job' });

            } catch (error) {
                Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                    Alert.alert('Lỗi hoàn thành việc!', 'Vui lòng kiểm tra lại kết nối mạng.');
                }
            } finally {
                setIsLoadingFinish(false);
            }
        };
        //fetchFinishJobs(jobUser.id ? jobUser.id : idJob, currentTime, status, `${latitude}, ${longitude}`);

        const getCurrentPosition = () => {
            Geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation(position);
                    fetchFinishJobs(jobUser.id ? jobUser.id : idJob, currentTime, status, `${latitude}, ${longitude}`, txtGhiChu);
                },
                (error) => {
                    console.error(`Lỗi lấy vị trí: ${error.message}`);
                    Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
                    if (error.code === 1) {
                        // Lỗi permission bị từ chối
                        Alert.alert('Permission Denied', 'Ứng dụng không có quyền truy cập vị trí.');
                    }
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
    return (
        <ImageBackground
            source={require('../../assets/images/background/nen.jpg')}  // Đường dẫn đến ảnh nền
            style={{ flex: 1, resizeMode: 'cover', }}
        >
            <TouchableWithoutFeedback onPress={handleOutsidePress}>
                <SafeAreaView style={{ flex: 1 }}>
                    <StatusBar barStyle='light-content' />
                    <View style={{ height: 45, zIndex: 9 }}>
                        <HeaderLeader navigation={navigation} visible={visible} setVisible={setVisible} title={'Nhận Việc'} />
                    </View>
                    <View style={{ paddingHorizontal: 5 }}>

                        <View style={{ height: 120, justifyContent: 'center', alignItems: 'center', zIndex: 5, marginTop: 2, }}>
                            <View style={{
                                width: 99, height: 99, justifyContent: 'center', alignItems: 'center', borderRadius: 60, backgroundColor: 'white',
                                borderColor: 'white', borderWidth: 0.5,
                            }}>
                                {
                                    avatar ?
                                        <Image
                                            source={{ uri: avatar }}
                                            style={{ width: 88, height: 88, borderRadius: 60 }}
                                        /> : null
                                }

                            </View>
                        </View>
                        <View style={{
                            height: 100, backgroundColor: 'rgba(0,128,0, 0.5)', marginTop: -50, marginHorizontal: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center',

                        }}>
                            <View style={{ justifyContent: 'center', marginLeft: 5, marginTop: 45 }}>
                                <Text style={{ fontSize: 20, color: 'yellow', fontWeight: 'bold' }}>{username}</Text>
                            </View>
                            <View style={{ justifyContent: 'center', marginLeft: 5, marginTop: 5 }}>
                                <Text style={{ fontSize: 15, color: 'white', fontWeight: 'bold' }}>Nhân viên: {job}</Text>
                            </View>
                        </View>
                        <View style={{ padding: 5, marginTop: 5 }}>
                            <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 16, marginLeft: 5 }}>Công việc:</Text>
                        </View>

                        <View style={{ padding: 5 }}>
                            <TextInput
                                style={[styles.input, { opacity: 0.6 }]}
                                multiline={true}
                                numberOfLines={4}
                                value={valueJob ? valueJob : 'Hiện chưa có việc...'}
                                editable={false}
                            />
                        </View>
                        {
                            isGetJob ?
                                <>
                                    <View style={{ padding: 5, marginTop: 0 }}>
                                        <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 15, marginLeft: 5 }}>Ghi chú:</Text>
                                    </View>

                                    <View style={{ padding: 5, marginTop: -5 }}>
                                        <TextInput
                                            style={{
                                                height: 70, padding: 5, textAlignVertical: 'top', fontSize: 14,
                                                color: 'black', borderRadius: 10, backgroundColor: 'white'
                                            }}
                                            placeholder='Nhập vấn đề phát sinh trong công việc...'
                                            placeholderTextColor={'grey'}
                                            multiline={true}
                                            numberOfLines={2}
                                            value={txtGhiChu}
                                            onChangeText={(text) => setTxtGhiChu(text)}

                                        />
                                    </View >
                                </> : null
                        }
                        <View style={{ height: 45, marginHorizontal: 10, marginBottom: 10 }}>
                            {
                                isGetJob ?
                                    <TouchableOpacity
                                        style={{ width: '100%', height: 45, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red', borderRadius: 5 }}
                                        onPress={() => handleFinishJob()}
                                        disabled={isLoadingFinish}
                                    >
                                        {isLoadingFinish ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.btnText}>Hoàn thành</Text>
                                        )}

                                    </TouchableOpacity>
                                    :
                                    <TouchableOpacity
                                        style={{ width: '100%', height: 45, justifyContent: 'center', alignItems: 'center', backgroundColor: valueJob ? 'green' : 'gray', borderRadius: 5 }}
                                        onPress={() => handleGetJob()}
                                        disabled={!valueJob || isLoadingGetJob}
                                    >
                                        {isLoadingGetJob ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.btnText}>Nhận việc</Text>
                                        )}
                                    </TouchableOpacity>
                            }

                        </View>
                    </View>

                </SafeAreaView>
            </TouchableWithoutFeedback >
        </ImageBackground>
    );
}

export default GetJobLeader;
const styles = StyleSheet.create({
    image: {
        flex: 1,
        resizeMode: "cover",
        flexDirection: 'column',
    },
    btnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    input: {
        height: 110,
        borderColor: '#000',
        borderWidth: 1,
        padding: 5,
        textAlignVertical: 'top',
        fontSize: 15,
        color: 'black',
        borderRadius: 10,
        backgroundColor: 'white',
        marginTop: -5
    },

});