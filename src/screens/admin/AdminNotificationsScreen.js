import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AdminNotificationsScreen = ({ navigation }) => {
    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
                    <View style={{ width: 40, height: 40, backgroundColor: '#3b82f6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name="notifications-outline" size={20} color="#ffffff" />
                    </View>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Thông báo</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                        <Ionicons name="notifications-outline" size={44} color="#3b82f6" />
                    </View>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>Sắp ra mắt</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                        Tính năng lịch sử thông báo đang được phát triển.
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminNotificationsScreen;
