import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const ScanAnimation = ({ isScanning, width = 280, height = 350, duration = 3000, onComplete }) => {
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isScanning) {
            const scanLoop = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 800,
                        useNativeDriver: false,
                    }),
                ])
            );

            scanLoop.start();

            const timeout = setTimeout(() => {
                scanLoop.stop();
                onComplete?.();
            }, duration);

            return () => {
                scanLoop.stop();
                clearTimeout(timeout);
            };
        }

        Animated.timing(scanAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [duration, isScanning, onComplete, scanAnim]);

    if (!isScanning) return null;

    const scanLinePosition = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, height - 4],
    });

    return (
        <View style={[styles.scanContainer, { width, height }]}>
            <View style={styles.scanOverlay}>
                <Animated.View
                    style={[
                        styles.scanLine,
                        {
                            top: scanLinePosition,
                            width: width - 20,
                        },
                    ]}
                />

                <Animated.View
                    style={[
                        styles.scanGlow,
                        {
                            top: scanLinePosition,
                            width: width - 10,
                        },
                    ]}
                />
            </View>

            <View style={styles.scanCorners}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
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
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
    },
    scanLine: {
        position: 'absolute',
        left: 10,
        height: 4,
        backgroundColor: '#10b981',
        borderRadius: 2,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 10,
    },
    scanGlow: {
        position: 'absolute',
        left: 5,
        height: 20,
        backgroundColor: 'rgba(16, 185, 129, 0.22)',
        borderRadius: 10,
        transform: [{ translateY: -8 }],
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
        borderColor: '#10b981',
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
