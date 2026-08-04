import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, SafeAreaView, Platform, StatusBar, Alert, Image } from 'react-native';
import { Icon } from 'react-native-elements';
import { isTablet, width, height } from '../../config/deviceConfig';
import { apiGetJobHistory } from '../../config/apiService';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const DsNvDiemDanh = ({ navigation, team, getDsNvDiemDanh, diemDanhNv, homNay }) => {
    useFocusEffect(
        useCallback(() => {
            getDsNvDiemDanh();
        }, [getDsNvDiemDanh])
    );

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const ItemView = ({ item, index }) => {
        const isPresent = item.status === 'Đi làm';
        return (
            <View style={{ width: (width - 20) / 2, height: 80, margin: 3, backgroundColor: '#475569', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#f1f5f9', fontSize: isTablet ? 18 : 14, textAlign: 'center', fontWeight: 'bold' }}>{item.username}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isPresent ? '#10b981' : '#ef4444', marginRight: 6 }} />
                        <Text style={{ color: isPresent ? '#10b981' : '#ef4444', fontSize: isTablet ? 16 : 12, fontWeight: '600' }}>{item.status}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />

                <View style={{ paddingHorizontal: 8, paddingVertical: 12, marginTop: isAndroid15 ? 25 : 0 }}>
                    <View style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Icon name="people" type="material" size={20} color="#00FFFF" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#00FFFF', fontSize: 16, fontWeight: 'bold' }}>Nhân viên điểm danh: {team}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="event" type="material" size={20} color="#FFFF00" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#FFFF00', fontSize: 16, fontWeight: 'bold' }}>Ngày: {homNay}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                    <FlatList
                        data={diemDanhNv}
                        keyExtractor={(item, index) => index.toString()}
                        horizontal={false}
                        numColumns={2}
                        renderItem={ItemView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 16 }}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

export default DsNvDiemDanh;