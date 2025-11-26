import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Common screens
import SplashScreen from '../screens/common/SplashScreen';
import LoginScreen from '../screens/common/LoginScreen';
import ChangePassScreen from '../screens/common/ChangePassScreen';
import BangChamCongScreen from '../screens/common/BangChamCongScreen';
import AppInfoScreen from '../screens/common/AppInfoScreen';
// Admin screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminHistoryScreen from '../screens/admin/AdminHistoryScreen';
// Leader screens
import JobLeaderMainScreen from '../screens/leader/JobLeaderMainScreen';
import ChamCongScreen from '../screens/common/ChamCongScreen';
// User screens
import JobScreen from '../screens/user/JobScreen';
import JobHistoryScreen from '../screens/user/JobHistoryScreen';

const Stack = createStackNavigator();

const AppNavigator = ({
    isAuthenticated,
    user,
    jobStatus,
    currentJob,
    onLoginSuccess,
    onLogout,
    onRefreshJobStatus
}) => {
    const [showSplash, setShowSplash] = useState(true);

    // Show splash only initially, then hide after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Determine the correct initial route based on auth state
    const getInitialRouteName = () => {
        if (showSplash) return "Splash";

        if (isAuthenticated && user) {
            const { role } = user;
            if (role === 'admin') return 'Admin';
            if (role === 'leader') return 'JobLeader';
            return 'Job';
        }
        return 'Login';
    };

    console.log('🧭 AppNavigator render:', {
        isAuthenticated,
        showSplash,
        userRole: user?.role,
        initialRoute: getInitialRouteName()
    });

    return (
        <NavigationContainer key={`${isAuthenticated}-${user?.role}-${showSplash}`}>
            <Stack.Navigator
                initialRouteName={getInitialRouteName()}
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#0f172a' }}}
            >
                {/* Splash Screen - chỉ hiển thị khi showSplash = true */}
                {showSplash && (
                    <Stack.Screen name="Splash">
                        {(props) => (
                            <SplashScreen
                                {...props}
                                isAuthenticated={isAuthenticated}
                                user={user}
                            />
                        )}
                    </Stack.Screen>
                )}

                {/* Auth Screens */}
                {!isAuthenticated && !showSplash && (
                    <Stack.Screen name="Login">
                        {(props) => (
                            <LoginScreen
                                {...props}
                                onLoginSuccess={onLoginSuccess}
                            />
                        )}
                    </Stack.Screen>
                )}

                {/* Admin Screen */}
                {isAuthenticated && user?.role === 'admin' && !showSplash && (
                    <Stack.Screen name="Admin">
                        {(props) => (
                            <AdminHomeScreen
                                {...props}
                                user={user}
                                onLogout={onLogout}
                            />
                        )}
                    </Stack.Screen>
                )}

                {/* Leader Screen */}
                {isAuthenticated && user?.role === 'leader' && !showSplash && (
                    <Stack.Screen name="JobLeader">
                        {(props) => (
                            <JobLeaderMainScreen
                                {...props}
                                user={user}
                                jobStatus={jobStatus}
                                currentJob={currentJob}
                                onLogout={onLogout}
                                onRefreshJobStatus={onRefreshJobStatus}
                            />
                        )}
                    </Stack.Screen>
                )}

                {/* User/Job Screen */}
                {isAuthenticated && user?.role !== 'admin' && user?.role !== 'leader' && !showSplash && (
                    <Stack.Screen name="Job">
                        {(props) => (
                            <JobScreen
                                {...props}
                                user={user}
                                jobStatus={jobStatus}
                                currentJob={currentJob}
                                onLogout={onLogout}
                                onRefreshJobStatus={onRefreshJobStatus}
                            />
                        )}
                    </Stack.Screen>
                )}

                {/* Additional Screens - Always available */}
                <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
                <Stack.Screen name="BangChamCong" component={BangChamCongScreen} />
                <Stack.Screen name="ChangePass" component={ChangePassScreen} />
                <Stack.Screen name="AppInfo" component={AppInfoScreen} />
                <Stack.Screen name="ChamCong" component={ChamCongScreen} />
                <Stack.Screen name="AdminHistoryScreen" component={AdminHistoryScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;