// ScanAnimation.js - Component hiệu ứng quét
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const ScanAnimation = ({ isScanning, width = 280, height = 350, duration = 3000, onComplete }) => {
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isScanning) {
            // Animation quét lên xuống nhanh trong 3 giây
            const scanLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 800, // Quét xuống 0.8 giây
                        useNativeDriver: false,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 800, // Quét lên 0.8 giây
                        useNativeDriver: false,
                    }),
                ])
            );

            scanLoop.start();

            // Dừng loop và gọi callback sau duration
            const timeout = setTimeout(() => {
                scanLoop.stop();
                if (onComplete) {
                    onComplete();
                }
            }, duration);

            return () => {
                scanLoop.stop();
                clearTimeout(timeout);
            };
        } else {
            // Reset về vị trí ban đầu khi dừng
            Animated.timing(scanAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    }, [isScanning]);

    if (!isScanning) return null;

    const scanLinePosition = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height - 4], // Trừ 4 để line không vượt ra ngoài
    });

    return (
        <View style={[styles.scanContainer, { width, height }]}>
            {/* Overlay với hiệu ứng mờ */}
            <View style={styles.scanOverlay}>
                {/* Đường quét */}
                <Animated.View
                    style={[
                        styles.scanLine,
                        {
                            top: scanLinePosition,
                            width: width - 20, // Nhỏ hơn khung một tí
                        }
                    ]}
                />

                {/* Hiệu ứng glow xung quanh đường quét */}
                <Animated.View
                    style={[
                        styles.scanGlow,
                        {
                            top: scanLinePosition,
                            width: width - 10,
                        }
                    ]}
                />
            </View>

            {/* Khung góc quét */}
            <View style={styles.scanCorners}>
                {/* Góc trên trái */}
                <View style={[styles.corner, styles.topLeft]} />
                {/* Góc trên phải */}
                <View style={[styles.corner, styles.topRight]} />
                {/* Góc dưới trái */}
                <View style={[styles.corner, styles.bottomLeft]} />
                {/* Góc dưới phải */}
                <View style={[styles.corner, styles.bottomRight]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    scanContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
    },
    scanOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
    },
    scanLine: {
        position: 'absolute',
        height: 4,
        backgroundColor: '#00FF00',
        borderRadius: 2,
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 10,
        left: 10,
    },
    scanGlow: {
        position: 'absolute',
        height: 20,
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
        borderRadius: 10,
        left: 5,
        transform: [{ translateY: -8 }], // Căn giữa với scan line
    },
    scanCorners: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#00FF00',
        borderWidth: 3,
    },
    topLeft: {
        top: 10,
        left: 10,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 10,
        right: 10,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 10,
        left: 10,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 10,
        right: 10,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
});

export default ScanAnimation;