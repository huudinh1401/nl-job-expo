import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity,
    StatusBar, Alert, Platform, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { apiBangChamCong } from '../../services/apiService';
import dateTime from '../../services/dateTime';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const BangChamCongScreen = ({ navigation }) => {
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [valueDate, setValueDate] = useState('');

    const [totalSoPhutVao, setTotalSoPhutVao] = useState(0);
    const [totalSoPhutRa, setTotalSoPhutRa] = useState(0);
    const [totalTongPhut, setTotalTongPhut] = useState(0);
    const [totalNgayCong, setTotalNgayCong] = useState(0);

    const [thang, setThang] = useState(new Date().getMonth() + 1);
    const [nam, setNam] = useState(new Date().getFullYear());
    const [nameNV, setNameNV] = useState('');
    const [dataChamCong, setDataChamcong] = useState([]);
    const [userID, setUserID] = useState(null);
    const [page, setPage] = useState(0);
    const [itemsPerPage] = useState(7);

    const from = page * itemsPerPage;
    const to = Math.min((page + 1) * itemsPerPage, dataChamCong.length);
    const totalPages = Math.ceil(dataChamCong.length / itemsPerPage);

    // Tạo danh sách tháng và năm cho picker
    const generateMonthYearList = () => {
        const currentYear = new Date().getFullYear();
        const list = [];
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            for (let month = 1; month <= 12; month++) {
                list.push({
                    year,
                    month,
                    label: `Tháng ${month} / ${year}`,
                    value: `${month}-${year}`
                });
            }
        }
        return list.reverse();
    };

    const monthYearList = generateMonthYearList();

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false };
        setPage(0);
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');

                // Sử dụng userID thật từ AsyncStorage
                if (id) {
                    setUserID(id);
                    await getChamCong(id, thang, nam);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();
    }, [itemsPerPage]);

    const getChamCong = async (id, thang, nam) => {
        try {
            const res = await apiBangChamCong(id, thang, nam);

            if (res.data && res.data.length > 0) {
                setNameNV(res.data[0].username);
            } else {
                setNameNV('Không có dữ liệu');
            }

            const daysInMonth = new Date(nam, thang, 0).getDate();
            const daysOfWeek = [
                'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư',
                'Thứ năm', 'Thứ sáu', 'Thứ bảy'
            ];
            const today = new Date();

            // Reset các biến tổng
            let totalSoPhutVao = 0;
            let totalSoPhutRa = 0;
            let totalTongPhut = 0;
            let totalNgayCong = 0;
            setTotalSoPhutVao(0);
            setTotalSoPhutRa(0);
            setTotalTongPhut(0);
            setTotalNgayCong(0);
            setDataChamcong([]);

            const newArray = Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const existingData = res.data.find(item => {
                    const itemDate = new Date(item.createdAt);
                    return itemDate.getDate() === day && itemDate.getMonth() + 1 === thang && itemDate.getFullYear() === nam;
                });
                const dayOfWeek = new Date(nam, thang - 1, day).getDay();

                if (existingData) {
                    const soPhutVao = dateTime.tinhSoPhutVao(existingData.thoiGianVao);
                    const soPhutRa = existingData.thoiGianRa ? dateTime.tinhSoPhutRa(existingData.thoiGianRa) : 0;
                    const tongPhut = existingData.thoiGianRa ? soPhutVao + soPhutRa : 0;
                    const ngayCong = existingData.thoiGianRa ?
                        (dateTime.tinhThoiGianLam(formatTime(existingData.thoiGianVao), formatTime(existingData.thoiGianRa)) > 6 ? 1 : 0.5) : 0;

                    totalSoPhutVao += soPhutVao;
                    totalSoPhutRa += soPhutRa;
                    totalTongPhut += tongPhut;
                    totalNgayCong += ngayCong;

                    return {
                        key: existingData.id,
                        ngay: formatDate(existingData.createdAt),
                        gioVao: formatTime(existingData.thoiGianVao),
                        gioRa: existingData.thoiGianRa ? formatTime(existingData.thoiGianRa) : '',
                        soPhutVao, soPhutRa, tongPhut, ngayCong,
                        thu: daysOfWeek[dayOfWeek]
                    };
                } else {
                    return {
                        key: day,
                        ngay: formatDate(new Date(nam, thang - 1, day)),
                        gioVao: '', gioRa: '',
                        soPhutVao: 0, soPhutRa: 0, tongPhut: 0, ngayCong: 0,
                        thu: daysOfWeek[dayOfWeek]
                    };
                }
            });

            const filteredArray = newArray
                .filter(item => {
                    const itemDate = new Date(item.ngay.split('/').reverse().join('-'));
                    return itemDate <= today;
                })
                .sort((a, b) => {
                    const dateA = new Date(a.ngay.split('/').reverse().join('-'));
                    const dateB = new Date(b.ngay.split('/').reverse().join('-'));
                    return dateB - dateA;
                });

            setDataChamcong(filteredArray);
            setTotalSoPhutVao(totalSoPhutVao);
            setTotalSoPhutRa(totalSoPhutRa);
            setTotalTongPhut(totalTongPhut);
            setTotalNgayCong(totalNgayCong);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    };

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirm = (selectedItem) => {
        setValueDate(selectedItem.label);
        setThang(selectedItem.month);
        setNam(selectedItem.year);
        getChamCong(userID, selectedItem.month, selectedItem.year);
        hideDatePicker();
    };

    const renderTableHeader = () => (
        <View style={{flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0'}}>
            <Text style={{width: 80, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Ngày</Text>
            <Text style={{width: 60, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Thứ</Text>
            <Text style={{width: 60, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Giờ vào</Text>
            <Text style={{width: 60, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Giờ ra</Text>
            <Text style={{width: 70, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Phút vào</Text>
            <Text style={{width: 70, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Phút ra</Text>
            <Text style={{width: 70, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Tổng phút</Text>
            <Text style={{width: 70, color: '#1e293b', fontWeight: '700', fontSize: 12, textAlign: 'center'}}>Ngày công</Text>
        </View>
    );

    const renderTableRow = ({ item, index }) => (
        <View style={{flexDirection: 'row', backgroundColor: item.thu === 'Chủ nhật' ? '#fef3c7' : index % 2 === 0 ? '#ffffff' : '#f8fafc', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0'}}>
            <Text style={{width: 80, color: '#1e293b', fontSize: 11, fontWeight: item.thu === 'Chủ nhật' ? '600' : '500', textAlign: 'center'}}>
                {item.ngay}
            </Text>
            <Text style={{width: 60, color: item.thu === 'Chủ nhật' ? '#dc2626' : '#1e293b', fontSize: 11, fontWeight: item.thu === 'Chủ nhật' ? '600' : '500', textAlign: 'center'}}>
                {item.thu}
            </Text>
            <Text style={{width: 60, color: item.gioVao ? '#059669' : '#64748b', fontSize: 11, fontWeight: '500', textAlign: 'center'}}>
                {item.gioVao || '-'}
            </Text>
            <Text style={{width: 60, color: item.gioRa ? '#dc2626' : '#64748b', fontSize: 11, fontWeight: '500', textAlign: 'center'}}>
                {item.gioRa || '-'}
            </Text>
            <Text style={{width: 70, color: item.soPhutVao > 0 ? '#1e40af' : '#64748b', fontSize: 11, fontWeight: '500', textAlign: 'center'}}>
                {item.soPhutVao || 0}
            </Text>
            <Text style={{width: 70, color: item.soPhutRa > 0 ? '#1e40af' : '#64748b', fontSize: 11, fontWeight: '500', textAlign: 'center'}}>
                {item.soPhutRa || 0}
            </Text>
            <Text style={{width: 70, color: item.tongPhut > 0 ? '#059669' : '#64748b', fontSize: 11, fontWeight: '600', textAlign: 'center'}}>
                {item.tongPhut || 0}
            </Text>
            <Text style={{width: 70, color: item.ngayCong > 0 ? '#dc2626' : '#64748b', fontSize: 11, fontWeight: '600', textAlign: 'center'}}>
                {item.ngayCong || 0}
            </Text>
        </View>
    );

    const renderDatePickerModal = () => (
        <Modal visible={isDatePickerVisible} transparent={true} animationType="slide" onRequestClose={hideDatePicker}>
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
                <View style={{backgroundColor: '#ffffff', margin: 20, borderRadius: 20, padding: 20, width: '90%', maxHeight: '70%'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20}}>
                        <Text style={{fontSize: 18, fontWeight: '700', color: '#1e293b'}}>Chọn tháng và năm</Text>
                        <TouchableOpacity onPress={hideDatePicker} style={{backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 20}}>
                            <Ionicons name='close' size={20} color='#1e293b' />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={monthYearList}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: (item.month === thang && item.year === nam) ? '#dbeafe' : 'transparent'}}
                                onPress={() => handleConfirm(item)}
                            >
                                <Text style={{fontSize: 16, color: (item.month === thang && item.year === nam) ? '#1e40af' : '#1e293b', fontWeight: (item.month === thang && item.year === nam) ? '600' : '400'}}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#f8fafc'}}>
            <StatusBar barStyle='dark-content' backgroundColor="#1e40af" />

            {/* Header */}
            <View style={{backgroundColor: '#1e40af', paddingHorizontal: 10, paddingBottom: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingTop: isAndroid15 ? 25 : 10, elevation: 2}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e40af'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e40af'}}>
                        <View style={{backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 12, borderRadius: 15, marginRight: 15}}>
                            <Ionicons name="calendar-outline" size={20} color="white" />
                        </View>
                        <View style={{backgroundColor: '#1e40af'}}>
                            <Text style={{fontSize: 18, fontWeight: '800', color: 'white'}}>Bảng Chấm Công</Text>
                            <Text style={{fontSize: 12, color: 'rgba(255, 255, 255, 0.9)'}}>Quản lý thời gian làm việc</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 10, borderRadius: 12}}>
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{flex: 1, backgroundColor: '#f8fafc'}} showsVerticalScrollIndicator={false}>
                {/* Date Picker Section */}
                <View style={{marginHorizontal: 7, marginTop: 5, backgroundColor: '#ffffff', borderRadius: 20, padding: 15, elevation: 3, borderWidth: 1, borderColor: '#e2e8f0'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#ffffff'}}>
                        <Ionicons name="filter-outline" size={20} color="#1e40af" style={{marginRight: 8}} />
                        <Text style={{fontSize: 16, fontWeight: '600', color: '#1e40af'}}>Lọc theo thời gian</Text>
                    </View>

                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff'}}>
                        <View style={{flex: 1, marginRight: 15}}>
                            <TextInput
                                style={{backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14, color: '#1e293b', fontWeight: '500'}}
                                placeholder='Chọn tháng và năm...'
                                placeholderTextColor='#64748b'
                                value={valueDate}
                                editable={false}
                            />
                        </View>

                        <TouchableOpacity
                            onPress={showDatePicker}
                            style={{backgroundColor: '#1e40af', padding: 12, borderRadius: 15, elevation: 3}}
                        >
                            <Ionicons name="calendar" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Employee Info */}
                {nameNV ? (
                    <View style={{marginHorizontal: 7, marginTop: 5, backgroundColor: '#ffffff', borderRadius: 16, padding: 10, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff'}}>
                            <View style={{backgroundColor: '#dbeafe', padding: 10, borderRadius: 12, marginRight: 12}}>
                                <Ionicons name="person" size={20} color="#1e40af" />
                            </View>
                            <Text style={{fontSize: 16, fontWeight: '600', color: '#1e293b', flex: 1}}>Nhân viên: {nameNV}</Text>
                        </View>
                    </View>
                ) : null}

                {/* Data Table */}
                <View style={{marginHorizontal: 7, marginTop: 5, backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden', elevation: 2, borderWidth: 1, borderColor: '#e2e8f0'}}>
                    <View style={{backgroundColor: '#1e40af', paddingVertical: 15, paddingHorizontal: 20}}>
                        <Text style={{fontSize: 16, fontWeight: '700', color: 'white', textAlign: 'center'}}>Chi Tiết Chấm Công</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{minWidth: 540}}>
                            {renderTableHeader()}
                            <FlatList
                                data={dataChamCong.slice(from, to)}
                                keyExtractor={(item) => item.key.toString()}
                                renderItem={renderTableRow}
                                scrollEnabled={false}
                            />
                        </View>
                    </ScrollView>
                </View>

                {/* Statistics */}
                <View style={{marginHorizontal: 7, marginTop: 2, marginBottom: 5}}>
                    <View style={{backgroundColor: '#ffffff', borderRadius: 20, padding: 10, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5, backgroundColor: '#ffffff'}}>
                            <View style={{backgroundColor: '#dbeafe', padding: 10, borderRadius: 12, marginRight: 12}}>
                                <Ionicons name="analytics" size={20} color="#1e40af" />
                            </View>
                            <Text style={{fontSize: 16, fontWeight: '700', color: '#1e293b'}}>Thống Kê Tổng Hợp</Text>
                        </View>

                        <View style={{flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#ffffff'}}>
                            {/* Tổng phút vào */}
                            <View style={{width: '49%', backgroundColor: '#dbeafe', borderRadius: 15, padding: 15, marginRight: '1%', marginBottom: 5}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#dbeafe'}}>
                                    <Ionicons name="log-in" size={16} color="#1e40af" style={{marginRight: 5}} />
                                    <Text style={{fontSize: 12, color: '#1e40af', fontWeight: '600'}}>Tổng phút vào</Text>
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: '#1e40af', marginTop: 8}}>{totalSoPhutVao}</Text>
                            </View>

                            {/* Tổng phút ra */}
                            <View style={{width: '49%', backgroundColor: '#fecaca', borderRadius: 15, padding: 15, marginBottom: 5}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#fecaca'}}>
                                    <Ionicons name="log-out" size={16} color="#dc2626" style={{marginRight: 5}} />
                                    <Text style={{fontSize: 12, color: '#dc2626', fontWeight: '600'}}>Tổng phút ra</Text>
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: '#dc2626', marginTop: 8}}>{totalSoPhutRa}</Text>
                            </View>

                            {/* Tổng phút tăng ca */}
                            <View style={{width: '49%', backgroundColor: '#d1fae5', borderRadius: 15, padding: 15, marginRight: '1%'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5'}}>
                                    <Ionicons name="time" size={16} color="#059669" style={{marginRight: 5}} />
                                    <Text style={{fontSize: 12, color: '#059669', fontWeight: '600'}}>Phút tăng ca</Text>
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: '#059669', marginTop: 8}}>{totalTongPhut}</Text>
                            </View>

                            {/* Tổng ngày công */}
                            <View style={{width: '49%', backgroundColor: '#fef3c7', borderRadius: 15, padding: 15}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7'}}>
                                    <Ionicons name="calendar" size={16} color="#d97706" style={{marginRight: 5}} />
                                    <Text style={{fontSize: 12, color: '#d97706', fontWeight: '600'}}>Tổng ngày công</Text>
                                </View>
                                <Text style={{fontSize: 18, fontWeight: '700', color: '#d97706', marginTop: 8}}>{totalNgayCong}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pagination */}
                <View style={{marginHorizontal: 7, marginBottom: 10, backgroundColor: '#ffffff', borderRadius: 15, padding: 15, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0'}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                        <TouchableOpacity
                            onPress={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            style={{backgroundColor: page === 0 ? '#e2e8f0' : '#1e40af', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10}}
                        >
                            <Text style={{color: page === 0 ? '#64748b' : 'white', fontWeight: '600'}}>Trước</Text>
                        </TouchableOpacity>

                        <Text style={{color: '#1e293b', fontWeight: '600'}}>
                            {from + 1}-{to} của {dataChamCong.length}
                        </Text>

                        <TouchableOpacity
                            onPress={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            style={{backgroundColor: page >= totalPages - 1 ? '#e2e8f0' : '#1e40af', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10}}
                        >
                            <Text style={{color: page >= totalPages - 1 ? '#64748b' : 'white', fontWeight: '600'}}>Sau</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {renderDatePickerModal()}
        </SafeAreaView>
    );
}

export default BangChamCongScreen;