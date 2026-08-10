import * as Location from 'expo-location';

const getAreaLabel = async (latitude, longitude) => {
    try {
        const results = await Location.reverseGeocodeAsync({ latitude, longitude });
        const place = results?.[0];
        if (!place) return 'Không xác định được khu vực';

        const parts = [place.street, place.district, place.subregion, place.city || place.region].filter(Boolean);
        const unique = [...new Set(parts)];
        return unique.length > 0 ? unique.join(', ') : 'Không xác định được khu vực';
    } catch (error) {
        console.log('Lỗi reverse geocode: ', error);
        return 'Không xác định được khu vực';
    }
};

export default { getAreaLabel };
