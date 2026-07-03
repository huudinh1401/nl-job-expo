import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, View, Image } from 'react-native';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './src/config/api'; // Đường dẫn đến file cấu hình axios
import { isTablet } from './src/config/deviceConfig';
import { navigationRef } from './src/config/navigationService';
import messaging from '@react-native-firebase/messaging';

import Job from './src/components/job/job';
import LoginScreen from './src/components/login/login';
import { apiGetJobHistory, apiCheckStatusUser, apiUpdateDeviceToken } from './src/config/apiService'; // Thêm apiCheckStatusUser
import ChangePass from './src/components/changePass/changePass';
import HistoryUser from './src/components/history/historyUser';
import AdminHome from './src/components/admin/adminHome';
import HistoryAdmin from './src/components/history/historyAdmin';
import ChamCong from './src/components/diemDanh/chamCong';
import BangChamCong from './src/components/diemDanh/bangChamCong';
import JobLeader from './src/components/leader/jobLeader';
import InfoScreen from './src/components/about/infoScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userID, setUserID] = useState(null);
  const [isGetJob, setIsGetJob] = useState(false);
  const [valueJob, setValueJob] = useState('');


  const [jobUser, setJobUser] = useState([]); // Thêm state isGetJob
  const [role, setRole] = useState(null);
  async function requestUserPermission() {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Quyền thông báo đã được cấp.');
    } else {
      console.log('Quyền thông báo không được cấp.');
    }
  }

  const fetchUserID = async () => {
    try {
      const id = await AsyncStorage.getItem('userID');
      if (id) {
        setUserID(id);
      }
      return id; // Trả về userID
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
    }
  };

  const checkUserStatus = async (userID) => {
    try {
      const res = await apiCheckStatusUser(userID); // Gọi API kiểm tra trạng thái
      const { message, data } = res; // Giả sử message trả về là để xác định trạng thái
      //console.log('Log app: ', res);
      if (message === 1) {
        setIsGetJob(true); // Đang nhận việc
      } else {
        setIsGetJob(false); // Không nhận việc
      }
      // if (data) {
      //   setJobUser(data);
      // }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái nhận việc:', error);
      // Xử lý lỗi nếu cần
    }
  };
  const getHistoryJob = async () => {
    try {
      const id = await AsyncStorage.getItem('userID');
      //console.log('lich su aaa: ', id)
      const res = await apiGetJobHistory();
      const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);
      //console.log('lich su aaa: ', filteredData[0])
      if (filteredData.length > 0) {
        setJobUser(filteredData[0]);
        setValueJob(filteredData[0].noi_dung)
      }
    } catch (error) {
      //console.log('lich su a: ', error)
      //Alert.alert('Lỗi lấy vị trí', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.');
      if (error.response && error.response.status !== 401 && error.response.status !== 403) {
        Alert.alert('Lỗi lấy lịch sử Job!', 'Vui lòng kiểm tra lại kết nối mạng.');
      }
    }
  }

  useEffect(() => {
    requestUserPermission();
    const checkAuth = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userRole = await AsyncStorage.getItem('role');
      setRole(userRole);

      if (accessToken && refreshToken) {
        try {
          const jobHistoryData = await apiGetJobHistory();
          setIsAuthenticated(true);
          //console.log('jobHistoryData: ', jobHistoryData);

          const userID = await fetchUserID(); // Lấy từ AsyncStorage

          // Kiểm tra trạng thái nhận việc
          if (userID) {
            checkUserStatus(userID);
            getHistoryJob();
          }

        } catch (error) {
          const axiosError = error;
          if (axiosError.response && axiosError.response.status === 401) {
            try {
              const response = await api.post('/auth/refresh-token', { refreshToken });
              await AsyncStorage.setItem('accessToken', response.data.accessToken);
              setIsAuthenticated(true);
            } catch (refreshError) {
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');
              setIsAuthenticated(false);
              Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    const notification = async () => {
      // Thiết lập background message handler
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        console.log('Received background message:', remoteMessage);
      });

      // Thiết lập message handler khi ứng dụng đang chạy
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        const { type, title, body } = remoteMessage.data || {};
        console.log('data noti', remoteMessage.data)
        if (type === 'new_job') {
          Alert.alert(
            'Chú ý...!',
            `Bạn có công việc mới, xem ngay!`,
            [
              { text: 'Đóng', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
              // { text: 'Xem thông báo', onPress: () => { navigation.navigate('Notify') } },
            ],
            { cancelable: false }
          );
        } else if (type === 'delete_job') {
          Alert.alert(
            'Chú ý...!',
            `Công việc của bạn đã được HỦY BỎ bởi Đội trưởng, vui lòng đợi để nhận việc khác!`,
            [
              { text: 'Đóng', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
              // { text: 'Xem thông báo', onPress: () => { navigation.navigate('Notify') } },
            ],
            { cancelable: false }
          );
        } else {
          Alert.alert(
            'Chú ý...!',
            `Công việc của bạn đã được cập nhật nội dung mới bởi Đội trưởng, hãy xem lại nội dung công việc!`,
            [
              { text: 'Đóng', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
              // { text: 'Xem thông báo', onPress: () => { navigation.navigate('Notify') } },
            ],
            { cancelable: false }
          );
        }

      });

      // Thiết lập xử lý khi người dùng mở thông báo khi ứng dụng đã tắt hoặc ở nền
      const unsubscribeOpened = messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened by user:', remoteMessage);
        //navigation.navigate('Notify');
      });

      return () => {
        unsubscribe();  // Hủy bỏ lắng nghe sự kiện khi component unmount
        unsubscribeOpened();
      };
    };
    // Lắng nghe sự kiện khi token FCM được làm mới
    const handleTokenRefresh = () => {
      const unsubscribe = messaging().onTokenRefresh(async (token) => {
        console.log('FCM Registration Token đã làm mới:', token);
        const userId = await AsyncStorage.getItem('userID');
        if (userId) {
          // Gửi token mới này lên server nếu cần
          await addDeviceToken(userId, token);
        }
      });

      // Dọn dẹp listener khi component bị hủy
      return () => {
        unsubscribe();
      };
    };
    // Gọi các hàm trong useEffect
    checkAuth();
    notification();
    handleTokenRefresh();
  }, []);
  const addDeviceToken = async (id, device_token) => {
    try {
      const data = await apiUpdateDeviceToken(id, device_token);;
      //console.log('data device_token', data);  // Log ra token của thiết bị
    } catch (error) {
      console.error('Lỗi khi lấy token:', error);
    }
  };

  // Khi đang kiểm tra xác thực, có thể hiển thị màn hình chờ
  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002200' }}>
        <Image style={{ width: isTablet ? 200 : 130, height: isTablet ? 200 : 130, marginBottom: 20 }} source={require('./src/assets/images/logo/nltech.png')} />
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  const initialRouteName = isAuthenticated
    ? role === 'admin'
      ? 'Admin'
      : role === 'leader'
        ? 'JobLeader'
        : 'Job'
    : 'Login';

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerTintColor: 'white',
          headerStyle: { backgroundColor: '#002200' },
          headerTitleAlign: 'center',
          headerBackTitleVisible: false,
          headerTitleStyle: { fontWeight: 'normal' },
        }}
      >
        <Stack.Screen name="Job" options={{ headerShown: false }}>
          {(props) => <Job {...props} isGetJob={isGetJob} setIsGetJob={setIsGetJob} jobUser={jobUser} setJobUser={setJobUser} valueJob={valueJob} setValueJob={setValueJob} />}
        </Stack.Screen>
        <Stack.Screen name="JobLeader" options={{ headerShown: false }}>
          {(props) => <JobLeader {...props} isGetJob={isGetJob} setIsGetJob={setIsGetJob} jobUser={jobUser} setJobUser={setJobUser} valueJob={valueJob} setValueJob={setValueJob} />}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Admin" component={AdminHome} options={{ headerShown: false }} />
        <Stack.Screen name="ChangePass" component={ChangePass} options={{ headerShown: false }} />
        <Stack.Screen name="Info" component={InfoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HistoryUser" component={HistoryUser} options={{ headerShown: false }} />
        <Stack.Screen name="HistoryAdmin" component={HistoryAdmin} options={{ headerShown: false }} />
        <Stack.Screen name="ChamCong" component={ChamCong} options={{ headerShown: false }} />
        {/* <Stack.Screen name="BangChamCong" component={BangChamCong} options={{ title: 'Bảng chấm công', headerTitleStyle: { color: 'white', fontWeight: 'bold' } }} /> */}
        <Stack.Screen name="BangChamCong" component={BangChamCong} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
