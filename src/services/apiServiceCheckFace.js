const API_URL = 'https://apiface.nguyenluan.vn/api/v1/recognize';
const API_KEY = 'GIyBK7ge2fLWK8G6hXDh47xbm5sKVCZd';

const apiRecognizeFace = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    });

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            'Content-Type': 'multipart/form-data',
        },
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
};

export { apiRecognizeFace };
