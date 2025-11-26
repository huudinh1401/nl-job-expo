import React, { createContext, useContext, useEffect, useState } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children, user, onRefreshJobStatus }) => {
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('undetermined');

    useEffect(() => {
        initializeNotifications();
        return () => {
            notificationService.cleanup();
        };
    }, []);

    useEffect(() => {
        // Setup notification handlers for job-related actions
        if (user?.userID) {
            setupJobNotificationHandlers();
        }
    }, [user, onRefreshJobStatus]);

    const initializeNotifications = async () => {
        try {
            const success = await notificationService.initialize();
            if (success) {
                const status = await notificationService.getPermissionStatus();
                setNotificationPermissionStatus(status);
            }
        } catch (error) {
            console.error('Error initializing notifications:', error);
        }
    };

    const setupJobNotificationHandlers = () => {
        // Override notification handlers để xử lý job-related notifications
        const originalHandleReceived = notificationService.handleNotificationReceived;
        const originalHandleResponse = notificationService.handleNotificationResponse;

        notificationService.handleNotificationReceived = (notification) => {
            originalHandleReceived.call(notificationService, notification);

            // Refresh job status khi nhận notification về job
            const { data } = notification.request.content;
            if (data?.type === 'new_job' || data?.type === 'update_job' || data?.type === 'delete_job') {
                if (onRefreshJobStatus) {
                    setTimeout(() => {
                        onRefreshJobStatus();
                    }, 1000); // Delay để server cập nhật dữ liệu
                }
            }
        };

        notificationService.handleNotificationResponse = (response) => {
            originalHandleResponse.call(notificationService, response);

            // Refresh job status khi user tap notification
            const { data } = response.notification.request.content;
            if (data?.type === 'new_job' || data?.type === 'update_job') {
                if (onRefreshJobStatus) {
                    onRefreshJobStatus();
                }
            }
        };
    };

    const requestPermissions = async () => {
        const hasPermission = await notificationService.requestPermissions();
        const status = await notificationService.getPermissionStatus();
        setNotificationPermissionStatus(status);
        return hasPermission;
    };

    const updateDeviceToken = async (userId) => {
        return await notificationService.updateDeviceTokenOnServer(userId);
    };

    const sendLocalNotification = async (title, body, data = {}) => {
        return await notificationService.sendLocalNotification(title, body, data);
    };

    const openSettings = async () => {
        return await notificationService.openSettings();
    };

    const value = {
        notificationPermissionStatus,
        requestPermissions,
        updateDeviceToken,
        sendLocalNotification,
        openSettings,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
