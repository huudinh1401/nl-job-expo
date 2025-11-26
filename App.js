import React, { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, View, Image, Text, Animated } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';

import { apiGetJobHistory, apiCheckStatusUser, apiUpdateDeviceToken } from './src/services/apiService';
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

// Component SplashLoading với giao diện đẹp
const SplashLoading = () => {
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(logoScale, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ),
      ]),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#1e3c72', '#2a5298', '#16a085', '#27ae60']} style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Logo - Simplified with transparent background */}
        <Animated.View style={{
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: 'rgba(255,255,255,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 30,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 15,
          elevation: 15,
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)'
        }}>
          <Image
            source={require('./assets/images/nl-konen.png')}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name */}
        <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 }}>
          JOB NLTECH
        </Text>

        {/* Subtitle */}
        <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 60, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }}>
          Quản lý công việc & Chấm công
        </Text>

        {/* Loading indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)', marginHorizontal: 4 }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginHorizontal: 4 }} />
        </View>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 40 }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic' }}>
            Được phát triển bởi NLTECH
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const [jobStatus, setJobStatus] = useState({ isGetJob: false, jobData: null });
  const [currentJob, setCurrentJob] = useState(null);

  async function requestUserPermission() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        console.log('Quyền thông báo đã được cấp.');
      } else {
        console.log('Quyền thông báo không được cấp.');
      }
    } catch (error) {
      console.error('Lỗi khi xin quyền thông báo:', error);
    }
  }

  const initializeAfterLogin = async (userID) => {
    try {
      // Kiểm tra trạng thái job của user
      const statusRes = await apiCheckStatusUser(userID);
      const jobStatus = {
        isGetJob: statusRes.message === 1,
        jobData: statusRes.data || null
      };

      // Lấy job hiện tại nếu có
      const historyRes = await apiGetJobHistory();
      const currentJob = historyRes.data.find(item =>
        String(item.user_id) === String(userID) && item.end === null
      );

      return { jobStatus, currentJob };
    } catch (error) {
      console.error('Lỗi khởi tạo dữ liệu sau login:', error);
      return {
        jobStatus: { isGetJob: false, jobData: null },
        currentJob: null
      };
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 App.js: Initializing app...');

        // 1. Khởi tạo notifications
        await requestUserPermission();
        await setupNotifications();

        // 2. Kiểm tra authentication
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
          // Lấy thông tin user từ storage
          const [userID, username, role, job, avatar] = await Promise.all([
            AsyncStorage.getItem('userID'),
            AsyncStorage.getItem('username'),
            AsyncStorage.getItem('role'),
            AsyncStorage.getItem('job'),
            AsyncStorage.getItem('avatar')
          ]);

          if (userID) {
            const userInfo = { userID, username, role, job, avatar };
            setUser(userInfo);
            setIsAuthenticated(true);

            // 3. Khởi tạo dữ liệu sau khi đăng nhập
            const initResult = await initializeAfterLogin(userID);
            setJobStatus(initResult.jobStatus);
            setCurrentJob(initResult.currentJob);

            console.log('✅ App.js: User already authenticated');
          } else {
            setIsAuthenticated(false);
          }
        } else {
          console.log('❌ App.js: User not authenticated');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Lỗi khởi tạo app:', error);
        setIsAuthenticated(false);
      }
    };

    initializeApp();
  }, []);

  const setupNotifications = async () => {
    try {
      // Thiết lập notification handler khi app đang active
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Lắng nghe notification khi app đang chạy foreground
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('📬 Notification received:', notification);
        const { data } = notification.request.content;
        const type = data?.type;

        if (type === 'new_job') {
          Alert.alert(
            'Chú ý...!',
            `Bạn có công việc mới, xem ngay!`,
            [{ text: 'Đóng', style: 'cancel' }],
            { cancelable: false }
          );
        } else if (type === 'delete_job') {
          Alert.alert(
            'Chú ý...!',
            `Công việc của bạn đã được HỦY BỎ bởi Đội trưởng, vui lòng đợi để nhận việc khác!`,
            [{ text: 'Đóng', style: 'cancel' }],
            { cancelable: false }
          );
        } else {
          Alert.alert(
            'Chú ý...!',
            `Công việc của bạn đã được cập nhật nội dung mới bởi Đội trưởng, hãy xem lại nội dung công việc!`,
            [{ text: 'Đóng', style: 'cancel' }],
            { cancelable: false }
          );
        }
      });

      // Lắng nghe khi user tap vào notification
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('📱 Notification tapped:', response);
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    } catch (error) {
      console.error('❌ Lỗi setup notifications:', error);
    }
  };

  const addDeviceToken = async (id, device_token) => {
    try {
      const data = await apiUpdateDeviceToken(id, device_token);;
      //console.log('data device_token', data);  // Log ra token của thiết bị
    } catch (error) {
      console.error('Lỗi khi lấy token:', error);
    }
  };

  // Handle khi login thành công từ LoginScreen
  const handleLoginSuccess = async (userInfo) => {
    try {
      console.log('🚀 App.js: handleLoginSuccess called with:', userInfo);
      console.log('🔧 Current auth state before update:', isAuthenticated);

      // Khởi tạo dữ liệu trước khi cập nhật state (để tránh race condition)
      console.log('🔄 Initializing data after login...');
      const initResult = await initializeAfterLogin(userInfo.userID);

      // Cập nhật tất cả state cùng lúc để trigger single re-render
      console.log('📝 Updating all states...');
      setUser(userInfo);
      setJobStatus(initResult.jobStatus);
      setCurrentJob(initResult.currentJob);
      setIsAuthenticated(true); // Set này cuối cùng để trigger navigation

      console.log('✅ Authentication state updated:', {
        user: userInfo.username,
        role: userInfo.role,
        jobStatus: initResult.jobStatus.isGetJob
      });
      console.log('🧭 AppNavigator should now re-render and navigate');

    } catch (error) {
      console.error('❌ Lỗi xử lý login success:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình đăng nhập.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('🚪 App.js: Starting logout process...');
      console.log('🔧 Current auth state before logout:', isAuthenticated);

      // Clear storage FIRST
      console.log('🗑️ Clearing AsyncStorage...');
      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userID',
        'username',
        'job',
        'avatar',
        'role'
      ]);

      // Then clear authentication state để trigger navigation
      console.log('📝 Clearing app state...');
      setUser(null);
      setJobStatus({ isGetJob: false, jobData: null });
      setCurrentJob(null);
      setIsAuthenticated(false); // Set này cuối cùng để trigger navigation

      console.log('✅ Logout completed - Navigator should re-render to Login');
    } catch (error) {
      console.error('❌ Lỗi logout:', error);
      // Force state clear even if storage clear fails
      setUser(null);
      setJobStatus({ isGetJob: false, jobData: null });
      setCurrentJob(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh job status
  const refreshJobStatus = async () => {
    if (user?.userID) {
      try {
        const initResult = await initializeAfterLogin(user.userID);
        setJobStatus(initResult.jobStatus);
        setCurrentJob(initResult.currentJob);
      } catch (error) {
        console.error('Lỗi refresh job status:', error);
      }
    }
  };

  // Debug log để theo dõi state changes
  console.log('🔄 App.js render:', {
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role,
    showSplashLoading: isAuthenticated === null
  });

  // Hiển thị SplashLoading khi đang kiểm tra authentication
  if (isAuthenticated === null) {
    console.log('📱 Rendering SplashLoading...');
    return <SplashLoading />;
  }

  console.log('🧭 Rendering AppNavigator with auth state:', isAuthenticated);
  return (
    <SafeAreaProvider>
      <AppNavigator
        isAuthenticated={isAuthenticated}
        user={user}
        jobStatus={jobStatus}
        currentJob={currentJob}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onRefreshJobStatus={refreshJobStatus}
      />
      <StatusBar style="light" backgroundColor="#0f172a" />
    </SafeAreaProvider>
  );
};

export default App;
