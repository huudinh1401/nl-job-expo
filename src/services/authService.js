import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { apiGetJobHistory, apiCheckStatusUser } from './apiService';
import api from './api';
import notificationService from './notificationService';

class AuthService {
    constructor() {
        this.isInitialized = false;
    }

    // Kiểm tra authentication status
    async checkAuthentication() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const refreshToken = await AsyncStorage.getItem('refreshToken');

            if (!accessToken || !refreshToken) {
                return { isAuthenticated: false, user: null };
            }

            try {
                // Test API call để kiểm tra token có hợp lệ không
                const jobHistoryData = await apiGetJobHistory();

                // Lấy thông tin user từ AsyncStorage
                const userInfo = await this.getUserInfo();

                return {
                    isAuthenticated: true,
                    user: userInfo
                };
            } catch (error) {
                // Nếu token hết hạn, thử refresh
                const axiosError = error;
                if (axiosError.response && axiosError.response.status === 401) {
                    return await this.refreshToken();
                }

                // Lỗi khác -> logout
                return { isAuthenticated: false, user: null };
            }
        } catch (error) {
            console.error('Lỗi kiểm tra authentication:', error);
            return { isAuthenticated: false, user: null };
        }
    }

    // Refresh token
    async refreshToken() {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (!refreshToken) {
                return { isAuthenticated: false, user: null };
            }

            const response = await api.post('/auth/refresh-token', { refreshToken });

            // Lưu token mới
            await AsyncStorage.setItem('accessToken', response.data.accessToken);

            // Lấy thông tin user
            const userInfo = await this.getUserInfo();

            return {
                isAuthenticated: true,
                user: userInfo
            };
        } catch (refreshError) {
            console.error('Lỗi refresh token:', refreshError);

            // Refresh thất bại -> xóa tokens và logout
            await this.logout(false); // false = không hiện alert

            return { isAuthenticated: false, user: null };
        }
    }

    // Lấy thông tin user từ AsyncStorage
    async getUserInfo() {
        try {
            const [userID, username, job, avatar, role] = await Promise.all([
                AsyncStorage.getItem('userID'),
                AsyncStorage.getItem('username'),
                AsyncStorage.getItem('job'),
                AsyncStorage.getItem('avatar'),
                AsyncStorage.getItem('role')
            ]);

            return {
                userID,
                username,
                job,
                avatar,
                role
            };
        } catch (error) {
            console.error('Lỗi lấy thông tin user:', error);
            return null;
        }
    }

    // Kiểm tra trạng thái nhận việc của user
    async checkUserJobStatus(userID) {
        try {
            if (!userID) return { isGetJob: false, jobData: null };

            const res = await apiCheckStatusUser(userID);
            const { message, data } = res;

            const isGetJob = message === 1;

            return {
                isGetJob,
                jobData: data || null
            };
        } catch (error) {
            console.error('Lỗi kiểm tra trạng thái nhận việc:', error);
            return { isGetJob: false, jobData: null };
        }
    }

    // Lấy lịch sử công việc hiện tại
    async getCurrentJobHistory(userID) {
        try {
            if (!userID) return null;

            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(
                item => String(item.user_id) === String(userID) && item.end === null
            );

            return filteredData.length > 0 ? filteredData[0] : null;
        } catch (error) {
            console.error('Lỗi lấy lịch sử Job:', error);
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi lấy lịch sử Job!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
            return null;
        }
    }

    // Khởi tạo sau khi đăng nhập thành công
    async initializeAfterLogin(userID) {
        try {
            console.log('🔧 AuthService: initializeAfterLogin for user:', userID);
            if (!userID) {
                console.log('❌ No userID provided');
                return null;
            }

            // Cập nhật device token cho notification
            console.log('📱 Updating device token...');
            await notificationService.updateDeviceTokenOnServer(userID);

            // Lấy trạng thái công việc
            console.log('📊 Getting job status...');
            const jobStatus = await this.checkUserJobStatus(userID);
            console.log('📋 Getting current job...');
            const currentJob = await this.getCurrentJobHistory(userID);

            console.log('✅ AuthService: initialization completed');
            return {
                jobStatus,
                currentJob
            };
        } catch (error) {
            console.error('❌ Lỗi khởi tạo sau login:', error);
            return null;
        }
    }

    // Logout
    async logout(showAlert = true) {
        try {
            // Xóa tất cả dữ liệu authentication
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

            if (showAlert) {
                Alert.alert('Đăng xuất', 'Đã đăng xuất thành công');
            }

            return true;
        } catch (error) {
            console.error('Lỗi logout:', error);
            return false;
        }
    }

    // Lưu thông tin user sau khi đăng nhập
    async saveUserInfo(userInfo) {
        try {
            const promises = [];

            if (userInfo.accessToken) {
                promises.push(AsyncStorage.setItem('accessToken', userInfo.accessToken));
            }
            if (userInfo.refreshToken) {
                promises.push(AsyncStorage.setItem('refreshToken', userInfo.refreshToken));
            }
            if (userInfo.userID) {
                promises.push(AsyncStorage.setItem('userID', userInfo.userID.toString()));
            }
            if (userInfo.username) {
                promises.push(AsyncStorage.setItem('username', userInfo.username));
            }
            if (userInfo.job) {
                promises.push(AsyncStorage.setItem('job', userInfo.job));
            }
            if (userInfo.avatar) {
                promises.push(AsyncStorage.setItem('avatar', userInfo.avatar));
            }
            if (userInfo.role) {
                promises.push(AsyncStorage.setItem('role', userInfo.role));
            }

            await Promise.all(promises);
            return true;
        } catch (error) {
            console.error('Lỗi lưu thông tin user:', error);
            return false;
        }
    }

    // Kiểm tra session có hợp lệ không (call API nhẹ)
    async validateSession() {
        try {
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) return false;

            // Có thể gọi một API nhẹ để validate
            // Ví dụ: await api.get('/auth/validate');
            return true;
        } catch (error) {
            console.error('Session không hợp lệ:', error);
            return false;
        }
    }

    // Lấy initial route dựa trên role
    getInitialRoute(user) {
        if (!user || !user.role) return 'Login';

        switch (user.role) {
            case 'admin':
                return 'Admin';
            case 'leader':
                return 'JobLeader';
            default:
                return 'Job';
        }
    }

    // Handle session expiry
    async handleSessionExpiry() {
        await this.logout(false);
        Alert.alert(
            'Phiên đăng nhập đã hết hạn',
            'Vui lòng đăng nhập lại.',
            [{ text: 'OK' }]
        );
    }
}

export default new AuthService();
