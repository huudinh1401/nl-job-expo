import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, View, Modal, Image, Alert, ActivityIndicator, TouchableOpacity, StatusBar, FlatList } from 'react-native';
import socket from '../../../config/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGetJobWorkingMayTinh } from '../../../config/apiService';
import { isTablet, width, height } from '../../../config/deviceConfig';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const JobMayTinh = ({ navigation }) => {
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [nameMap, setNameMap] = useState('');
    const [dataJobWorkingMayTinh, setDataWorkingMayTinh] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

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
            socket.disconnect();
        };
    }, []);

    const getJobWorkingMayTinh = async () => {
        try {
            const data = await apiGetJobWorkingMayTinh();
            setDataWorkingMayTinh(data.data)
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }

    const handleViewMap = (name, toaDo) => {
        setModalVisible(true)
        setNameMap(name)
        setLatitude(toaDo[0])
        setLongitude(toaDo[1])
    }

    const ItemView = ({ item, index }) => {
        return (
            <View style={{ width: '100%', marginBottom: 12, backgroundColor: '#475569', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}>
                <TouchableOpacity
                    style={{ flexDirection: 'row', padding: 16, alignItems: 'center' }}
                    onPress={() => handleViewMap(item.name, item.toa_do)}
                    activeOpacity={0.7}
                >
                    <View style={{ alignItems: 'center', marginRight: 16 }}>
                        <Image source={{ uri: item.avatar }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#3b82f6' }} />
                        <Text style={{ color: '#10b981', fontSize: isTablet ? 16 : 12, textAlign: 'center', fontWeight: 'bold', marginTop: 8 }}>{item.name}</Text>
                    </View>

                    <View style={{ width: 1, height: 80, backgroundColor: '#64748b', marginRight: 16 }} />

                    <View style={{ flex: 1 }}>
                        <View style={{ backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 12 }}>
                            <Text style={{ color: '#06b6d4', fontSize: isTablet ? 16 : 14, textAlign: 'center', fontWeight: '600' }}>{item.start}</Text>
                        </View>
                        <Text style={{ color: '#f1f5f9', fontSize: isTablet ? 16 : 14, lineHeight: 20, fontWeight: '500' }}>{item.noi_dung}</Text>
                    </View>

                    <View style={{ marginLeft: 12, backgroundColor: '#3b82f6', width: 8, height: 8, borderRadius: 4 }} />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 4 }}>
                <FlatList
                    data={dataJobWorkingMayTinh}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={ItemView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            </View>
            <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => { setModalVisible(!modalVisible) }}
                animationType="fade"
            >
                <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <View style={{ position: "absolute", zIndex: 10, width: '100%', alignItems: 'center', top: 60 }}>
                        <TouchableOpacity
                            style={{ width: isTablet ? 48 : 40, height: isTablet ? 48 : 40, backgroundColor: '#ef4444', borderRadius: isTablet ? 24 : 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}
                            onPress={() => { setModalVisible(!modalVisible) }}
                            activeOpacity={0.8}
                        >
                            <Text style={{ fontSize: isTablet ? 24 : 20, color: 'white', fontWeight: 'bold' }}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <MapView
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: latitude,
                            longitude: longitude,
                            latitudeDelta: 0.0422,
                            longitudeDelta: 0.0221,
                        }}
                    >
                        <Marker
                            coordinate={{ latitude: latitude, longitude: longitude }}
                            title={nameMap}
                        >
                            <Image source={require('../../../assets/images/icon/iconMap.png')} style={{ height: isTablet ? 60 : 60, width: isTablet ? 60 : 60 }} />
                        </Marker>
                    </MapView>
                </View>
            </Modal>
        </View>
    );
}

export default JobMayTinh;