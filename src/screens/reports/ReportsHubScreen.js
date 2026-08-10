import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { REPORT_TYPES } from '../../constants/reportsConfig';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

// Tạm ẩn "Báo cáo quên chấm công" cho mọi loại tài khoản: đã có chấm công ngoài công ty nên không còn cần báo cáo quên chấm công nữa.
const HUB_ITEMS = Object.values(REPORT_TYPES).filter((t) => t.key !== 'attendance');

const ReportsHubScreen = ({ navigation }) => {
    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginTop: isAndroid15 ? 25 : 8, marginHorizontal: 12, paddingHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 16 }}>
                    <Text style={{ flex: 1, color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Báo cáo & Nghỉ phép</Text>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 12, marginTop: 20 }}>
                    {HUB_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => navigation.navigate('ReportList', { reportType: item.key })}
                            activeOpacity={0.85}
                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#475569' }}
                        >
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: item.color, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                                <Ionicons name={item.icon} size={22} color="#ffffff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '700' }}>{item.title}</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>Xem lịch sử & tạo mới</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                        </TouchableOpacity>
                    ))}
                </View>
            </SafeAreaView>
        </View>
    );
};

export default ReportsHubScreen;
