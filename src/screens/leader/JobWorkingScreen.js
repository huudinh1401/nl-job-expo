import React, { useState, useEffect } from 'react';
import { Text, View, Modal, TouchableWithoutFeedback, Image, Alert, ActivityIndicator, TouchableOpacity, StatusBar, TextInput, FlatList, Keyboard, Platform, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { apiGetCongTrinhViecMoi, apiGetMayTinhViecMoi, apiGetPhotoViecMoi, apiDeleteJob, apiUpdateNoiDung, apiUpdateStatusUser, apiPushNotiSuper } from '../../services/apiService';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const JobWorkingScreen = ({ navigation, team }) => {
    const [dataJobWorking, setDataWorking] = useState([]);
    const [modalEdit, setModalEdit] = useState(false);
    const [jobOld, setJobOld] = useState('');
    const [jobNew, setJobNew] = useState('');
    const [idJob, setIdJob] = useState('');
    const [idUser, setIdUser] = useState('');
    const [deviceToken, setDeviceToken] = useState('');
    const [isLoadingEditJob, setIsLoadingEditJob] = useState(false);

    useEffect(() => {
        getJobWorking();
    }, [team]);

    const getJobWorking = async () => {
        try {
            if (team === 'Máy tính') {
                const data = await apiGetMayTinhViecMoi();
                setDataWorking(data.data);
            } else if (team === 'Công trình') {
                const data = await apiGetCongTrinhViecMoi();
                setDataWorking(data.data);
            } else if (team === 'Photocopy') {
                const data = await apiGetPhotoViecMoi();
                setDataWorking(data.data);
            } else {
                const [mayTinhData, congTrinhData, photocopyData] = await Promise.all([
                    apiGetMayTinhViecMoi(),
                    apiGetCongTrinhViecMoi(),
                    apiGetPhotoViecMoi()
                ]);
                const combinedData = [
                    ...(mayTinhData.data || []),
                    ...(congTrinhData.data || []),
                    ...(photocopyData.data || [])
                ];
                setDataWorking(combinedData);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        }
    };

    const handleViewMap = (name, toaDo) => {
        if (toaDo && toaDo.length >= 2) {
            const lat = parseFloat(toaDo[0]);
            const lng = parseFloat(toaDo[1]);
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

    const handleDeleteJob = async (id, user_id, token) => {
        Alert.alert('Xác nhận xóa việc', 'Bạn chắc chắn muốn xóa việc này?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'OK', onPress: () => deleteJob(id, user_id, token) }
        ]);
    };

    const deleteJob = async (id, user_id, device_token) => {
        const notificationType = 'delete_job';
        const customMessage = 'Công việc của bạn đã bị HỦY BỎ bởi Đội trưởng!';
        try {
            await apiDeleteJob(id);
            getJobWorking();
            await updateStatusUser(user_id, 0);
            if (device_token) {
                await apiPushNotiSuper(device_token, notificationType, customMessage);
            }
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        }
    };

    const updateStatusUser = async (id, stt) => {
        try {
            await apiUpdateStatusUser(id, stt);
        } catch (error) {
            console.error('Lỗi cập nhật trạng thái user:', error);
        }
    };

    const handleOpenModalEdit = async (noiDung, idjob, iduser, token) => {
        setJobOld(noiDung);
        setIdJob(idjob);
        setIdUser(iduser);
        setDeviceToken(token);
        setModalEdit(true);
    };

    const editJob = async (idJob, idUser, device_token) => {
        const notificationType = 'edit_job';
        const customMessage = 'Nội dung công việc của bạn đã được cập nhật thay đổi!';
        try {
            await apiUpdateNoiDung(idJob, jobNew);
            getJobWorking();
            if (device_token) {
                await apiPushNotiSuper(device_token, notificationType, customMessage);
            }
            setModalEdit(false);
            setDeviceToken('');
            setIdJob('');
            setIdUser('');
            setJobNew('');
            setJobOld('');
        } catch (error) {
            console.error('Lỗi:', error);
            Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng.');
        } finally {
            setIsLoadingEditJob(false);
        }
    };

    const handleSubmitEditJob = async () => {
        setIsLoadingEditJob(true);
        Alert.alert('Xác nhận sửa việc', 'Bạn muốn thay đổi nội dung việc này?', [
            { text: 'Hủy', style: 'cancel', onPress: () => setIsLoadingEditJob(false) },
            { text: 'OK', onPress: () => editJob(idJob, idUser, deviceToken) }
        ]);
    };

    const ItemView = ({ item, index }) => {
        const isWorking = item.status === 1;
        
        return (
            <View style={{width: '100%', marginBottom: 12, backgroundColor: '#475569', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3}}>
                <View style={{flexDirection: 'row', paddingLeft: 5, alignItems: 'center', paddingTop: 5}}>
                    <View style={{alignItems: 'center', marginRight: 16}}>
                        <Image source={{uri: item.avatar}} style={{width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: '#10b981'}} />
                        <Text style={{color: '#16e6f9', fontSize: isTablet ? 16 : 12, textAlign: 'center', fontWeight: 'bold', marginTop: 8}}>{item.name}</Text>
                    </View>

                    <View style={{width: 1, height: 100, backgroundColor: '#64748b', marginRight: 10}} />

                    <View style={{flex: 1}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            {isWorking && <View style={{backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8}}>
                                <Text style={{color: '#06b6d4', fontSize: isTablet ? 14 : 12, fontWeight: '600'}}>{item.start}</Text>
                            </View>}
                            <View style={{backgroundColor: isWorking ? '#065f46' : '#1e40af', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}>
                                <Text style={{color: isWorking ? '#fbbf24' : '#06b6d4', fontSize: isTablet ? 14 : 12, fontWeight: '600'}}>{isWorking ? 'Đang làm' : 'Chưa nhận'}</Text>
                            </View>
                        </View>
                        <Text style={{color: '#f1f5f9', fontSize: isTablet ? 16 : 14, lineHeight: 20, fontWeight: '500', marginBottom: 12}}>{item.noi_dung}</Text>
                    </View>
                </View>
                
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 5, marginTop: 5}}>
                    {isWorking && <TouchableOpacity style={{backgroundColor: '#3b82f6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center'}} onPress={() => handleViewMap(item.name, item.toa_do)} activeOpacity={0.8}>
                        <MaterialIcons name="location-on" size={16} color="white" style={{marginRight: 4}} />
                        <Text style={{color: 'white', fontSize: 12, fontWeight: '600'}}>Vị trí</Text>
                    </TouchableOpacity>}
                    <TouchableOpacity style={{backgroundColor: '#f59e0b', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center'}} onPress={() => handleOpenModalEdit(item.noi_dung, item.id, item.user_id, item.device_token)} activeOpacity={0.8}>
                        <MaterialIcons name="edit" size={16} color="white" style={{marginRight: 4}} />
                        <Text style={{color: 'white', fontSize: 12, fontWeight: '600'}}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center'}} onPress={() => handleDeleteJob(item.id, item.user_id, item.device_token)} activeOpacity={0.8}>
                        <MaterialIcons name="delete" size={16} color="white" style={{marginRight: 4}} />
                        <Text style={{color: 'white', fontSize: 12, fontWeight: '600'}}>Xóa</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{flex: 1, backgroundColor: '#1e293b'}}>
            <SafeAreaView style={{flex: 1}}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />

                <View style={{paddingHorizontal: 5, paddingVertical: 8, marginTop: isAndroid15 ? 25 : 0}}>
                    <View style={{backgroundColor: '#334155', borderRadius: 12, padding: 16, marginBottom: 8}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
                            <MaterialIcons name="work" size={20} color="#3b82f6" style={{marginRight: 8}} />
                            <Text style={{color: '#3b82f6', fontSize: 16, fontWeight: 'bold'}}>Công việc đang thực hiện</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                            <MaterialIcons name="group" size={18} color="#10b981" style={{marginRight: 6}} />
                            <Text style={{color: '#10b981', fontSize: 14, fontWeight: '600'}}>Team: {team}</Text>
                        </View>
                    </View>
                </View>

                <View style={{flex: 1, paddingHorizontal: 5}}>
                    <FlatList data={dataJobWorking} keyExtractor={(item, index) => index.toString()} renderItem={ItemView} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 16}} />
                </View>

                <Modal visible={modalEdit} transparent={true} animationType={'slide'} onRequestClose={() => setModalEdit(!modalEdit)}>
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={{width: '100%', height: '100%', backgroundColor: 'rgba(15, 20, 25, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20}}>
                            <View style={{backgroundColor: '#334155', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10}}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
                                    <Text style={{color: '#f1f5f9', fontSize: 18, fontWeight: 'bold'}}>Chỉnh sửa công việc</Text>
                                    <TouchableOpacity style={{width: 32, height: 32, backgroundColor: '#ef4444', borderRadius: 16, alignItems: 'center', justifyContent: 'center'}} onPress={() => setModalEdit(!modalEdit)} activeOpacity={0.8}>
                                        <Text style={{fontSize: 18, color: 'white', fontWeight: 'bold'}}>×</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{marginBottom: 16}}>
                                    <Text style={{color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 8}}>Công việc cũ:</Text>
                                    <TextInput style={{height: 100, borderColor: '#475569', borderWidth: 1, padding: 12, textAlignVertical: 'top', fontSize: 14, color: '#64748b', borderRadius: 12, backgroundColor: '#1e293b', opacity: 0.7}} multiline={true} numberOfLines={4} value={jobOld} editable={false} />
                                </View>

                                <View style={{marginBottom: 20}}>
                                    <Text style={{color: '#94a3b8', fontSize: 14, fontWeight: '600', marginBottom: 8}}>Công việc mới:</Text>
                                    <TextInput style={{height: 100, borderColor: '#3b82f6', borderWidth: 2, padding: 12, textAlignVertical: 'top', fontSize: 14, color: '#f1f5f9', borderRadius: 12, backgroundColor: '#1e293b'}} multiline={true} numberOfLines={4} placeholder="Nhập nội dung công việc mới..." placeholderTextColor="#64748b" value={jobNew} onChangeText={(text) => setJobNew(text)} editable={true} />
                                </View>

                                <TouchableOpacity style={{width: '100%', height: 50, backgroundColor: '#10b981', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3}} onPress={() => { Keyboard.dismiss(); handleSubmitEditJob(); }} disabled={isLoadingEditJob} activeOpacity={0.8}>
                                    {isLoadingEditJob ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <>
                                            <MaterialIcons name="check" size={20} color="white" style={{marginRight: 8}} />
                                            <Text style={{fontSize: 16, color: 'white', fontWeight: 'bold'}}>Xác nhận</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

export default JobWorkingScreen;
