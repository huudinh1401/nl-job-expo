import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, StatusBar, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const version = Constants.expoConfig?.version || '1.0.0';

const AppInfoScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false };
    }, []);

    const openPrivacyPolicy = () => {
        // Đường dẫn đến trang Privacy Policy của bạn
        Linking.openURL('https://nguyenluan.vn/privacy-policy');
    };

    return (
        <View style={{flex: 1, backgroundColor: '#0f172a', paddingTop: insets.top}}>
            <StatusBar barStyle='light-content' backgroundColor="#0f172a" />

            {/* Header */}
            <View style={{backgroundColor: '#1e40af', paddingHorizontal: 20, paddingVertical: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, ...(Platform.OS === 'ios' && {shadowColor: '#1e40af', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.3, shadowRadius: 20}), elevation: Platform.OS === 'ios' ? 10 : 0, position: 'relative', overflow: 'hidden'}}>
                {/* Background Pattern */}
                <View style={{position: 'absolute', top: 0, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255, 255, 255, 0.08)', opacity: 0.6}} />
                <View style={{position: 'absolute', top: -30, right: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.05)', opacity: 0.8}} />

                {/* Header Content */}
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2, position: 'relative'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                        {/* Icon Container */}
                        <View style={{backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: 16, borderRadius: 20, marginRight: 16, ...(Platform.OS === 'ios' && {shadowColor: 'rgba(0, 0, 0, 0.2)', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8}), elevation: Platform.OS === 'ios' ? 3 : 0}}>
                            <Ionicons name="information-circle-outline" size={24} color="white" />
                        </View>

                        {/* Title Container */}
                        <View style={{flex: 1}}>
                            <Text style={{fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: 0.5}}>
                                Thông tin ứng dụng
                            </Text>
                            <Text style={{fontSize: 14, color: 'rgba(255, 255, 255, 0.95)', marginTop: 2, fontWeight: '500', opacity: 0.9}}>
                                Chi tiết về JOB NLTECH
                            </Text>
                        </View>
                    </View>

                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: 12, borderRadius: 16, ...(Platform.OS === 'ios' && {shadowColor: 'rgba(0, 0, 0, 0.2)', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8}), elevation: Platform.OS === 'ios' ? 3 : 0, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)'}}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Decorative Bottom Line */}
                <View style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.2)'}} />
            </View>

            <ScrollView style={{flex: 1}} contentContainerStyle={{ paddingBottom: 30}} showsVerticalScrollIndicator={false}>
                {/* App Info Card */}
                <View style={{margin: 15, backgroundColor: '#1e293b', borderRadius: 25, padding: 20, ...(Platform.OS === 'ios' && {shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 15}), elevation: Platform.OS === 'ios' ? 8 : 0, borderWidth: 1, borderColor: '#334155'}}>
                    <View style={{alignItems: 'center', marginBottom: 30, backgroundColor: 'transparent'}}>
                        <View style={{width: 90, height: 90, backgroundColor: '#3b82f6', borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...(Platform.OS === 'ios' && {shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.4, shadowRadius: 12}), elevation: Platform.OS === 'ios' ? 6 : 0, position: 'relative', overflow: 'hidden'}}>
                            {/* Background effect */}
                            <View style={{position: 'absolute', top: -20, right: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.2)'}} />
                            <Ionicons name='briefcase-outline' size={40} color='white' />
                        </View>
                        <Text style={{fontSize: 24, fontWeight: '900', color: '#3b82f6', textAlign: 'center', letterSpacing: 1}}>JOB NLTECH</Text>
                        <Text style={{fontSize: 16, color: '#94a3b8', textAlign: 'center', marginTop: 8, fontWeight: '500'}}>Quản lý công việc thông minh</Text>
                    </View>

                    {/* Description Sections */}
                    <View style={{backgroundColor: 'transparent'}}>
                        <View style={{marginBottom: 25, backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent'}}>
                                <View style={{backgroundColor: 'rgba(245, 158, 11, 0.2)', padding: 8, borderRadius: 12, marginRight: 12}}>
                                    <Ionicons name='star-outline' size={20} color='#f59e0b' />
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: 'white'}}>Giới thiệu</Text>
                            </View>
                            <Text style={{fontSize: 15, color: '#cbd5e1', lineHeight: 26, textAlign: 'justify'}}>
                                Chào mừng bạn đến với ứng dụng JOB NLTECH, được phát triển bởi NGUYEN LUAN COMPANY LIMITED | NLTECH.
                                Ứng dụng được thiết kế nhằm hỗ trợ quản lý công việc một cách hiệu quả và dễ dàng.
                            </Text>
                        </View>

                        <View style={{marginBottom: 25, backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent'}}>
                                <View style={{backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: 8, borderRadius: 12, marginRight: 12}}>
                                    <Ionicons name='settings-outline' size={20} color='#10b981' />
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: 'white'}}>Tính năng</Text>
                            </View>
                            <Text style={{fontSize: 15, color: '#cbd5e1', lineHeight: 26, textAlign: 'justify'}}>
                                JOB NLTECH cung cấp các tính năng hiện đại để theo dõi tiến trình công việc, quản lý vị trí làm việc,
                                tạo báo cáo chi tiết về hoạt động hàng ngày. Chúng tôi cam kết đem lại trải nghiệm người dùng tối ưu
                                và hỗ trợ tối đa trong việc điều hành công việc hàng ngày của bạn.
                            </Text>
                        </View>

                        <View style={{marginBottom: 30, backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: 'transparent'}}>
                                <View style={{backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: 8, borderRadius: 12, marginRight: 12}}>
                                    <Ionicons name='shield-checkmark-outline' size={20} color='#ef4444' />
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: 'white'}}>Bảo mật</Text>
                            </View>
                            <Text style={{fontSize: 15, color: '#cbd5e1', lineHeight: 26, textAlign: 'justify'}}>
                                Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn, chỉ sử dụng thông tin này cho các mục đích quản lý công việc,
                                không sử dụng cho bất kỳ mục đích nào khác ngoài các tính năng của ứng dụng mà không có sự đồng ý của bạn.
                            </Text>
                        </View>

                        {/* Privacy Policy Link */}
                        <TouchableOpacity onPress={openPrivacyPolicy} style={{backgroundColor: 'rgba(59, 130, 246, 0.15)', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: 'rgba(59, 130, 246, 0.4)', marginBottom: 25, ...(Platform.OS === 'ios' && {shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8}), elevation: Platform.OS === 'ios' ? 5 : 0}}
                            activeOpacity={0.8}
                        >
                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent'}}>
                                <View style={{backgroundColor: 'rgba(59, 130, 246, 0.3)', padding: 8, borderRadius: 12, marginRight: 12}}>
                                    <Ionicons name='document-text-outline' size={20} color='#3b82f6' />
                                </View>
                                <Text style={{fontSize: 16, color: '#3b82f6', fontWeight: '700', textAlign: 'center', flex: 1}}>
                                    Xem Chính sách Quyền riêng tư
                                </Text>
                                <Ionicons name='chevron-forward-outline' size={18} color='#3b82f6' />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Version & Company Info */}
                <View style={{marginHorizontal: 15, backgroundColor: 'transparent'}}>
                    <View style={{backgroundColor: '#1e293b', borderRadius: 20, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: '#334155', ...(Platform.OS === 'ios' && {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10}), elevation: Platform.OS === 'ios' ? 4 : 0}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent'}}>
                                <View style={{backgroundColor: 'rgba(6, 182, 212, 0.2)', padding: 10, borderRadius: 12, marginRight: 12}}>
                                    <Ionicons name='code-slash-outline' size={20} color='#06b6d4' />
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: 'white'}}>Phiên bản</Text>
                            </View>
                            <View style={{backgroundColor: 'rgba(6, 182, 212, 0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)'}}>
                                <Text style={{fontSize: 16, fontWeight: '800', color: '#06b6d4'}}>ver {version} - {new Date().getFullYear()}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={{backgroundColor: '#1e293b', borderRadius: 20, padding: 25, marginBottom: 30, borderWidth: 1, borderColor: '#334155', ...(Platform.OS === 'ios' && {shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10}), elevation: Platform.OS === 'ios' ? 4 : 0}}>
                        <View style={{alignItems: 'center', backgroundColor: 'transparent'}}>
                            <View style={{backgroundColor: 'rgba(148, 163, 184, 0.2)', padding: 12, borderRadius: 15, marginBottom: 15}}>
                                <Ionicons name='business-outline' size={28} color='#94a3b8' />
                            </View>
                            <Text style={{fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, fontWeight: '500'}}>
                                © {new Date().getFullYear()} Công Ty TNHH Nguyên Luân | NLTECH
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Back Button */}
                <View style={{paddingHorizontal: 15, backgroundColor: 'transparent'}}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{height: 60, backgroundColor: '#f59e0b', borderRadius: 30, justifyContent: 'center', alignItems: 'center', ...(Platform.OS === 'ios' && {shadowColor: '#f59e0b', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.4, shadowRadius: 15}), elevation: Platform.OS === 'ios' ? 8 : 0, borderWidth: 2, borderColor: 'rgba(245, 158, 11, 0.3)'}}
                        activeOpacity={0.9}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent'}}>
                            <Ionicons name='chevron-back-outline' size={26} color='white' style={{marginRight: 12}} />
                            <Text style={{color: 'white', fontSize: 18, fontWeight: '800', letterSpacing: 0.5}}>Quay lại</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={{marginTop: 60}} />
            </ScrollView>
        </View>
    );
};

export default AppInfoScreen;
