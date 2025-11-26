import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, KeyboardAvoidingView, TouchableOpacity,
    StatusBar, Alert, Platform, Image, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiChangePass } from '../../services/apiService';
import { CommonActions } from '@react-navigation/native';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const ChangePassScreen = ({ navigation }) => {
    const [hidepassword, setHidepassword] = useState(true);
    const [hideNewPassword, setHideNewPassword] = useState(true);
    const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
    const [passwordOld, setPasswordOld] = useState('');
    const [passwordNew, setPasswordNew] = useState('');
    const [passwordNewAgain, setPasswordNewAgain] = useState('');
    const [userID, setUserID] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false };
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                id && setUserID(id);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();

        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleChangePass = async (passwordOld, passwordNew, passwordNewAgain) => {
        if (!passwordOld.trim() || !passwordNew.trim() || !passwordNewAgain.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        if (passwordNew !== passwordNewAgain) {
            Alert.alert('Lỗi', 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!');
            return;
        }
        if (passwordNew.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
            return;
        }
        setIsLoading(true);
        try {
            const data = await apiChangePass(userID, passwordOld, passwordNew);

            if (data.message === 'Đổi mật khẩu thành công') {
                Alert.alert('Thành công', 'Mật khẩu của bạn đã được đổi thành công!', [
                    {
                        text: 'OK',
                        onPress: async () => {
                            await AsyncStorage.removeItem('accessToken');
                            await AsyncStorage.removeItem('refreshToken');
                            await AsyncStorage.removeItem('userID');
                            await AsyncStorage.removeItem('myPassword');
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                })
                            );
                        },
                    },
                ]);
            } else {
                Alert.alert('Lỗi', data.message || 'Đổi mật khẩu thất bại');
            }
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại mật khẩu cũ !');
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
                <StatusBar barStyle='light-content' backgroundColor="#0f172a" />

                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: '#0f172a', marginTop: isAndroid15 ? 25 : 15 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a' }}>
                            <Ionicons name='lock-closed-outline' size={20} color='#3b82f6' style={{ marginRight: 12 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: 'white' }}>Đổi mật khẩu</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 18 }}>
                            <Ionicons name='chevron-back-outline' size={18} color='white' />
                        </TouchableOpacity>
                    </View>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#0f172a' }}>
                    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }} contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                        <Animated.View style={{ opacity: fadeAnim, flex: 1, justifyContent: 'center', paddingHorizontal: 10, backgroundColor: '#0f172a' }}>
                            {/* Logo Section */}
                            <View style={{ alignItems: 'center', marginBottom: 10, backgroundColor: '#0f172a' }}>
                                <View style={{ width: 90, height: 90, backgroundColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 10, ...(Platform.OS === 'ios' && { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 }), elevation: Platform.OS === 'ios' ? 6 : 0, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                    <Image style={{ width: 70, height: 70 }} source={require('../../../assets/images/nl-konen.png')} />
                                </View>
                                <Text style={{ color: 'white', fontSize: 20, fontWeight: '800', textAlign: 'center' }}>JOB NLTECH</Text>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, textAlign: 'center', marginTop: 5 }}>Bảo mật tài khoản của bạn</Text>
                            </View>

                            {/* Form Card */}
                            <View style={{ backgroundColor: '#1e293b', borderRadius: 24, padding: 15, ...(Platform.OS === 'ios' && { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20 }), elevation: Platform.OS === 'ios' ? 8 : 0, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: 20 }}>
                                <View style={{ alignItems: 'center', marginBottom: 25, backgroundColor: '#1e293b' }}>
                                    <Ionicons name='shield-checkmark-outline' size={36} color='#3b82f6' style={{ marginBottom: 12 }} />
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Thay đổi mật khẩu</Text>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, textAlign: 'center' }}>Vui lòng nhập thông tin để đổi mật khẩu</Text>
                                </View>

                                {/* Current Password */}
                                <View style={{ marginBottom: 15, backgroundColor: '#1e293b' }}>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Mật khẩu hiện tại</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, height: 50, ...(Platform.OS === 'ios' && { shadowColor: '#ef4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }), elevation: Platform.OS === 'ios' ? 3 : 0, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                        <Ionicons name='lock-closed-outline' size={20} color='#ef4444' style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={{ flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' }}
                                            placeholder='Nhập mật khẩu hiện tại'
                                            placeholderTextColor='#9ca3af'
                                            returnKeyType='next'
                                            secureTextEntry={hidepassword}
                                            autoCapitalize='none'
                                            autoCorrect={false}
                                            onChangeText={(text) => setPasswordOld(text)}
                                            value={passwordOld}
                                        />
                                        <TouchableOpacity onPress={() => setHidepassword(!hidepassword)} style={{ padding: 4, backgroundColor: '#ffffff' }}>
                                            <Ionicons name={hidepassword ? 'eye-outline' : 'eye-off-outline'} size={20} color='#64748b' />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* New Password */}
                                <View style={{ marginBottom: 15, backgroundColor: '#1e293b' }}>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Mật khẩu mới</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, height: 50, ...(Platform.OS === 'ios' && { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }), elevation: Platform.OS === 'ios' ? 3 : 0, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                        <Ionicons name='key-outline' size={20} color='#3b82f6' style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={{ flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' }}
                                            placeholder='Nhập mật khẩu mới (tối thiểu 6 ký tự)'
                                            placeholderTextColor='#9ca3af'
                                            returnKeyType='next'
                                            secureTextEntry={hideNewPassword}
                                            autoCapitalize='none'
                                            autoCorrect={false}
                                            onChangeText={(text) => setPasswordNew(text)}
                                            value={passwordNew}
                                        />
                                        <TouchableOpacity onPress={() => setHideNewPassword(!hideNewPassword)} style={{ padding: 4, backgroundColor: '#ffffff' }}>
                                            <Ionicons name={hideNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color='#64748b' />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Confirm Password */}
                                <View style={{ marginBottom: 15, backgroundColor: '#1e293b' }}>
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>Xác nhận mật khẩu mới</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 16, height: 50, ...(Platform.OS === 'ios' && { shadowColor: '#10b981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }), elevation: Platform.OS === 'ios' ? 3 : 0, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                                        <Ionicons name='checkmark-circle-outline' size={20} color='#10b981' style={{ marginRight: 12 }} />
                                        <TextInput
                                            style={{ flex: 1, fontSize: 16, color: '#1f2937', fontWeight: '500' }}
                                            placeholder='Nhập lại mật khẩu mới'
                                            placeholderTextColor='#9ca3af'
                                            returnKeyType='go'
                                            secureTextEntry={hideConfirmPassword}
                                            autoCapitalize='none'
                                            autoCorrect={false}
                                            onChangeText={(text) => setPasswordNewAgain(text)}
                                            value={passwordNewAgain}
                                            onSubmitEditing={() => handleChangePass(passwordOld, passwordNew, passwordNewAgain)}
                                        />
                                        <TouchableOpacity onPress={() => setHideConfirmPassword(!hideConfirmPassword)} style={{ padding: 4, backgroundColor: '#ffffff' }}>
                                            <Ionicons name={hideConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color='#64748b' />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Security Tips */}
                                <View style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 12, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, }}>
                                        <Ionicons name='information-circle-outline' size={16} color='#3b82f6' style={{ marginRight: 8 }} />
                                        <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>Gợi ý bảo mật</Text>
                                    </View>
                                    <Text style={{ color: '#94a3b8', fontSize: 13, lineHeight: 18 }}>
                                        • Mật khẩu phải có ít nhất 6 ký tự{'\n'}
                                        • Nên kết hợp chữ hoa, chữ thường và số
                                    </Text>
                                </View>

                                {/* Buttons */}
                                <View style={{ backgroundColor: '#1e293b' }}>
                                    {/* Change Password Button */}
                                    <TouchableOpacity
                                        style={{ backgroundColor: isLoading ? '#6b7280' : '#10b981', borderRadius: 16, paddingVertical: 16, ...(Platform.OS === 'ios' && { shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 }), elevation: Platform.OS === 'ios' ? 8 : 0, marginBottom: 15 }}
                                        onPress={() => handleChangePass(passwordOld, passwordNew, passwordNewAgain)}
                                        disabled={isLoading}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isLoading ? '#6b7280' : '#10b981' }}>
                                            {isLoading ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLoading ? '#6b7280' : '#10b981' }}>
                                                    <View style={{ width: 20, height: 20, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: 10, marginRight: 12 }} />
                                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Đang xử lý...</Text>
                                                </View>
                                            ) : (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isLoading ? '#6b7280' : '#10b981' }}>
                                                    <Ionicons name='shield-checkmark-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                                    <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Đổi mật khẩu</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Back Button */}
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#dc2626', borderRadius: 16, paddingVertical: 16, ...(Platform.OS === 'ios' && { shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }), elevation: Platform.OS === 'ios' ? 6 : 0 }}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626' }}>
                                            <Ionicons name='chevron-back-outline' size={24} color='white' style={{ marginRight: 10 }} />
                                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>Quay lại</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                            </View>
                            <View style={{ marginTop: 45 }} />
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

export default ChangePassScreen;