import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StatusBar, TouchableOpacity, Platform } from 'react-native';
import AdminHeaderScreen from './AdminHeaderScreen';
import JobWorkingMayTinhScreen from './JobWorkingMayTinhScreen';
import JobWorkingPhotoScreen from './JobWorkingPhotoScreen';
import JobWorkingCongTrinhScreen from './JobWorkingCongTrinhScreen';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const AdminHomeScreen = ({ navigation, onLogout }) => {
    const [jobMayTinh, setJobMayTinh] = useState(true);
    const [jobPhoTo, setJobPhoto] = useState(false);
    const [jobCongTrinh, setJobCongTrinh] = useState(false);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
    }, []);

    const handleMayTinh = () => {
        setJobMayTinh(true);
        setJobPhoto(false);
        setJobCongTrinh(false);
    };

    const handlePhoto = () => {
        setJobMayTinh(false);
        setJobPhoto(true);
        setJobCongTrinh(false);
    };

    const handleCongTrinh = () => {
        setJobMayTinh(false);
        setJobPhoto(false);
        setJobCongTrinh(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ flex: 9, marginTop: isAndroid15 ? 25 : 0 }}>
                    <View style={{ height: 75, zIndex: 9, paddingHorizontal: 12, paddingTop: 8 }}>
                        <AdminHeaderScreen navigation={navigation} onLogout={onLogout} />
                    </View>
                    <View style={{ marginTop: 16, paddingHorizontal: 8, flex: 1 }}>
                        <View style={{ flexDirection: 'row', height: 48, width: '100%', backgroundColor: '#334155', borderRadius: 12, padding: 4 }}>
                            <TouchableOpacity
                                style={{ flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: jobMayTinh ? '#3b82f6' : 'transparent', borderRadius: 8, marginHorizontal: 2 }}
                                onPress={() => handleMayTinh()}
                            >
                                <Text style={{ color: jobMayTinh ? '#ffffff' : '#94a3b8', fontSize: 14, fontWeight: jobMayTinh ? 'bold' : '500' }}>Máy tính</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: jobPhoTo ? '#3b82f6' : 'transparent', borderRadius: 8, marginHorizontal: 2 }}
                                onPress={() => handlePhoto()}
                            >
                                <Text style={{ color: jobPhoTo ? '#ffffff' : '#94a3b8', fontSize: 14, fontWeight: jobPhoTo ? 'bold' : '500' }}>Photocopy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: jobCongTrinh ? '#3b82f6' : 'transparent', borderRadius: 8, marginHorizontal: 2 }}
                                onPress={() => handleCongTrinh()}
                            >
                                <Text style={{ color: jobCongTrinh ? '#ffffff' : '#94a3b8', fontSize: 14, fontWeight: jobCongTrinh ? 'bold' : '500' }}>Công trình</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, marginTop: 8, backgroundColor: '#334155', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8 }}>
                            {jobMayTinh ? <JobWorkingMayTinhScreen /> : jobPhoTo ? <JobWorkingPhotoScreen /> : <JobWorkingCongTrinhScreen />}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminHomeScreen;
