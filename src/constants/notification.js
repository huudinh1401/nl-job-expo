// Notification types
export const NOTIFICATION_TYPES = {
    NEW_JOB: 'new_job',
    UPDATE_JOB: 'update_job',
    DELETE_JOB: 'delete_job',
    REMINDER: 'reminder',
    SYSTEM: 'system'
};

// Notification channels (Android)
export const NOTIFICATION_CHANNELS = {
    DEFAULT: 'default',
    JOB_NOTIFICATIONS: 'job-notifications',
    REMINDERS: 'reminders',
    SYSTEM_ALERTS: 'system-alerts'
};

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    MAX: 'max'
};

// Default notification settings
export const DEFAULT_NOTIFICATION_CONFIG = {
    sound: 'default',
    vibrate: [0, 250, 250, 250],
    color: '#3b82f6',
    badge: true,
    priority: NOTIFICATION_PRIORITIES.HIGH
};

// Notification messages
export const NOTIFICATION_MESSAGES = {
    [NOTIFICATION_TYPES.NEW_JOB]: {
        title: 'Công việc mới',
        body: 'Bạn có công việc mới, xem ngay!',
        actions: [
            { identifier: 'view', title: 'Xem ngay' },
            { identifier: 'dismiss', title: 'Đóng' }
        ]
    },
    [NOTIFICATION_TYPES.UPDATE_JOB]: {
        title: 'Cập nhật công việc',
        body: 'Công việc của bạn đã được cập nhật nội dung mới!',
        actions: [
            { identifier: 'view', title: 'Xem ngay' },
            { identifier: 'dismiss', title: 'Đóng' }
        ]
    },
    [NOTIFICATION_TYPES.DELETE_JOB]: {
        title: 'Công việc bị hủy',
        body: 'Công việc của bạn đã được HỦY BỎ bởi Đội trưởng!',
        actions: [
            { identifier: 'dismiss', title: 'Đóng' }
        ]
    },
    [NOTIFICATION_TYPES.REMINDER]: {
        title: 'Nhắc nhở',
        body: 'Bạn có công việc cần hoàn thành!',
        actions: [
            { identifier: 'view', title: 'Xem' },
            { identifier: 'snooze', title: 'Nhắc lại sau' }
        ]
    }
};

// Expo Push Token validation
export const validateExpoPushToken = (token) => {
    if (!token) return false;

    // Expo push token format: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
    const expoTokenRegex = /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/;
    return expoTokenRegex.test(token);
};

// Notification data schema
export const createNotificationData = (type, extra = {}) => {
    return {
        type,
        timestamp: Date.now(),
        ...extra
    };
};

// Permission status messages
export const PERMISSION_MESSAGES = {
    denied: 'Thông báo bị từ chối. Vui lòng cấp quyền trong cài đặt để nhận thông báo công việc.',
    undetermined: 'Vui lòng cấp quyền thông báo để nhận tin nhắn về công việc.',
    granted: 'Thông báo đã được kích hoạt.',
};

export default {
    NOTIFICATION_TYPES,
    NOTIFICATION_CHANNELS,
    NOTIFICATION_PRIORITIES,
    DEFAULT_NOTIFICATION_CONFIG,
    NOTIFICATION_MESSAGES,
    validateExpoPushToken,
    createNotificationData,
    PERMISSION_MESSAGES
};
