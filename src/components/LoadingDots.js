import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

const LoadingDots = ({ color = '#fff', size = 8 }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
                ])
            );
        };

        Animated.parallel([
            animateDot(dot1, 0),
            animateDot(dot2, 200),
            animateDot(dot3, 400),
        ]).start();
    }, []);

    return (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Animated.View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginHorizontal: 2, opacity: dot1}} />
            <Animated.View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginHorizontal: 2, opacity: dot2}} />
            <Animated.View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginHorizontal: 2, opacity: dot3}} />
        </View>
    );
};

export default LoadingDots;