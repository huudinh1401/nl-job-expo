import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Alert, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiHistoryJobOfUser } from '../../services/apiService';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const JobHistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [userID, setUserID] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false };
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                if (id) {
                    setUserID(id);
                    await getHistoryUser(id);
                }
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await getHistoryUser(userID);
        setRefreshing(false);
    };

    const getStatusColor = (status, end) => {
        if (status === 1) return '#f59e0b'; // amber - đang làm
        if (end) return '#10b981'; // emerald - đã xong  
        return '#ef4444'; // red - chưa nhận
    };

    const getStatusText = (status, end) => {
        if (status === 1) return 'Đang làm';
        if (end) return 'Đã xong';
        return 'Chưa nhận';
    };

    const getStatusIcon = (status, end) => {
        if (status === 1) return 'play-circle-outline';
        if (end) return 'checkmark-circle-outline';
        return 'pause-circle-outline';
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '--:--';
        try {
            const startTime = new Date(`2000-01-01 ${start}`);
            const endTime = new Date(`2000-01-01 ${end}`);
            const diff = endTime - startTime;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        } catch (error) {
            return '--:--';
        }
    };

    const getHistoryUser = async (id) => {
        const currentDate = new Date();
        const date30DaysAgo = new Date();
        date30DaysAgo.setDate(currentDate.getDate() - 30);
        try {
            const res = await apiHistoryJobOfUser(id);
            const filteredData = res.data.filter((record) => {
                const recordDate = new Date(record.createdAt);
                return recordDate >= date30DaysAgo && recordDate <= currentDate;
            });
            setHistory(filteredData);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    };

    const formatDate = (createdAt) => {
        const date = new Date(createdAt);
        return date.toLocaleDateString("vi-VN");
    };

    const ItemView = ({ item, index }) => (
        <View style={{marginHorizontal: 10, marginVertical: 8, backgroundColor: '#1e293b', borderRadius: 16, shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden'}}>
            {/* Number Badge */}
            <View style={{position: 'absolute', top: 3, left: 3, width: 24, height: 24, backgroundColor: '#3b82f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 4, elevation: 8}}>
                <Text style={{color: 'white', fontSize: 12, fontWeight: '700'}}>{index + 1}</Text>
            </View>

            {/* Status Badge */}
            <View style={{position: 'absolute', top: 12, right: 12, backgroundColor: getStatusColor(item.status, item.end), paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', zIndex: 10}}>
                <Ionicons name={getStatusIcon(item.status, item.end)} size={14} color="white" style={{marginRight: 6}} />
                <Text style={{color: 'white', fontSize: 12, fontWeight: '600'}}>{getStatusText(item.status, item.end)}</Text>
            </View>

            {/* Content */}
            <View style={{padding: 8, paddingTop: 24, backgroundColor: 'transparent'}}>
                {/* Job Content */}
                <View style={{marginBottom: 16, backgroundColor: 'transparent'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent', marginLeft: 12}}>
                        <Ionicons name="briefcase-outline" size={16} color="#3b82f6" style={{marginRight: 8}} />
                        <Text style={{fontSize: 14, fontWeight: '600', color: '#3b82f6'}}>Nội dung công việc</Text>
                    </View>
                    <Text style={{fontSize: 15, color: 'white', lineHeight: 22, fontWeight: '500'}}>{item.noi_dung}</Text>
                </View>

                {/* Note Section */}
                {item.note && (
                    <View style={{marginBottom: 16, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: 'transparent'}}>
                            <Ionicons name="document-text-outline" size={14} color="#3b82f6" style={{marginRight: 6}} />
                            <Text style={{fontSize: 12, fontWeight: '600', color: '#3b82f6'}}>Ghi chú</Text>
                        </View>
                        <Text style={{fontSize: 14, color: '#cbd5e1', lineHeight: 20}}>{item.note}</Text>
                    </View>
                )}

                {/* Divider */}
                <View style={{height: 1, backgroundColor: '#334155', marginBottom: 16}} />

                {/* Time Info Grid */}
                <View style={{backgroundColor: 'transparent'}}>
                    <View style={{flexDirection: 'row', marginBottom: 12, backgroundColor: 'transparent'}}>
                        {/* Date */}
                        <View style={{flex: 1, alignItems: 'center', backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, backgroundColor: 'transparent'}}>
                                <Ionicons name="calendar-outline" size={14} color="#94a3b8" style={{marginRight: 4}} />
                                <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: '500'}}>Ngày</Text>
                            </View>
                            <Text style={{fontSize: 13, color: '#f59e0b', fontWeight: '600', textAlign: 'center'}}>{formatDate(item.createdAt)}</Text>
                        </View>

                        {/* Start Time */}
                        <View style={{flex: 1, alignItems: 'center', backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, backgroundColor: 'transparent'}}>
                                <Ionicons name="play-outline" size={14} color="#94a3b8" style={{marginRight: 4}} />
                                <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: '500'}}>Bắt đầu</Text>
                            </View>
                            <Text style={{fontSize: 13, color: '#10b981', fontWeight: '600', textAlign: 'center'}}>{item.start || '--:--'}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection: 'row', backgroundColor: 'transparent'}}>
                        {/* End Time */}
                        <View style={{flex: 1, alignItems: 'center', backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, backgroundColor: 'transparent'}}>
                                <Ionicons name="stop-outline" size={14} color="#94a3b8" style={{marginRight: 4}} />
                                <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: '500'}}>Kết thúc</Text>
                            </View>
                            <Text style={{fontSize: 13, color: '#f97316', fontWeight: '600', textAlign: 'center'}}>{item.end || '--:--'}</Text>
                        </View>

                        {/* Duration */}
                        <View style={{flex: 1, alignItems: 'center', backgroundColor: 'transparent'}}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4, backgroundColor: 'transparent'}}>
                                <Ionicons name="time-outline" size={14} color="#94a3b8" style={{marginRight: 4}} />
                                <Text style={{fontSize: 12, color: '#94a3b8', fontWeight: '500'}}>Thời gian</Text>
                            </View>
                            <Text style={{fontSize: 13, color: '#a855f7', fontWeight: '600', textAlign: 'center'}}>
                                {item.start && item.end ? calculateDuration(item.start, item.end) : '--:--'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderEmptyList = () => (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, backgroundColor: 'transparent'}}>
            <Ionicons name="document-text-outline" size={64} color="#64748b" style={{marginBottom: 16}} />
            <Text style={{fontSize: 18, fontWeight: '600', color: '#94a3b8', marginBottom: 8}}>Chưa có lịch sử công việc</Text>
            <Text style={{fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 40}}>Lịch sử 30 ngày gần nhất sẽ hiển thị tại đây</Text>
        </View>
    );

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#0f172a'}}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Header */}
            <View style={{paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 130, 246, 0.2)', backgroundColor: 'transparent', marginTop: isAndroid15 ? 20 : 0}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent'}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent'}}>
                        <Ionicons name="time-outline" size={24} color="#3b82f6" style={{marginRight: 12}} />
                        <Text style={{fontSize: 16, fontWeight: '700', color: 'white'}}>Lịch sử công việc</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 18}}>
                        <Ionicons name="chevron-back-outline" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Card */}
            <View style={{margin: 10, backgroundColor: '#1e293b', borderRadius: 16, padding: 20, shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 12, borderWidth: 1, borderColor: '#334155'}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent'}}>
                    <View style={{backgroundColor: 'transparent'}}>
                        <Text style={{fontSize: 16, fontWeight: '600', color: 'white', marginBottom: 4}}>Tổng công việc (30 ngày)</Text>
                        <Text style={{fontSize: 28, fontWeight: '700', color: '#3b82f6'}}>{history.length}</Text>
                    </View>
                    <View style={{backgroundColor: '#3b82f6', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center'}}>
                        <Ionicons name="bar-chart-outline" size={28} color="white" />
                    </View>
                </View>
            </View>

            {/* List */}
            <View style={{flex: 1, backgroundColor: 'transparent'}}>
                <FlatList
                    data={history}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={ItemView}
                    ListEmptyComponent={renderEmptyList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#3b82f6"
                            colors={["#3b82f6"]}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 20, flexGrow: 1}}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </SafeAreaView>
    );
};

export default JobHistoryScreen;
