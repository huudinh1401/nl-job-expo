import { useEffect, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = ({ isAuthenticated, user }) => {
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('🎬 SplashScreen: Starting animation for user:', user?.role);

        // Logo animation
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(logoScale, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(logoScale, {
                            toValue: 1.05,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(logoScale, {
                            toValue: 1.1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                    ])
                ),
            ]),
        ]).start();
    }, []);

    return (
        <LinearGradient colors={['#1e3c72', '#2a5298', '#16a085', '#27ae60']} style={{flex: 1}}>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24}}>
                {/* Logo - Simplified with transparent background */}
                <Animated.View style={{width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 15, elevation: 15, transform: [{scale: logoScale}], opacity: logoOpacity, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'}}>
                    <Image
                        source={require('../../../assets/images/nl-konen.png')}
                        style={{width: 110, height: 110, borderRadius: 55}}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* App Name */}
                <Text style={{fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 12, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 4}}>
                    JOB NLTECH
                </Text>

                {/* Subtitle */}
                <Text style={{fontSize: 18, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 60, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2}}>
                    Quản lý công việc & Chấm công
                </Text>

                {/* Loading indicator */}
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4}} />
                    <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)', marginHorizontal: 4}} />
                    <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginHorizontal: 4}} />
                </View>

                {/* Footer */}
                <View style={{position: 'absolute', bottom: 40}}>
                    <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontStyle: 'italic'}}>
                        Được phát triển bởi NLTECH
                    </Text>
                </View>
            </View>
        </LinearGradient>
    );
};

export default SplashScreen;