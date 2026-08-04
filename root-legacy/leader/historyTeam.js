import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, FlatList, TextInput, SafeAreaView, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Icon } from 'react-native-elements';
import { isTablet, width, height } from '../../config/deviceConfig';
import { apiGetJobHistory, apiSearchJobTheoNgayVaTeam } from '../../config/apiService';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const HistoryTeam = ({ navigation, team, getHistory, history, setHistory, valueDate, setValueDate }) => {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    useFocusEffect(
        useCallback(() => {
            getHistory();
        }, [getHistory])
    );

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, [history]);

    const ItemView = ({ item, index }) => {
        return (
            <View style={{ width: '100%', marginBottom: 8, backgroundColor: '#475569', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, position: 'relative' }}>
                <View style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, backgroundColor: '#1e293b', borderRadius: isTablet ? 20 : 16, width: isTablet ? 40 : 32, height: isTablet ? 40 : 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3b82f6' }}>
                    <Text style={{ color: '#3b82f6', fontSize: isTablet ? 16 : 12, fontWeight: 'bold' }}>{index + 1}</Text>
                </View>

                <TouchableOpacity style={{ padding: 16, paddingTop: 24 }} activeOpacity={0.7}>
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ color: '#06b6d4', fontSize: isTablet ? 18 : 14, textAlign: 'center', fontWeight: 'bold' }}>{item.name}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', marginBottom: 12, minHeight: 60 }}>
                        <View style={{ flex: 6, paddingRight: 12 }}>
                            <Text style={{ color: '#f1f5f9', fontSize: isTablet ? 16 : 14, lineHeight: 20, fontWeight: '500' }}>{item.noi_dung}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: '#64748b', marginHorizontal: 8 }} />
                        <View style={{ flex: 4, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: 'yellow', fontSize: isTablet ? 14 : 12 }}>{item.note}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                        <View style={{ backgroundColor: '#065f46', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}>
                            <Text style={{ color: '#10b981', fontSize: isTablet ? 14 : 12, fontWeight: '600' }}>Bắt đầu</Text>
                            <Text style={{ color: '#10b981', fontSize: isTablet ? 16 : 14, fontWeight: 'bold', marginTop: 2 }}>{item.start}</Text>
                        </View>
                        {
                            item.end ?
                                <View style={{ backgroundColor: '#7c2d12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center' }}>
                                    <Text style={{ color: '#f97316', fontSize: isTablet ? 14 : 12, fontWeight: '600' }}>Kết thúc</Text>
                                    <Text style={{ color: '#f97316', fontSize: isTablet ? 16 : 14, fontWeight: 'bold', marginTop: 2 }}>{item.end}</Text>
                                </View>
                                :
                                <View style={{ backgroundColor: '#7c7c12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#16e6f9', fontSize: isTablet ? 14 : 12, fontWeight: '600' }}>Đang làm</Text>
                                </View>
                        }

                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const handleConfirm = async (date) => {
        const formattedDate = date.toISOString().split("T")[0];
        setValueDate(formattedDate);
        try {
            let allData = [];

            if (team === 'Dự án') {
                // Nếu là team Dự án, lấy dữ liệu của tất cả 3 team khác
                const otherTeams = ['Máy tính', 'Công trình', 'Photocopy'];
                const searchPromises = otherTeams.map(teamName =>
                    apiSearchJobTheoNgayVaTeam(formattedDate, teamName)
                );

                const results = await Promise.all(searchPromises);

                // Gộp tất cả dữ liệu lại
                results.forEach(res => {
                    if (res.data) {
                        allData = [...allData, ...res.data];
                    }
                });
            } else {
                // Các team khác giữ nguyên logic cũ
                const res = await apiSearchJobTheoNgayVaTeam(formattedDate, team);
                allData = res.data || [];
            }

            setHistory([...allData]);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
        hideDatePicker();
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />

                <View style={{ paddingHorizontal: 10, paddingVertical: 10, marginTop: isAndroid15 ? 25 : 0 }}>
                    <View style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="history" type="material" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#3b82f6', fontSize: 16, fontWeight: 'bold' }}>Lịch sử công việc: {team}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', borderRadius: 12, padding: 6 }}>
                        <TextInput
                            style={{ color: '#f1f5f9', fontWeight: '600', backgroundColor: '#1e293b', padding: 12, flex: 1, marginRight: 8, borderRadius: 8, textAlign: 'center', borderWidth: 1, borderColor: '#475569' }}
                            placeholder='Chọn ngày, tháng, năm...'
                            placeholderTextColor='#64748b'
                            value={valueDate}
                            editable={false}
                        />
                        <TouchableOpacity
                            onPress={showDatePicker}
                            style={{ backgroundColor: '#3b82f6', padding: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                            activeOpacity={0.8}
                        >
                            <Icon name="calendar-number" type='ionicon' size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <DateTimePickerModal
                        isVisible={isDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                        display="spinner"
                    />
                </View>

                <View style={{ flex: 1, paddingHorizontal: 10 }}>
                    <FlatList
                        data={history}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        renderItem={ItemView}
                        extraData={history}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 12 }}
                    />
                </View>
            </SafeAreaView>
        </View>
    );
}

export default HistoryTeam;