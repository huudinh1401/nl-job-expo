import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUpdateDeviceToken } from './apiService';

// Cấu hình notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

class NotificationService {
    constructor() {
        this.notificationListener = null;
        this.responseListener = null;
    }

    // Yêu cầu quyền notification
    async requestPermissions() {
        if (!Device.isDevice) {
            console.log('🔧 Chạy trên simulator/emulator - sử dụng mock permissions');
            return true; // Return true để app hoạt động bình thường
        }

        // Check if running in Expo Go
        if (Constants.appOwnership === 'expo') {
            console.log('⚠️ Chạy trong Expo Go - Push notifications bị giới hạn với SDK 53+');
            console.log('📱 Để test notification đầy đủ, vui lòng sử dụng Development Build');
            return true; // Return true để app hoạt động bình thường
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            Alert.alert('Lỗi', 'Vui lòng cấp quyền thông báo để nhận tin nhắn công việc!');
            return false;
        }

        return true;
    }

    // Lấy Expo Push Token
    async getExpoPushToken() {
        try {
            if (!Device.isDevice) {
                console.log('🔧 Simulator/Emulator - generating mock token');
                return `ExponentPushToken[SIMULATOR_MOCK_TOKEN_${Date.now()}]`;
            }

            // Check if running in Expo Go
            if (Constants.appOwnership === 'expo') {
                console.log('⚠️ Expo Go không hỗ trợ Push Token với SDK 53+');
                // Return mock token cho development trong Expo Go
                return `ExponentPushToken[EXPO_GO_MOCK_TOKEN_${Date.now()}]`;
            }

            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            // Lấy projectId từ config
            const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
            console.log('🔧 Project ID:', projectId);

            let token;
            if (projectId && projectId !== 'your-project-id-here' && projectId !== 'a1b2c3d4-e5f6-7890-1234-567890abcdef') {
                // Sử dụng project ID thật
                token = await Notifications.getExpoPushTokenAsync({ projectId });
            } else {
                // Fallback: thử không cần project ID (cho development)
                console.log('⚠️ No valid project ID, trying without projectId...');
                try {
                    token = await Notifications.getExpoPushTokenAsync();
                } catch (fallbackError) {
                    console.log('📱 Fallback failed, generating mock token for development');
                    console.log('📱 Fallback error:', fallbackError.message);
                    return `ExponentPushToken[DEV_MOCK_TOKEN_${Date.now()}]`;
                }
            }

            console.log('✅ Expo Push Token generated:', token.data);
            return token.data;
        } catch (error) {
            console.error('Lỗi khi lấy Expo Push Token:', error);
            return null;
        }
    }

    // Cấu hình notification channel cho Android
    async setupNotificationChannel() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('job-notifications', {
                name: 'Job Notifications',
                description: 'Thông báo về công việc mới',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3b82f6',
                sound: 'default',
            });
        }
    }

    // Thiết lập listeners cho notification
    setupNotificationListeners() {
        // Listener khi nhận notification (app đang mở)
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            this.handleNotificationReceived(notification);
        });

        // Listener khi user tap vào notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            this.handleNotificationResponse(response);
        });
    }

    // Xử lý khi nhận notification
    handleNotificationReceived(notification) {
        const { title, body, data } = notification.request.content;
        const { type } = data || {};

        switch (type) {
            case 'new_job':
                Alert.alert(
                    'Chú ý...!',
                    'Bạn có công việc mới, xem ngay!',
                    [
                        { text: 'Đóng', style: 'cancel' },
                        { text: 'Xem ngay', onPress: () => this.handleJobNotification(data) }
                    ]
                );
                break;
            case 'delete_job':
                Alert.alert(
                    'Chú ý...!',
                    'Công việc của bạn đã được HỦY BỎ bởi Đội trưởng, vui lòng đợi để nhận việc khác!',
                    [{ text: 'Đóng', style: 'cancel' }]
                );
                break;
            case 'update_job':
                Alert.alert(
                    'Chú ý...!',
                    'Công việc của bạn đã được cập nhật nội dung mới bởi Đội trưởng, hãy xem lại nội dung công việc!',
                    [
                        { text: 'Đóng', style: 'cancel' },
                        { text: 'Xem ngay', onPress: () => this.handleJobNotification(data) }
                    ]
                );
                break;
            default:
                if (title && body) {
                    Alert.alert(title, body);
                }
                break;
        }
    }

    // Xử lý khi user tap vào notification
    handleNotificationResponse(response) {
        const { data } = response.notification.request.content;
        console.log('User tapped notification:', data);

        // Có thể navigation tới màn hình cụ thể ở đây
        if (data?.type === 'new_job' || data?.type === 'update_job') {
            this.handleJobNotification(data);
        }
    }

    // Xử lý notification về job
    handleJobNotification(data) {
        // Emit event để các component khác có thể listen
        // Hoặc sử dụng navigation service để navigate
        console.log('Handling job notification:', data);
    }

    // Cập nhật device token lên server
    async updateDeviceTokenOnServer(userId) {
        try {
            const token = await this.getExpoPushToken();
            if (token && userId) {
                await apiUpdateDeviceToken(userId, token);
                console.log('Device token đã được cập nhật lên server');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Lỗi khi cập nhật device token:', error);
            return false;
        }
    }

    // Khởi tạo notification service
    async initialize() {
        try {
            await this.setupNotificationChannel();
            this.setupNotificationListeners();

            // Lấy và lưu token
            const token = await this.getExpoPushToken();
            if (token) {
                await AsyncStorage.setItem('expoPushToken', token);
            }

            return true;
        } catch (error) {
            console.error('Lỗi khởi tạo notification service:', error);
            return false;
        }
    }

    // Gửi notification local (test)
    async sendLocalNotification(title, body, data = {}) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            trigger: null, // Gửi ngay lập tức
        });
    }

    // Cleanup listeners
    cleanup() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }

    // Lấy notification permissions status
    async getPermissionStatus() {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    }

    // Mở app settings để user có thể cấp quyền
    async openSettings() {
        await Notifications.openSettingsAsync();
    }
}

export default new NotificationService();
