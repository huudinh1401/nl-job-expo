import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Platform } from 'react-native';
import { Icon } from 'react-native-elements';
import { Menu, Divider, PaperProvider } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUpdateDeviceToken } from '../../config/apiService';

const HeaderLeader = ({ navigation, visible, setVisible, title }) => {
    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const handleLogout = async () => {
        const deviceToken = null;
        const userId = await AsyncStorage.getItem('userID');
        deleteDeviceToken(userId, deviceToken);
        setVisible(false)
        navigation.dispatch(
            CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            })
        );
    }

    const handleHistory = () => {
        setVisible(false)
        navigation.navigate('HistoryUser')
    }

    const handleChangePass = () => {
        setVisible(false)
        navigation.navigate('ChangePass')
    }

    const handleBangChamCong = () => {
        setVisible(false)
        navigation.navigate('BangChamCong')
    }

    const deleteDeviceToken = async (id, device_token) => {
        try {
            const data = await apiUpdateDeviceToken(id, device_token);
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('userID');
        } catch (error) {
            console.error('Lỗi khi lấy token:', error);
        }
    };

    return (
        <PaperProvider style={{ height: 50, width: '100%' }}>
            <View style={{ flexDirection: 'row', height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a', borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <View style={{ flex: 0.5 }} />
                <View style={{ flex: 9, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="supervisor-account" type="material" size={24} color="#10b981" style={{ marginRight: 8 }} />
                        <Text style={{ textAlign: 'center', color: '#f1f5f9', fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
                    </View>
                </View>
                <Menu
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: 16, marginTop: Platform.OS === 'ios' ? 3 : 35, minWidth: 212, borderWidth: 1, borderColor: '#475569' }}
                    statusBarHeight={0}
                    anchor={
                        <TouchableOpacity
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                            onPress={() => setVisible(!visible)}
                            activeOpacity={0.7}
                        >
                            <Icon name='more-vert' type='material' size={28} color="#00FFFF" />
                        </TouchableOpacity>
                    }>

                    <Menu.Item
                        onPress={() => handleHistory()}
                        title="Lịch sử"
                        leadingIcon={() => <Icon name="history" type="material" size={22} color="#06b6d4" />}
                        titleStyle={{ fontSize: 16, fontWeight: '600', color: '#f1f5f9', fontFamily: 'Inter' }}
                        style={{ paddingHorizontal: 18, minHeight: 50, backgroundColor: 'transparent' }}
                    />

                    <Menu.Item
                        onPress={() => handleBangChamCong()}
                        title="Bảng chấm công"
                        leadingIcon={() => <Icon name="event-note" type="material" size={22} color="#8b5cf6" />}
                        titleStyle={{ fontSize: 16, fontWeight: '600', color: '#f1f5f9', fontFamily: 'Inter' }}
                        style={{ paddingHorizontal: 18, minHeight: 50, backgroundColor: 'transparent' }}
                    />

                    <Menu.Item
                        onPress={() => handleChangePass()}
                        title="Đổi mật khẩu"
                        leadingIcon={() => <Icon name="lock" type="material" size={22} color="#fbbf24" />}
                        titleStyle={{ fontSize: 16, fontWeight: '600', color: '#f1f5f9', fontFamily: 'Inter' }}
                        style={{ paddingHorizontal: 18, minHeight: 50, backgroundColor: 'transparent' }}
                    />

                    <Divider style={{ backgroundColor: '#475569', height: 1, marginVertical: 8 }} />

                    <Menu.Item
                        onPress={() => handleLogout()}
                        title="Đăng xuất"
                        leadingIcon={() => <Icon name="logout" type="material" size={22} color="#ef4444" />}
                        titleStyle={{ fontSize: 16, fontWeight: '700', color: '#fca5a5', fontFamily: 'Inter' }}
                        style={{ paddingHorizontal: 18, minHeight: 50, backgroundColor: '#7f1d1d', borderRadius: 8, marginHorizontal: 8, marginBottom: 10 }}
                    />
                </Menu>
            </View>
        </PaperProvider>
    );
}
export default HeaderLeader;