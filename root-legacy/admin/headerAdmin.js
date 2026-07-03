import React, { useState, useEffect } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { Menu, Divider, PaperProvider } from 'react-native-paper';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HeaderAdmin = ({ navigation }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userID');
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
        navigation.navigate('HistoryAdmin')
    }

    const handleChangePass = () => {
        setVisible(false)
        navigation.navigate('ChangePass')
    }

    return (
        <PaperProvider style={{ height: 45, width: '100%' }}>
            <View style={{ flexDirection: 'row', height: 45, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a', borderRadius: 10 }}>
                <View style={{ flex: 0.5 }} />
                <View style={{ flex: 9, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ textAlign: 'center', color: 'white', fontSize: 16, fontWeight: 'bold' }}>QUẢN LÝ CÔNG VIỆC</Text>
                </View>
                <Menu
                    visible={visible}
                    onDismiss={() => setVisible(false)}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: 12, marginTop: 0, minWidth: 200, borderWidth: 1, borderColor: '#1e40af' }}
                    anchor={
                        <TouchableOpacity
                            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: 4 }}
                            onPress={() => setVisible(!visible)}
                            activeOpacity={0.7}
                        >
                            <Icon name='ellipsis-vertical' type='ionicon' size={26} color="#00FFFF" />
                        </TouchableOpacity>
                    }>

                    <Menu.Item
                        onPress={() => handleHistory()}
                        title="Lịch sử"
                        leadingIcon={() => <Icon name="history" type="material" size={20} color="#00BFFF" />}
                        titleStyle={{
                            fontSize: 16, fontWeight: '500', color: '#e2e8f0', fontFamily: 'Inter',
                        }}
                        style={{
                            paddingVertical: 12, paddingHorizontal: 16, minHeight: 48,
                        }}
                    />

                    <Menu.Item
                        onPress={() => handleChangePass()}
                        title="Đổi mật khẩu"
                        leadingIcon={() => <Icon name="lock-outline" type="material" size={20} color="#FFD700" />}
                        titleStyle={{
                            fontSize: 16, fontWeight: '500', color: '#e2e8f0', fontFamily: 'Inter',
                        }}
                        style={{
                            paddingVertical: 12, paddingHorizontal: 16, minHeight: 48,
                        }}
                    />

                    <Divider style={{ backgroundColor: '#475569', height: 1, marginVertical: 4, }} />
                    <Menu.Item
                        onPress={() => handleLogout()}
                        title="Đăng xuất"
                        leadingIcon={() => <Icon name="logout" type="material" size={20} color="#FF4444" />}
                        titleStyle={{ fontSize: 16, fontWeight: '600', color: '#f87171', fontFamily: 'Inter', }}
                        style={{ paddingVertical: 12, paddingHorizontal: 16, minHeight: 48, backgroundColor: '#4c1d1d', }}
                    />
                </Menu>
            </View>
        </PaperProvider>
    );
}
export default HeaderAdmin;