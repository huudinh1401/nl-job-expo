import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, Text, View, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { BottomNavigation } from 'react-native-paper';
import { Icon } from 'react-native-elements';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssignJob from './giaoJob';
import { apiCheckStatusUser, apiGetAllUser, apiGetJobHistory, apiNvTeamDiemDanh } from '../../config/apiService';
import GetJobLeader from './getJobLeader';
import JobWorkingLeader from './listJobWorking';
import HistoryTeam from './historyTeam';
import DsNvDiemDanh from './dsNVDiemDanh';

const JobLeader = ({ isGetJob, navigation, setIsGetJob, jobUser, setJobUser, route, valueJob, setValueJob }) => {
    const [userID, setUserID] = useState(null);
    const [username, setUsername] = useState(null);
    const [job, setJob] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [history, setHistory] = useState([]);
    const [diemDanhNv, setDiemDanhNV] = useState([]);
    const [homNay, setHomNay] = useState(null);
    const [valueDate, setValueDate] = useState('');
    const [idJob, setIdJob] = useState('');
    const [index, setIndex] = useState(0);

    const [routes] = useState([
        { key: 'assignJob', title: 'Giao việc', focusedIcon: 'account-edit', unfocusedIcon: 'account-edit-outline' },
        { key: 'getJobLeader', title: 'Nhận việc', focusedIcon: 'star', unfocusedIcon: 'star-outline' },
        { key: 'jobWorking', title: 'Đang làm', focusedIcon: 'account-wrench', unfocusedIcon: 'account-wrench-outline' },
        { key: 'history', title: 'L.Sử đội', focusedIcon: 'clipboard-text-clock', unfocusedIcon: 'clipboard-text-clock-outline' },
        { key: 'NvDiemDanh', title: 'Nv ĐDanh', focusedIcon: 'account-box-multiple', unfocusedIcon: 'account-box-multiple-outline' },
    ]);

    useEffect(() => {
        Text.defaultProps = { allowFontScaling: false, fontFamily: 'Inter' };
        const fetchUserID = async () => {
            try {
                const id = await AsyncStorage.getItem('userID');
                const username = await AsyncStorage.getItem('username');
                const jobb = await AsyncStorage.getItem('job');
                const avatar = await AsyncStorage.getItem('avatar');

                id && setUserID(id);
                username && setUsername(username);
                jobb && setJob(jobb);
                avatar && setAvatar(avatar);
            } catch (error) {
                console.error('Lỗi khi lấy dữ liệu từ AsyncStorage:', error);
            }
        };
        fetchUserID();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getHistoryJob()
            getDsNvDiemDanh()
            checkUserStatus()
            if (index === 3) {
                getHistory();
                const currentDate = new Date();
                const formattedDate = currentDate.toISOString().split("T")[0];
                setValueDate(formattedDate);
            }
            if (index === 4) {
                getDsNvDiemDanh();
            }
        }, [index])
    );

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'assignJob':
                return <AssignJob isGetJob={isGetJob} navigation={navigation} setIsGetJob={setIsGetJob} jobUser={jobUser} setJobUser={setJobUser} route={route} />;
            case 'getJobLeader':
                return <GetJobLeader isGetJob={isGetJob} navigation={navigation} setIsGetJob={setIsGetJob} jobUser={jobUser} setJobUser={setJobUser} route={route} valueJob={valueJob} setValueJob={setValueJob} idJob={idJob} setIdJob={setIdJob} />;
            case 'jobWorking':
                return <JobWorkingLeader team={job} navigation={navigation} />;
            case 'history':
                return <HistoryTeam team={job} navigation={navigation} getHistory={getHistory} history={history} setHistory={setHistory} valueDate={valueDate} setValueDate={setValueDate} />;
            case 'NvDiemDanh':
                return <DsNvDiemDanh team={job} navigation={navigation} getDsNvDiemDanh={getDsNvDiemDanh} diemDanhNv={diemDanhNv} homNay={homNay} />;
            default:
                return null;
        }
    };

    const getHistoryJob = async () => {
        try {
            const id = await AsyncStorage.getItem('userID');
            const res = await apiGetJobHistory();
            const filteredData = res.data.filter(item => String(item.user_id) === String(id) && item.end === null);

            if (filteredData.length > 0) {
                setValueJob(filteredData[0].noi_dung)
                setIdJob(filteredData[0].id)
            } else {
                setValueJob('')
                setIdJob('')
            }
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi lấy lịch sử Job!', 'Vui lòng kiểm tra lại kết nối mạng.');
            }
        }
    }

    const checkUserStatus = async () => {
        try {
            const id = await AsyncStorage.getItem('userID');
            const res = await apiCheckStatusUser(id);
            const { message } = res;

            if (message === 1) {
                setIsGetJob(true);
            } else {
                setIsGetJob(false);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái nhận việc:', error);
        }
    };

    const handleIndexChange = (newIndex) => {
        setIndex(newIndex);
    };

    const getHistory = useCallback(async () => {
        try {
            const res = await apiGetJobHistory();
            const data = res.data.slice(0, 50);
            const jobb = await AsyncStorage.getItem('job');

            let filteredData;
            if (jobb === 'Dự án') {
                // Nếu là bộ phận Dự án, lấy tất cả dữ liệu
                filteredData = data;
            } else {
                // Các bộ phận khác chỉ lấy dữ liệu của bộ phận đó
                filteredData = data.filter(record => record.department === jobb);
            }

            setHistory(filteredData);
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    }, []);

    const getDsNvDiemDanh = useCallback(async () => {
        try {
            const today = new Date();
            today.setHours(today.getHours() + 7);
            const formattedDate = today.toISOString().split('T')[0];
            setHomNay(formattedDate);

            const jobb = await AsyncStorage.getItem('job');

            // Lấy tất cả user
            const resAllUser = await apiGetAllUser();

            // Xử lý logic cho đội Dự án vs các đội khác
            let userTeam;
            let allAttendanceData = [];

            if (jobb === 'Dự án') {
                // Nếu là đội Dự án, lấy tất cả nhân viên của 4 bộ phận
                const allDepartments = ['Dự án', 'Máy tính', 'Công trình', 'Photocopy'];
                const filteredData = resAllUser.filter(record =>
                    allDepartments.includes(record.part)
                );
                userTeam = filteredData.map(item => item.username);

                // Gọi API điểm danh cho tất cả 4 bộ phận
                const attendancePromises = allDepartments.map(dept =>
                    apiNvTeamDiemDanh(dept, formattedDate)
                );
                const attendanceResults = await Promise.all(attendancePromises);

                // Gộp tất cả dữ liệu điểm danh lại
                attendanceResults.forEach(res => {
                    if (res.data) {
                        allAttendanceData = [...allAttendanceData, ...res.data];
                    }
                });
            } else {
                // Các đội khác chỉ lấy nhân viên của bộ phận đó
                const filteredData = resAllUser.filter(record => record.part === jobb);
                userTeam = filteredData.map(item => item.username);

                // Gọi API điểm danh cho bộ phận hiện tại
                const res = await apiNvTeamDiemDanh(jobb, formattedDate);
                if (res.data) {
                    allAttendanceData = res.data;
                }
            }

            if (allAttendanceData.length > 0) {
                const userDiemDanh = allAttendanceData.map(item => item.username);
                const userAttendance = userTeam.map(user => ({
                    username: user,
                    status: userDiemDanh.includes(user) ? 'Đi làm' : 'Vắng'
                }));
                setDiemDanhNV(userAttendance);
            } else {
                const userDiemDanh = [];
                const userAttendance = userTeam.map(user => ({
                    username: user,
                    status: userDiemDanh.includes(user) ? 'Đi làm' : 'Vắng'
                }));
                setDiemDanhNV(userAttendance);
            }
        } catch (error) {
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                Alert.alert('Lỗi!', 'Vui lòng kiểm tra lại kết nối mạng!');
            }
        }
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
            <StatusBar barStyle='light-content' backgroundColor="#1e293b" />
            <BottomNavigation
                navigationState={{ index, routes }}
                onIndexChange={handleIndexChange}
                renderScene={renderScene}
                extraData={history}
                theme={{
                    colors: {
                        secondaryContainer: '#334155',
                        onSecondaryContainer: '#f1f5f9',
                        surface: '#1e293b',
                        onSurface: '#94a3b8',
                        primary: '#3b82f6',
                        onPrimary: '#ffffff',
                        surfaceVariant: '#475569',
                        onSurfaceVariant: '#cbd5e1',
                        outline: '#64748b'
                    }
                }}
                barStyle={{
                    backgroundColor: '#334155',
                    borderTopWidth: 1,
                    borderTopColor: '#475569',
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4
                }}
                activeColor="#3b82f6"
                inactiveColor="#94a3b8"
                labeled={true}
                shifting={false}
            />
        </View>
    );
}
export default JobLeader;