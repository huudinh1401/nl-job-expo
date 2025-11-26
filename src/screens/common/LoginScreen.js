import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Animated, Alert, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoadingDots from '../../components/LoadingDots';
import { apiLogin, apiUpdateDeviceToken } from '../../services/apiService';
import notificationService from '../../services/notificationService';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation, onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState(''); // Device token for notifications

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;
    const floatingAnim1 = useRef(new Animated.Value(0)).current;
    const floatingAnim2 = useRef(new Animated.Value(0)).current;
    const floatingAnim3 = useRef(new Animated.Value(0)).current;
    const floatingAnim4 = useRef(new Animated.Value(0)).current;
    const floatingAnim5 = useRef(new Animated.Value(0)).current;
    const floatingAnim6 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Start animations when component mounts
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Load saved email
        getID();

        // Floating animations for background elements
        const createFloatingAnimation = (animValue, duration, delay = 0) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, {
                        toValue: 1,
                        duration: duration,
                        delay: delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animValue, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        createFloatingAnimation(floatingAnim1, 3000, 0).start();
        createFloatingAnimation(floatingAnim2, 4000, 1000).start();
        createFloatingAnimation(floatingAnim3, 5000, 2000).start();
        createFloatingAnimation(floatingAnim4, 3500, 500).start();
        createFloatingAnimation(floatingAnim5, 4500, 1500).start();
        createFloatingAnimation(floatingAnim6, 6000, 3000).start();
    }, []);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
            return;
        }

        setIsLoading(true);

        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        try {
            const data = await apiLogin(email, password);
            const { accessToken, refreshToken, user } = data;

            console.log('Login success for user:', user.id);

            // Chuẩn bị thông tin user để gửi về App component
            const userInfo = {
                accessToken,
                refreshToken,
                userID: user.id,
                username: user.username,
                job: user.part,
                avatar: user.avatar,
                role: user.role_id || 'user'
            };

            console.log('🔄 Processing login success...');
            console.log('🔍 onLoginSuccess callback exists:', !!onLoginSuccess);

            // Luôn luôn lưu dữ liệu trước
            console.log('💾 Saving user data to AsyncStorage...');
            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', refreshToken);
            await AsyncStorage.setItem('userID', user.id.toString());
            await AsyncStorage.setItem('username', user.username);
            await AsyncStorage.setItem('job', user.part);
            await AsyncStorage.setItem('avatar', user.avatar);
            await AsyncStorage.setItem('role', user.role_id || 'user');

            // Gọi callback để App component xử lý - KHÔNG fallback navigation
            if (onLoginSuccess) {
                console.log('📞 Calling onLoginSuccess callback');
                await onLoginSuccess(userInfo);
                console.log('✅ onLoginSuccess completed - App should handle navigation');
            } else {
                console.log('⚠️ No onLoginSuccess callback provided!');
            }

            console.log('🔧 Processing device token...');
            await addDeviceToken(user.id, token);
            console.log('💾 Saving credentials...');
            await saveCredentials(email, password);
            console.log('🎉 Login process completed!');

            // Clear loading state immediately
            setIsLoading(false);

            // Force check if navigation happened
            setTimeout(() => {
                console.log('⏰ Checking if still on login screen after 2 seconds...');
                console.log('🔍 Current loading state:', isLoading);
            }, 2000);

        } catch (error) {
            console.error('🚨 Login error:', error);
            if (error.response && error.response.status === 400) {
                Alert.alert('Đăng nhập thất bại', 'Email hoặc mật khẩu không đúng.');
            } else {
                Alert.alert('Lỗi kết nối', 'Kiểm tra kết nối mạng.');
            }
            setIsLoading(false);
        }
    };

    const saveCredentials = async (email, password) => {
        try {
            await AsyncStorage.setItem('savedEmail', email);
            await AsyncStorage.setItem('savedPassword', password);
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    };

    const getID = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('savedEmail');
            const savedPassword = await AsyncStorage.getItem('savedPassword');

            if (savedEmail) {
                setEmail(savedEmail);
            }
            if (savedPassword) {
                setPassword(savedPassword);
            }
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    };


    const addDeviceToken = async (userId, deviceToken) => {
        try {
            console.log('🔧 Getting device token for user:', userId);
            // Lấy Expo push token thay vì Firebase token
            const expoPushToken = await notificationService.getExpoPushToken();
            console.log('📱 Generated token:', expoPushToken);

            if (expoPushToken) {
                await apiUpdateDeviceToken(userId, expoPushToken);
                console.log('✅ Device token updated successfully');
            } else {
                console.log('⚠️ No token generated, skipping update');
            }
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật device token:', error);
        }
    };

    return (
        <LinearGradient colors={['#1e3c72', '#2a5298', '#16a085', '#27ae60']} style={{flex: 1}}>
            {/* Floating Background Elements - Tech Icons */}
            <Animated.View style={{position: 'absolute', top: 80, left: 20, opacity: floatingAnim1.interpolate({inputRange: [0, 1], outputRange: [0.2, 0.6]}), transform: [{translateY: floatingAnim1.interpolate({inputRange: [0, 1], outputRange: [0, -25]})}]}}>
                <Ionicons name="wifi-outline" size={45} color="rgba(255,255,255,0.25)" />
            </Animated.View>
            <Animated.View style={{position: 'absolute', top: 180, right: 30, opacity: floatingAnim2.interpolate({inputRange: [0, 1], outputRange: [0.15, 0.5]}), transform: [{translateY: floatingAnim2.interpolate({inputRange: [0, 1], outputRange: [0, 20]})}]}}>
                <Ionicons name="desktop-outline" size={50} color="rgba(255,255,255,0.2)" />
            </Animated.View>
            <Animated.View style={{position: 'absolute', bottom: 250, left: 40, opacity: floatingAnim3.interpolate({inputRange: [0, 1], outputRange: [0.2, 0.45]}), transform: [{translateY: floatingAnim3.interpolate({inputRange: [0, 1], outputRange: [0, -15]})}]}}>
                <Ionicons name="camera-outline" size={40} color="rgba(255,255,255,0.22)" />
            </Animated.View>
            <Animated.View style={{position: 'absolute', top: 250, left: width - 70, opacity: floatingAnim4.interpolate({inputRange: [0, 1], outputRange: [0.18, 0.4]}), transform: [{translateX: floatingAnim4.interpolate({inputRange: [0, 1], outputRange: [0, -20]})}]}}>
                <Ionicons name="server-outline" size={38} color="rgba(255,255,255,0.18)" />
            </Animated.View>
            <Animated.View style={{position: 'absolute', bottom: 150, right: 60, opacity: floatingAnim5.interpolate({inputRange: [0, 1], outputRange: [0.25, 0.55]}), transform: [{translateY: floatingAnim5.interpolate({inputRange: [0, 1], outputRange: [0, 18]})}]}}>
                <Ionicons name="phone-portrait-outline" size={35} color="rgba(255,255,255,0.3)" />
            </Animated.View>
            <Animated.View style={{position: 'absolute', top: 350, left: 15, opacity: floatingAnim6.interpolate({inputRange: [0, 1], outputRange: [0.2, 0.4]}), transform: [{translateX: floatingAnim6.interpolate({inputRange: [0, 1], outputRange: [0, 25]})}]}}>
                <Ionicons name="hardware-chip-outline" size={42} color="rgba(255,255,255,0.2)" />
            </Animated.View>

            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20}} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Header Section */}
                    <Animated.View style={[{ alignItems: 'center', marginBottom: 20 }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Animated.View style={[{ marginBottom: 10 }, { transform: [{ scale: logoScale }] }]}>
                            <View style={{width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'}}>
                                <Image source={require('../../../assets/images/nl-konen.png')} style={{width: 85, height: 85, borderRadius: 42.5}} resizeMode="cover" />
                            </View>
                        </Animated.View>
                        <Text style={{fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8}}>JOB NLTECH</Text>
                        <Text style={{fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center'}}>Quản lý công việc & Chấm công</Text>
                    </Animated.View>

                    {/* Login Form */}
                    <Animated.View style={[{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 25, padding: 30, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={{fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8}}>Chào mừng trở lại!</Text>
                        <Text style={{fontSize: 16, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 20}}>Đăng nhập để tiếp tục</Text>

                        {/* Username Input */}
                        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, marginBottom: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)'}}>
                            <Ionicons name="person-outline" size={22} color="#666" style={{marginRight: 15}} />
                            <TextInput
                                style={{flex: 1, fontSize: 16, color: '#2c3e50', paddingVertical: 0, textAlignVertical: 'center'}}
                                placeholder="Tài khoản"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)'}}>
                            <Ionicons name="lock-closed-outline" size={22} color="#666" style={{marginRight: 15}} />
                            <TextInput
                                style={{flex: 1, fontSize: 16, color: '#2c3e50', paddingVertical: 0, textAlignVertical: 'center'}}
                                placeholder="Mật khẩu"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{padding: 0}}>
                                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Login Button */}
                        <Animated.View style={{transform: [{scale: buttonScale}]}}>
                            <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
                                <LinearGradient
                                    colors={isLoading ? ['#6b7280', '#9ca3af'] : ['#1e8449', '#27ae60']}
                                    style={{borderRadius: 15, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8}}
                                >
                                    {isLoading ? (
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <LoadingDots color="#fff" size={8} />
                                            <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10}}>Đang đăng nhập...</Text>
                                        </View>
                                    ) : (
                                        <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>Đăng nhập</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Developer Credit */}
                        <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 20, fontStyle: 'italic'}}>Được phát triển bởi NLTECH</Text>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};



export default LoginScreen;