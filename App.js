import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, Image, Text, Animated } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notificationService';
import { apiGetJobHistory, apiCheckStatusUser } from './src/services/apiService';
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

  const initializeAfterLogin = async (userID) => {
    try {
      const statusRes = await apiCheckStatusUser(userID);
      const jobStatus = {
        isGetJob: statusRes.message === 1,
        jobData: statusRes.data || null
      };

      const historyRes = await apiGetJobHistory();
      const currentJob = historyRes.data.find(item =>
        String(item.user_id) === String(userID) && item.end === null
      );

      return { jobStatus, currentJob };
    } catch (error) {
      console.error('Loi khoi tao du lieu sau login:', error);
      return {
        jobStatus: { isGetJob: false, jobData: null },
        currentJob: null
      };
    }
  };

  // Callback khi nhan notification ve job
  const handleJobNotification = async (type, data) => {
    console.log('[App] Nhan notification job:', type);
    if (user?.userID) {
      await refreshJobStatus();
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Dang khoi tao...');

        // 1. Khoi tao notification service (chi 1 lan)
        await notificationService.initialize();

        // 2. Dang ky callback xu ly notification
        notificationService.setOnJobNotificationCallback(handleJobNotification);

        // 3. Kiem tra authentication
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (accessToken && refreshToken) {
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

            const initResult = await initializeAfterLogin(userID);
            setJobStatus(initResult.jobStatus);
            setCurrentJob(initResult.currentJob);

            // 4. Cap nhat device token len server (chi khi production build)
            await notificationService.updateDeviceTokenOnServer(userID);

            console.log('[App] User da dang nhap');
          } else {
            setIsAuthenticated(false);
          }
        } else {
          console.log('[App] User chua dang nhap');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[App] Loi khoi tao:', error);
        setIsAuthenticated(false);
      }
    };

    initializeApp();

    // Cleanup khi unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  // Handle khi login thanh cong tu LoginScreen
  const handleLoginSuccess = async (userInfo) => {
    try {
      console.log('[App] handleLoginSuccess:', userInfo.username);

      const initResult = await initializeAfterLogin(userInfo.userID);

      setUser(userInfo);
      setJobStatus(initResult.jobStatus);
      setCurrentJob(initResult.currentJob);
      setIsAuthenticated(true);

      // Cap nhat device token len server
      await notificationService.updateDeviceTokenOnServer(userInfo.userID);

      console.log('[App] Login thanh cong');
    } catch (error) {
      console.error('[App] Loi xu ly login:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra trong quá trình đăng nhập.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('[App] Dang logout...');

      await AsyncStorage.multiRemove([
        'accessToken',
        'refreshToken',
        'userID',
        'username',
        'job',
        'avatar',
        'role',
        'expoPushToken'
      ]);

      setUser(null);
      setJobStatus({ isGetJob: false, jobData: null });
      setCurrentJob(null);
      setIsAuthenticated(false);

      console.log('[App] Logout thanh cong');
    } catch (error) {
      console.error('[App] Loi logout:', error);
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
        console.log('[App] Refresh job status...');
        const initResult = await initializeAfterLogin(user.userID);
        setJobStatus(initResult.jobStatus);
        setCurrentJob(initResult.currentJob);
      } catch (error) {
        console.error('[App] Loi refresh job status:', error);
      }
    }
  };

  console.log('[App] Render:', { isAuthenticated, hasUser: !!user, userRole: user?.role });

  // Hien thi SplashLoading khi dang kiem tra authentication
  if (isAuthenticated === null) {
    console.log('[App] Hien thi SplashLoading...');
    return <SplashLoading />;
  }

  console.log('[App] Render AppNavigator');
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
