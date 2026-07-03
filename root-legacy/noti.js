import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Cấu hình cách xử lý notifications khi app đang chạy
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
    }

    // Đăng ký push notifications và lấy token
    async registerForPushNotificationsAsync() {
        let token;

        console.log('🔄 Bắt đầu đăng ký push notifications...');
        console.log('📱 Device.isDevice:', Device.isDevice);
        console.log('📱 Platform.OS:', Platform.OS);

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        // Luôn thử lấy token thật trước, bất kể Device.isDevice
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log('🔐 Permission hiện tại:', existingStatus);

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log('🔐 Permission sau khi request:', finalStatus);
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Permission bị từ chối');
                return null;
            }

            // Thử lấy token Expo thật
            console.log('📤 Đang lấy Expo push token...');
            console.log('🔧 Project ID:', 'f4578d19-a7fa-48e1-acb5-23de278b0584');

            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'f4578d19-a7fa-48e1-acb5-23de278b0584',
                applicationId: 'com.namnhi993.nlkho'
            });

            token = tokenData.data;
            this.expoPushToken = token;
            console.log('✅ Lấy Expo token thành công:', token);
            console.log('🔍 Token type:', typeof token);
            console.log('🔍 Token length:', token ? token.length : 0);

        } catch (error) {
            console.log('❌ Lỗi khi lấy Expo token:', error.message);
            console.log('❌ Error stack:', error.stack);

            // Không dùng token nào khác, chỉ báo lỗi
            console.log('💡 Để lấy Expo token thật, hãy đảm bảo:');
            console.log('   1. App được build với EAS Build');
            console.log('   2. Hoặc chạy trong Expo Go');
            console.log('   3. Project ID đúng trong app.json');

            return null;
        }

        return token;
    }

    // Lấy device token hiện tại
    getDeviceToken() {
        return this.expoPushToken;
    }

    // Log device token
    logDeviceToken() {
        // Không log gì cả
    }

    // Gửi notification local
    async sendLocalNotification(title, body, data = {}) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: { seconds: 1 },
        });
    }

    // Lắng nghe notifications
    addNotificationReceivedListener(listener) {
        return Notifications.addNotificationReceivedListener(listener);
    }

    addNotificationResponseReceivedListener(listener) {
        return Notifications.addNotificationResponseReceivedListener(listener);
    }

    // Xóa listeners
    removeNotificationSubscription(subscription) {
        if (subscription) {
            subscription.remove();
        }
    }

    // Lấy thông tin permissions
    async getPermissionStatus() {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    }

    // Clear tất cả notifications
    async clearAllNotifications() {
        await Notifications.dismissAllNotificationsAsync();
    }

    // Đếm số notifications chưa đọc
    async getBadgeCount() {
        return await Notifications.getBadgeCountAsync();
    }

    // Set badge count
    async setBadgeCount(count) {
        await Notifications.setBadgeCountAsync(count);
    }

    // Gửi device token lên server
    async sendDeviceTokenToServer(userId) {
        if (!this.expoPushToken || !userId) {
            return false;
        }

        try {
            const response = await api.put(`/users/${userId}/device-token`, {
                deviceToken: this.expoPushToken
            });
            console.log('API Response:', response.data);
            return true;
        } catch (error) {
            console.log('API Error:', error.message);
            return false;
        }
    }

    // Gửi test notification
    async sendTestNotification() {
        try {
            if (!this.expoPushToken) {
                console.log('❌ No device token available for test');
                return;
            }

            await this.sendLocalNotification(
                'Test Notification',
                'This is a test notification from NL KHO app!',
                { type: 'test' }
            );

            console.log('✅ Test notification sent');
        } catch (error) {
            console.log('❌ Error sending test notification:', error);
        }
    }
}

// Export singleton instance
export default new NotificationService();
