import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, Keyboard, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const ModalSelectEmployee = ({ setVisibleModalSelectNV, users, handleGiaoJob, setText, text }) => {
    const handleSelectNV = (id, name, deviceToken) => {
        Alert.alert('Xác nhận giao việc', `Bạn muốn giao việc:\n${text}\ncho ${name}?`, [
            { text: 'Hủy', style: 'cancel' },
            { text: 'OK', onPress: () => handleGiaoJob(id, deviceToken) }
        ]);
    };

    const handleExitModal = () => {
        Alert.alert('Xác nhận bạn đã giao việc xong', 'Bấm Ok để đóng!', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'OK', onPress: () => { setVisibleModalSelectNV(false); setText(''); } }
        ]);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 0:
                return { text: 'Sẵn sàng', color: '#10b981', bgColor: '#065f46', icon: 'check-circle', disabled: false };
            case -1:
                return { text: 'Có việc chưa nhận', color: '#3b82f6', bgColor: '#1e40af', icon: 'pending', disabled: true };
            default:
                return { text: 'Đang làm việc', color: '#94a3b8', bgColor: '#475569', icon: 'work', disabled: true };
        }
    };

    const ItemView = ({ item, index }) => {
        const statusInfo = getStatusInfo(item.status);

        return (
            <View style={{width: (width - 22) / 2, height: 100, margin: 3, backgroundColor: '#2d3748', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, opacity: statusInfo.disabled ? 0.6 : 1}}>
                <TouchableOpacity style={{flex: 1, padding: 12, justifyContent: 'space-between'}} disabled={statusInfo.disabled} onPress={() => { Keyboard.dismiss(); handleSelectNV(item.id, item.username, item.device_token); }} activeOpacity={0.7}>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: '#f1f5f9', fontSize: isTablet ? 18 : 14, textAlign: 'center', fontWeight: 'bold'}}>{item.username}</Text>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: statusInfo.bgColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8}}>
                        <MaterialIcons name={statusInfo.icon} size={16} color={statusInfo.color} style={{marginRight: 4}} />
                        <Text style={{color: statusInfo.color, fontSize: isTablet ? 14 : 10, textAlign: 'center', fontWeight: '600'}}>{statusInfo.text}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={{width: width - 6, height: height - 100, marginHorizontal: 3, marginVertical: 40, backgroundColor: 'rgba(15, 20, 25, 0.95)', borderRadius: 20, overflow: 'hidden', elevation: 10}}>
            <View style={{backgroundColor: '#1a202c', paddingVertical: 16, paddingHorizontal: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <MaterialIcons name="people" size={24} color="#06b6d4" style={{marginRight: 8}} />
                    <Text style={{color: '#06b6d4', fontSize: 18, fontWeight: 'bold'}}>Danh sách nhân viên</Text>
                </View>
                <Text style={{color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 4}}>Chọn nhân viên để giao việc</Text>
            </View>

            <View style={{flex: 1, padding: 2, marginTop: 5}}>
                <FlatList data={users} keyExtractor={(item, index) => index.toString()} horizontal={false} numColumns={2} renderItem={ItemView} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 16}} />
            </View>

            <View style={{padding: 16, borderTopWidth: 1, borderTopColor: '#1a202c'}}>
                <TouchableOpacity style={{width: '100%', justifyContent: 'center', alignItems: 'center', height: 50, backgroundColor: '#f97316', borderRadius: 12, flexDirection: 'row', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3}} onPress={() => handleExitModal()} activeOpacity={0.8}>
                    <MaterialIcons name="close" size={20} color="white" style={{marginRight: 8}} />
                    <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold'}}>Đóng</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default ModalSelectEmployee;
