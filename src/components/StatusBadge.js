import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_META } from '../constants/reportsConfig';

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || STATUS_META.pending;
    return (
        <View style={{ backgroundColor: meta.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' }}>
            <Text style={{ color: meta.color, fontSize: 11, fontWeight: '700' }}>{meta.label}</Text>
        </View>
    );
};

export default StatusBadge;
