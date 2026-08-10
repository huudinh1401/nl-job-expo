import React, { useState, useEffect } from 'react';
import { Text, View, Image, Alert, TouchableOpacity, FlatList, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../../services/socketService';
import { apiGetJobWorkingMayTinh } from '../../services/apiService';

const JobWorkingMayTinhScreen = () => {
    const [dataJobWorkingMayTinh, setDataWorkingMayTinh] = useState([]);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        getJobWorkingMayTinh();
        if (!socket.connected) {
            socket.connect();
        }
        socket.on('job', (data) => {
            getJobWorkingMayTinh();
        });
        return () => {
            socket.off('job');
        };
    }, []);

    const getJobWorkingMayTinh = async () => {
        try {
            const data = await apiGetJobWorkingMayTinh();
            setDataWorkingMayTinh(data.data);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    };

    const handleViewMap = (name, toaDo) => {
        if (toaDo && toaDo.length >= 2) {
            const lat = toaDo[0];
            const lng = toaDo[1];
            const url = Platform.select({
                ios: `maps:0,0?q=${lat},${lng}`,
                android: `geo:0,0?q=${lat},${lng}(${name})`
            });
            Linking.openURL(url).catch(() => {
                const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
                Linking.openURL(webUrl);
            });
        }
    };

    const ItemView = ({ item, index }) => {
        return (
            <View style={{ width: '100%', marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
                <View style={{ flexDirection: 'row', padding: 16, alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', marginRight: 16 }}>
                        <Image source={{ uri: item.avatar }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#3b82f6' }} />
                        <Text style={{ color: '#059669', fontSize: 12, textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>{item.name}</Text>
                    </View>
                    <View style={{ width: 1, height: 80, backgroundColor: '#e2e8f0', marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                        <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 }}>
                            <Text style={{ color: '#1e40af', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>{item.start}</Text>
                        </View>
                        <Text style={{ color: '#334155', fontSize: 14, lineHeight: 20, fontWeight: '500' }}>{item.noi_dung}</Text>
                    </View>
                    <TouchableOpacity style={{ marginLeft: 12, backgroundColor: '#3b82f6', padding: 8, borderRadius: 12 }} onPress={() => handleViewMap(item.name, item.toa_do)} activeOpacity={0.7}>
                        <Ionicons name="location-outline" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 4 }}>
                {dataJobWorkingMayTinh.length > 0 ? (
                    <FlatList data={dataJobWorkingMayTinh} keyExtractor={(item, index) => index.toString()} renderItem={ItemView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }} />
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="desktop-outline" size={60} color="#cbd5e1" />
                        <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' }}>Không có công việc máy tính</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 5, textAlign: 'center' }}>Danh sách trống</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default JobWorkingMayTinhScreen;
