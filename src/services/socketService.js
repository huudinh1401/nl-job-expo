import io from 'socket.io-client';

// Khởi tạo socket một lần
const SOCKET_URL = 'https://apijob.nguyenluan.vn/';

const socket = io(SOCKET_URL, {
    autoConnect: false, // Không kết nối ngay khi khởi tạo
});

export default socket;