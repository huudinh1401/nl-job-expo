import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminHeaderScreen = ({ navigation, onLogout }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const handleLogout = async () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Đăng xuất',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setVisible(false);
                            if (onLogout) {
                                await onLogout();
                            } else {
                                await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userID', 'username', 'job', 'avatar', 'role']);
                            }
                        } catch (error) {
                            console.error('Logout error:', error);
                            if (onLogout) {
                                await onLogout();
                            }
                        }
                    }
                }
            ]
        );
    };

    const handleHistory = () => {
        setVisible(false);
        navigation.navigate('AdminHistoryScreen');
    };

    const handleChangePass = () => {
        setVisible(false);
        navigation.navigate('ChangePass');
    };

    return (
        <View style={{ height: 60, width: '100%' }}>
            {/* Header với gradient background */}
            <View style={{ flexDirection: 'row', height: 60, width: '100%', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                {/* Admin Icon */}
                <View style={{ width: 40, height: 40, backgroundColor: '#3b82f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons name="shield-checkmark" size={22} color="#ffffff" />
                </View>
                
                {/* Title Section */}
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter' }}>Admin</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500', fontFamily: 'Inter' }}>Quản lý công việc</Text>
                </View>
                
                {/* Menu Button */}
                <TouchableOpacity
                    style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    onPress={() => setVisible(!visible)}
                    activeOpacity={0.8}
                >
                    <Ionicons name='menu' size={24} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            {/* Dropdown Menu Modal */}
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={{ position: 'absolute', top: 110, right: 20, backgroundColor: '#ffffff', borderRadius: 20, minWidth: 220, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12, overflow: 'hidden' }}>
                        {/* Menu Header */}
                        <View style={{ backgroundColor: '#3b82f6', paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' }}>
                            <Ionicons name="person-circle" size={32} color="#ffffff" />
                            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter', marginTop: 4 }}>Admin Menu</Text>
                        </View>
                        
                        {/* Menu Items */}
                        <View style={{ backgroundColor: '#ffffff' }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                onPress={() => handleHistory()}
                                activeOpacity={0.8}
                            >
                                <View style={{ width: 36, height: 36, backgroundColor: '#dbeafe', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Ionicons name="time-outline" size={18} color="#3b82f6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', fontFamily: 'Inter' }}>Lịch sử</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                onPress={() => handleChangePass()}
                                activeOpacity={0.8}
                            >
                                <View style={{ width: 36, height: 36, backgroundColor: '#fef3c7', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Ionicons name="lock-closed-outline" size={18} color="#f59e0b" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', fontFamily: 'Inter' }}>Đổi mật khẩu</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#fef2f2' }}
                                onPress={() => handleLogout()}
                                activeOpacity={0.8}
                            >
                                <View style={{ width: 36, height: 36, backgroundColor: '#fecaca', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#dc2626', fontFamily: 'Inter' }}>Đăng xuất</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#f87171" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default AdminHeaderScreen;
