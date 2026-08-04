import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { generateMonthYearList } from '../utils/monthYear';

const MONTH_YEAR_LIST = generateMonthYearList();

const MonthYearPickerModal = ({ visible, month, year, onSelect, onClose, accentColor = '#3b82f6' }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
            <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20, paddingBottom: 30, maxHeight: '60%' }}>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 }}>Chọn tháng</Text>
                <FlatList
                    data={MONTH_YEAR_LIST}
                    keyExtractor={(item) => item.value}
                    renderItem={({ item }) => {
                        const selected = item.month === month && item.year === year;
                        return (
                            <TouchableOpacity
                                onPress={() => onSelect(item.month, item.year)}
                                style={{ paddingVertical: 14, paddingHorizontal: 20, backgroundColor: selected ? `${accentColor}26` : 'transparent' }}
                            >
                                <Text style={{ color: selected ? accentColor : '#ffffff', fontSize: 15, fontWeight: '600' }}>{item.label}</Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </TouchableOpacity>
    </Modal>
);

export default MonthYearPickerModal;
