import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const ExpoGoWarning = () => {
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        // Chỉ hiển thị warning nếu đang chạy trong Expo Go trên thiết bị thật
        // Không hiện warning trên simulator vì đã biết limitation
        if (Constants.appOwnership === 'expo' && Device.isDevice) {
            setShowWarning(true);
        }
    }, []);

    const handleLearnMore = () => {
        Alert.alert(
            'Development Build',
            'Để sử dụng đầy đủ tính năng push notifications:\n\n' +
            '1. Chạy: npx expo install expo-dev-client\n' +
            '2. Build development: eas build --profile development\n' +
            '3. Cài đặt build file (.apk/.ipa) trên thiết bị\n\n' +
            'Hoặc test trên Production build.',
            [
                { text: 'Đóng', style: 'cancel' },
                {
                    text: 'Xem docs',
                    onPress: () => Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/')
                }
            ]
        );
    };

    if (!showWarning) return null;

    return (
        <View style={{backgroundColor: '#fbbf24', margin: 10, padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center'}}>
            <Ionicons name="warning" size={20} color="#92400e" style={{marginRight: 8}} />
            <View style={{flex: 1}}>
                <Text style={{fontSize: 12, fontWeight: '600', color: '#92400e', marginBottom: 2}}>
                    Expo Go Limitation
                </Text>
                <Text style={{fontSize: 11, color: '#92400e', lineHeight: 14}}>
                    Push notifications không hoạt động đầy đủ trong Expo Go (SDK 53+)
                </Text>
            </View>
            <TouchableOpacity onPress={handleLearnMore} style={{backgroundColor: '#92400e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4}}>
                <Text style={{fontSize: 10, color: 'white', fontWeight: '600'}}>Tìm hiểu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowWarning(false)} style={{marginLeft: 8, padding: 2}}>
                <Ionicons name="close" size={16} color="#92400e" />
            </TouchableOpacity>
        </View>
    );
};

export default ExpoGoWarning;
