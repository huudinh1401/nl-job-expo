import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AdminProfileScreen = ({ navigation, onLogout }) => {
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState(null);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        const fetchProfile = async () => {
            const [storedUsername, storedAvatar] = await Promise.all([
                AsyncStorage.getItem('username'),
                AsyncStorage.getItem('avatar'),
            ]);
            storedUsername && setUsername(storedUsername);
            storedAvatar && setAvatar(storedAvatar);
        };
        fetchProfile();
    }, []);

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: async () => {
                    if (onLogout) {
                        await onLogout();
                    } else {
                        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                    }
                },
            },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Cá nhân</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginTop: 30 }}>
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#3b82f6' }}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={{ width: 84, height: 84, borderRadius: 42 }} />
                        ) : (
                            <Ionicons name="person-outline" size={40} color="#94a3b8" />
                        )}
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', marginTop: 12 }}>{username || 'Admin'}</Text>
                    <View style={{ backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, marginTop: 6 }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Quản trị viên</Text>
                    </View>
                </View>

                <View style={{ marginTop: 30, marginHorizontal: 15 }}>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 16, padding: 16, marginBottom: 12 }}
                        onPress={() => navigation.navigate('AppInfo')}
                        activeOpacity={0.8}
                    >
                        <View style={{ width: 36, height: 36, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
                        </View>
                        <Text style={{ flex: 1, color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Thông tin ứng dụng</Text>
                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#450a0a', borderRadius: 16, padding: 16 }}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <View style={{ width: 36, height: 36, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                        </View>
                        <Text style={{ flex: 1, color: '#fca5a5', fontSize: 16, fontWeight: '600' }}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminProfileScreen;
