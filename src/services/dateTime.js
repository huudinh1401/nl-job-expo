const tinhSoPhutRa = (thoiGianRa) => {
    const gioBatDau = new Date();
    gioBatDau.setHours(17, 30, 0, 0); // Đặt thời gian 17:30

    const gioKetThuc = new Date();
    gioKetThuc.setHours(17, 45, 0, 0); // Đặt thời gian 17:45

    const gioVeBuoiSang = new Date();
    gioVeBuoiSang.setHours(11, 30, 0, 0); // Đặt thời gian 11:30

    // Thêm giờ vào buổi chiều
    const gioVaoBuoiChieu = new Date();
    gioVaoBuoiChieu.setHours(13, 30, 0, 0); // Đặt thời gian 13:30

    // Chỉ lấy giờ và phút từ thoiGianRa
    const ra = new Date(thoiGianRa);
    const gioRa = ra.getHours() * 60 + ra.getMinutes(); // Chuyển đổi giờ phút ra thành phút

    // Chuyển đổi giờ phút của gioBatDau và gioKetThuc thành phút
    const phutBatDau = gioBatDau.getHours() * 60 + gioBatDau.getMinutes(); // 17:30
    const phutKetThuc = gioKetThuc.getHours() * 60 + gioKetThuc.getMinutes(); // 17:45

    // Chuyển đổi giờ phút của gioVeBuoiSang, gioVaoBuoiChieu thành phút
    const phutVeBuoiSang = gioVeBuoiSang.getHours() * 60 + gioVeBuoiSang.getMinutes(); // 11:30
    const phutVaoBuoiChieu = gioVaoBuoiChieu.getHours() * 60 + gioVaoBuoiChieu.getMinutes(); // 13:30

    if (gioRa < phutVeBuoiSang) {
        const soPhutRa = gioRa - phutVeBuoiSang;
        return soPhutRa;
    } else if (gioRa > phutVeBuoiSang && gioRa < phutVaoBuoiChieu) {
        const soPhutRa = gioRa - phutVeBuoiSang;
        return soPhutRa;
    } else if (gioRa >= phutBatDau && gioRa <= phutKetThuc) {
        return 0; // Nếu thời gian ra nằm trong khoảng 17:30 đến 17:45
    } else if (gioRa < phutBatDau) {
        const soPhutRa = gioRa - phutBatDau; // Tính số phút chênh lệch
        return soPhutRa; // Trả về số phút âm
    } else if (gioRa > phutKetThuc) {
        const soPhutRa = gioRa - phutKetThuc + 15; // Tính số phút chênh lệch cộng thêm 15
        return soPhutRa; // Trả về số phút dương
    }
    return 0;
};

const tinhSoPhutVao = (thoiGianVao) => {
    const gioBatDau = new Date();
    gioBatDau.setHours(7, 0, 0, 0); // Đặt thời gian 7:00

    const gioKetThuc = new Date();
    gioKetThuc.setHours(7, 45, 0, 0); // Đặt thời gian 7:45

    const gioVeBuoiSang = new Date();
    gioVeBuoiSang.setHours(11, 30, 0, 0); // Đặt thời gian 11:30

    // Thêm giờ vào buổi chiều
    const gioVaoBuoiChieu = new Date();
    gioVaoBuoiChieu.setHours(13, 30, 0, 0); // Đặt thời gian 13:30

    const vao = new Date(thoiGianVao);
    const gioVao = vao.getHours() * 60 + vao.getMinutes(); // Chuyển đổi giờ phút vào thành phút

    // Chuyển đổi giờ phút của gioBatDau và gioKetThuc thành phút
    const phutBatDau = gioBatDau.getHours() * 60 + gioBatDau.getMinutes(); // 7:00
    const phutKetThuc = gioKetThuc.getHours() * 60 + gioKetThuc.getMinutes();
    const phutVaoBuoiChieu = gioVaoBuoiChieu.getHours() * 60 + gioVaoBuoiChieu.getMinutes(); // 13:30
    const phutVeBuoiSang = gioVeBuoiSang.getHours() * 60 + gioVeBuoiSang.getMinutes(); // 11:30

    if (gioVao > phutVaoBuoiChieu) {
        const soPhutVao = phutVaoBuoiChieu - gioVao;
        return soPhutVao;
    } else if (gioVao < phutVaoBuoiChieu && gioVao > phutVeBuoiSang) {
        const soPhutVao = phutVaoBuoiChieu - gioVao;
        return soPhutVao;
    } else if (gioVao >= phutBatDau && gioVao <= phutKetThuc) {
        return 0; // Nếu thời gian vào nằm trong khoảng 7:00 đến 7:45
    } else if (gioVao < phutBatDau) {
        const soPhutVao = phutBatDau - gioVao + 30; // Tính số phút chênh lệch
        return soPhutVao; // Trả về số phút chính xác
    } else if (gioVao > phutKetThuc) {
        const soPhutVao = phutKetThuc - gioVao; // Tính số phút chênh lệch
        return soPhutVao; // Trả về số phút âm
    }
    return 0;
};

const tinhThoiGianLam = (thoiGianVao, thoiGianRa) => {
    // Tạo một đối tượng Date với ngày hiện tại để thêm giờ và phút
    const now = new Date();

    // Tách giờ và phút từ chuỗi vào
    const [gioVao, phutVao] = thoiGianVao.split(':').map(Number);
    const vao = new Date(now.getFullYear(), now.getMonth(), now.getDate(), gioVao, phutVao); // Ngày hôm nay + giờ vào

    // Tách giờ và phút từ chuỗi ra
    const [gioRa, phutRa] = thoiGianRa.split(':').map(Number);
    const ra = new Date(now.getFullYear(), now.getMonth(), now.getDate(), gioRa, phutRa); // Ngày hôm nay + giờ ra

    // Tính tổng thời gian làm việc bằng cách trừ thời gian vào khỏi thời gian ra
    const thoiGianLam = (ra - vao) / (1000 * 60 * 60); // Chuyển đổi từ milliseconds sang giờ

    return thoiGianLam; // Trả về thời gian làm việc tính bằng giờ
};

export default {
    tinhSoPhutRa,
    tinhSoPhutVao,
    tinhThoiGianLam
};