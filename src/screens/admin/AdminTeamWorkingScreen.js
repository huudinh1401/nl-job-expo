import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ADMIN_TEAMS } from '../../constants/adminTeams';
import JobWorkingMayTinhScreen from './JobWorkingMayTinhScreen';
import JobWorkingPhotoScreen from './JobWorkingPhotoScreen';
import JobWorkingCongTrinhScreen from './JobWorkingCongTrinhScreen';

const isAndroid15 = Platform.OS === 'android' && Platform.Version >= 35;

const WORKING_SCREENS = {
    maytinh: JobWorkingMayTinhScreen,
    photo: JobWorkingPhotoScreen,
    congtrinh: JobWorkingCongTrinhScreen,
};

const AdminTeamWorkingScreen = ({ navigation, route }) => {
    const team = ADMIN_TEAMS.find((t) => t.key === route.params?.team) || ADMIN_TEAMS[0];
    const WorkingComponent = WORKING_SCREENS[team.key];

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
                <View style={{ paddingHorizontal: 12, paddingTop: isAndroid15 ? 25 : 8, paddingBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 16 }}>
                        <View style={{ width: 40, height: 40, backgroundColor: team.color, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                            <Ionicons name={team.icon} size={20} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>Việc đang làm</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500' }}>Đội {team.label}</Text>
                        </View>
                        <TouchableOpacity
                            style={{ width: 44, height: 44, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={22} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={{ flex: 1, marginHorizontal: 8, marginBottom: 8, backgroundColor: '#334155', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 8 }}>
                    <WorkingComponent />
                </View>
            </SafeAreaView>
        </View>
    );
};

export default AdminTeamWorkingScreen;
