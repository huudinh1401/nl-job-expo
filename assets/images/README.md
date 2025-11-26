# Hướng dẫn thêm hình ảnh

## Cần thêm 2 file hình ảnh vào thư mục này:

1. **nl-konen.png** - Logo của ứng dụng (sử dụng trong màn hình login và header)
   - Kích thước khuyến nghị: 200x200px hoặc lớn hơn
   - Định dạng: PNG với nền trong suốt hoặc nền trắng
   - Sẽ được hiển thị trong vòng tròn 85x85px

2. **nltech.png** - Icon ứng dụng 
   - Kích thước khuyến nghị: 1024x1024px
   - Định dạng: PNG

## Cách thêm:
1. Copy 2 file hình ảnh vào thư mục `assets/images/`
2. Đảm bảo tên file chính xác: `nl-konen.png` và `nltech.png`
3. Restart ứng dụng để load hình ảnh mới

## Hiện tại:
- Ứng dụng đang sử dụng logo placeholder với chữ "NL TECH"
- Khi bạn thêm file `nl-konen.png`, nó sẽ tự động thay thế placeholder
- Nếu file không tồn tại, sẽ hiển thị fallback với chữ "NL TECH"

## Giao diện mới:
- ✅ Gradient xanh lá đậm làm chủ đạo
- ✅ Background trong suốt cho form đăng nhập
- ✅ Icons công nghệ chuyển động (wifi, desktop, camera, server, phone, chip)
- ✅ Dòng chữ "Được phát triển bởi NLTECH"