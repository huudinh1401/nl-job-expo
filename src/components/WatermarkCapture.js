import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const IMAGE_LOAD_TIMEOUT = 8000;

const WatermarkCapture = forwardRef((props, ref) => {
    const containerRef = useRef(null);
    const [photoUri, setPhotoUri] = useState(null);
    const [lines, setLines] = useState([]);
    const loadResolverRef = useRef(null);

    useImperativeHandle(ref, () => ({
        capture: (uri, watermarkLines) => new Promise((resolve, reject) => {
            setPhotoUri(uri);
            setLines(watermarkLines);

            const timeout = setTimeout(() => {
                loadResolverRef.current = null;
                reject(new Error('Không thể tải ảnh, vui lòng thử lại.'));
            }, IMAGE_LOAD_TIMEOUT);

            loadResolverRef.current = async () => {
                clearTimeout(timeout);
                try {
                    // Chờ 1 nhịp render để Android flush frame đã load trước khi chụp, tránh chụp phải khung chưa vẽ xong (ảnh tối/đen).
                    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
                    const capturedUri = await captureRef(containerRef, { format: 'jpg', quality: 0.9, result: 'tmpfile' });
                    resolve(capturedUri);
                } catch (error) {
                    reject(error);
                }
            };
        }),
    }));

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'hidden' }} pointerEvents="none">
            <View ref={containerRef} collapsable={false} style={{ width: 280, height: 350 }}>
                {photoUri ? (
                    <Image
                        source={{ uri: photoUri }}
                        style={{ width: 280, height: 350 }}
                        resizeMode="cover"
                        fadeDuration={0}
                        onLoadEnd={() => loadResolverRef.current?.()}
                    />
                ) : null}
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 8 }}>
                    {lines.map((line, index) => (
                        <Text key={index} style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>{line}</Text>
                    ))}
                </View>
            </View>
        </View>
    );
});

export default WatermarkCapture;
