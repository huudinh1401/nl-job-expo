import React from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { generateMonthYearList } from '../utils/monthYear';

const MONTH_YEAR_LIST = generateMonthYearList();

// allLabel + onSelectAll: dùng cho màn cần lựa chọn "mặc định" (không lọc theo 1 tháng cụ thể), ví dụ AdminApprovalsScreen.
const MonthYearPickerModal = ({ visible, month, year, onSelect, onClose, accentColor = '#3b82f6', allLabel, onSelectAll }) => {
    const data = allLabel ? [{ value: 'all', label: allLabel }, ...MONTH_YEAR_LIST] : MONTH_YEAR_LIST;
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={onClose}>
                <View style={{ backgroundColor: '#1e293b', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingTop: 20, paddingBottom: 30, maxHeight: '60%' }}>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700', paddingHorizontal: 20, marginBottom: 10 }}>Chọn tháng</Text>
                    <FlatList
                        data={data}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => {
                            const isAllOption = item.value === 'all';
                            const selected = isAllOption ? (month == null) : (item.month === month && item.year === year);
                            return (
                                <TouchableOpacity
                                    onPress={() => (isAllOption ? onSelectAll() : onSelect(item.month, item.year))}
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
};

export default MonthYearPickerModal;
