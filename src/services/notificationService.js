import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUpdateDeviceToken } from './apiService';

// Cau hinh cach xu ly notifications khi app dang chay
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

class NotificationService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
        this.isInitialized = false;
        this.onJobNotificationCallback = null;
    }

    // Dang ky push notifications va lay token
    async registerForPushNotificationsAsync() {
        let token;

        console.log('[Notification] Bat dau dang ky push notifications...');
        console.log('[Notification] Device.isDevice:', Device.isDevice);
        console.log('[Notification] Platform.OS:', Platform.OS);

        // Setup channel cho Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });

            await Notifications.setNotificationChannelAsync('job-notifications', {
                name: 'Thông báo công việc',
                description: 'Thông báo về công việc mới',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3b82f6',
                sound: 'default',
            });
        }

        // Luon thu lay token that truoc
        try {
            console.log('[Notification] Bat dau lay permission...');
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('[Notification] Permission hien tai:', existingStatus);

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                console.log('[Notification] Dang request permission...');
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('[Notification] Permission sau khi request:', finalStatus);
            }

            if (finalStatus !== 'granted') {
                console.log('[Notification] Permission bi tu choi');
                return null;
            }

            // Lay token Expo
            const projectId = '3f2dc4a3-7526-45aa-b9b5-71fdeac6980d';
            console.log('[Notification] Dang lay Expo push token voi projectId:', projectId);

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: projectId
            });

            token = tokenData.data;
            this.expoPushToken = token;

            console.log('========================================');
            console.log('[Notification] TOKEN:', token);
            console.log('[Notification] TOKEN TYPE:', typeof token);
            console.log('[Notification] TOKEN LENGTH:', token ? token.length : 0);
            console.log('========================================');

        } catch (error) {
            console.log('========================================');
            console.log('[Notification] LOI KHI LAY TOKEN:', error.message);
            console.log('[Notification] ERROR STACK:', error.stack);
            console.log('========================================');
            return null;
        }

        return token;
    }

    // Lay device token hien tai
    getDeviceToken() {
        return this.expoPushToken;
    }

    // Dang ky callback khi co notification ve job
    setOnJobNotificationCallback(callback) {
        this.onJobNotificationCallback = callback;
    }

    // Truy cap notification content theo API moi cua Expo, tranh dung getter deprecate dataString
    getNotificationPayload(content) {
        return {
            title: content?.title ?? '',
            body: content?.body ?? '',
            data: content?.data ?? {}
        };
    }

    // Setup listeners
    setupNotificationListeners() {
        // Xoa listeners cu neu co
        this.cleanup();

        // Listener khi nhan notification (app dang mo)
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            const payload = this.getNotificationPayload(notification.request.content);
            console.log('[Notification] Received:', payload);
            this.handleNotificationReceived(notification);
        });

        // Listener khi user tap vao notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[Notification] User tapped');
            this.handleNotificationResponse(response);
        });
    }

    // Xu ly khi nhan notification
    handleNotificationReceived(notification) {
        const { body, data } = this.getNotificationPayload(notification.request.content);
        const type = data?.type;

        let title = 'Chú ý...!';
        let message = '';

        switch (type) {
            case 'new_job':
                message = 'Bạn có công việc mới, xem ngay!';
                break;
            case 'delete_job':
                message = 'Công việc của bạn đã được HỦY BỎ bởi Đội trưởng!';
                break;
            case 'update_job':
            case 'edit_job':
                message = 'Công việc của bạn đã được cập nhật nội dung mới!';
                break;
            default:
                message = body || 'Bạn có thông báo mới';
                break;
        }

        Alert.alert(title, message, [{ text: 'Đóng', style: 'cancel' }], { cancelable: true });

        // Goi callback de refresh job status
        if (this.onJobNotificationCallback && (type === 'new_job' || type === 'delete_job' || type === 'update_job' || type === 'edit_job')) {
            setTimeout(() => {
                this.onJobNotificationCallback(type, data);
            }, 500);
        }
    }

    // Xu ly khi user tap vao notification
    handleNotificationResponse(response) {
        const { data } = this.getNotificationPayload(response.notification.request.content);
        const type = data?.type;

        if (this.onJobNotificationCallback && (type === 'new_job' || type === 'delete_job' || type === 'update_job' || type === 'edit_job')) {
            this.onJobNotificationCallback(type, data);
        }
    }

    // Khoi tao notification service
    async initialize() {
        if (this.isInitialized) {
            console.log('[Notification] Da khoi tao truoc do');
            return true;
        }

        try {
            console.log('[Notification] Dang khoi tao...');

            // Dang ky va lay token
            await this.registerForPushNotificationsAsync();

            // Setup listeners
            this.setupNotificationListeners();

            this.isInitialized = true;
            console.log('[Notification] Khoi tao thanh cong');
            return true;
        } catch (error) {
            console.error('[Notification] Loi khoi tao:', error.message);
            return false;
        }
    }

    // Cap nhat device token len server
    async updateDeviceTokenOnServer(userId) {
        if (!this.expoPushToken || !userId) {
            console.log('[Notification] Khong co token hoac userId');
            return false;
        }

        try {
            await apiUpdateDeviceToken(userId, this.expoPushToken);
            await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
            console.log('[Notification] Da cap nhat token len server');
            return true;
        } catch (error) {
            console.error('[Notification] Loi cap nhat token:', error.message);
            return false;
        }
    }

    // Gui notification local (test)
    async sendLocalNotification(title, body, data = {}) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data,
                    sound: 'default',
                },
                trigger: { seconds: 1 },
            });
            return true;
        } catch (error) {
            console.error('[Notification] Loi gui local notification:', error.message);
            return false;
        }
    }

    // Cleanup listeners
    cleanup() {
        if (this.notificationListener) {
            this.notificationListener.remove();
            this.notificationListener = null;
        }
        if (this.responseListener) {
            this.responseListener.remove();
            this.responseListener = null;
        }
    }

    // Clear tat ca notifications
    async clearAllNotifications() {
        await Notifications.dismissAllNotificationsAsync();
    }

    // Lay permission status
    async getPermissionStatus() {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    }

    // Kiem tra trang thai
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasToken: !!this.expoPushToken,
            token: this.expoPushToken,
            hasListeners: !!(this.notificationListener && this.responseListener)
        };
    }
}

export default new NotificationService();
