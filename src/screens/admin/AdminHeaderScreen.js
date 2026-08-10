import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminHeaderScreen = () => {
    const [username, setUsername] = useState('');

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        AsyncStorage.getItem('username').then((value) => value && setUsername(value));
    }, []);

    return (
        <View style={{ height: 60, width: '100%' }}>
            <View style={{ flexDirection: 'row', height: 60, width: '100%', alignItems: 'center', backgroundColor: '#1e40af', borderRadius: 16, paddingHorizontal: 16, shadowColor: '#1e40af', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 }}>
                {/* Admin Icon */}
                <View style={{ width: 40, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                    <Ionicons name="shield-checkmark" size={22} color="#ffffff" />
                </View>

                {/* Title Section */}
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter' }}>
                        Admin{username ? ` - ${username}` : ''}
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, fontWeight: '500', fontFamily: 'Inter' }}>Quản lý công việc</Text>
                </View>
            </View>
        </View>
    );
};

export default AdminHeaderScreen;
