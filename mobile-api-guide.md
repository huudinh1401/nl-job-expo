# Mobile API Guide — Chấm công quên / Tăng ca / Xin nghỉ phép

Tài liệu tham chiếu API đầy đủ cho đội mobile tích hợp 3 module: **báo cáo quên
chấm công**, **báo cáo tăng ca**, **xin phép nghỉ**. Trích xuất trực tiếp từ
source code backend ngày 2026-08-01 (không đoán, không suy diễn từ tên biến).
Với quyết định thiết kế (WHY), xem thêm `docs/leave-module.md` và
`docs/attendance-report-module.md` — file này chỉ tập trung vào HOW để gọi API.

Base URL: `http://<host>:<port>/api` (port mặc định `8000`, xem
`BACK_END/server.js`).

---

## 1. Quy ước chung — ĐỌC TRƯỚC KHI TÍCH HỢP

### 1.1 Ba dạng response lỗi khác nhau (rất quan trọng, dễ nhầm)

Backend **không có một shape lỗi thống nhất tuyệt đối**. Client phải phân biệt theo tầng gây lỗi:

| Tầng gây lỗi | Status | Shape | Ví dụ |
|---|---|---|---|
| `authenticate` middleware (thiếu/sai token) | 401 / 403 | `{ status, message }` — **không có field `success`** | `{"status":401,"message":"Access token không được cung cấp."}` |
| `requireAdmin` middleware (không phải admin) | 403 | `{ status, message }` — **không có field `success`** | `{"status":403,"message":"Bạn không có quyền thực hiện thao tác này."}` |
| Controller/service (nghiệp vụ, dùng `handleControllerError`) — **áp dụng cho cả 3 module trong tài liệu này** | 400 / 403 / 500 | `{ success: false, message }` | `{"success":false,"message":"Ngày không hợp lệ"}` |
| `PUT /api/users/update_device_token/:id` (module `user`, không dùng `handleControllerError`) | 200 / 400 | `{ message, device_token }` hoặc `{ message, data: null }` — **không có `success`, không có `status`** | `{"message":"Cap nhat device_token thanh cong","device_token":"..."}` |

→ Khuyến nghị: khi parse lỗi, ưu tiên đọc `message` (luôn có ở mọi shape),
đừng viết logic chỉ dựa vào `success` hoặc `status` field vì không phải
endpoint nào cũng trả.

### 1.2 "Không tìm thấy" luôn trả HTTP 400, KHÔNG PHẢI 404

Áp dụng cho **mọi** endpoint `GET /:id`, `PUT /:id/approve`, `PUT /:id/reject`
ở cả 3 module. Không có route nào trong 3 module này trả 404 thật sự. Client
phải phát hiện "not found" bằng cách đọc `message` (ví dụ
`"Báo cáo tăng ca không tồn tại"`), không được rẽ nhánh theo status code 404.

### 1.3 Phân quyền: JWT không chứa role

`Authorization: Bearer <accessToken>` — payload JWT chỉ có
`{ userId, username, email }`, **không có `role_id`**. Mọi route admin-only
tự truy vấn lại `Users.role_id` trong DB ở mỗi request. Hệ quả cho mobile:

- Không thể tự suy ra "user này có phải admin không" bằng cách decode JWT ở
  client — phải gọi API và dựa vào việc endpoint trả 200 hay 403.
- Mọi endpoint `GET` danh sách (list) đều **tự ép `user_id` theo token** với
  user thường — nếu bạn truyền `userId`/`user_id` khác trong query/body, nó
  bị **âm thầm bỏ qua** (không lỗi), server vẫn chỉ trả dữ liệu của chính
  người gọi. Tham số này chỉ có tác dụng thật khi người gọi là admin.

### 1.4 Không có endpoint sửa/xoá cho nhân viên

Cả 3 module: sau khi nhân viên submit (báo cáo quên chấm công / báo cáo tăng
ca / đơn nghỉ), **không có PUT/DELETE nào cho chính họ**. Nếu submit sai,
cách duy nhất là đợi admin xử lý (approve/reject) rồi tạo bản ghi mới — với
leave request, bản ghi cũ ở trạng thái `pending`/`approved` sẽ chặn trùng
lịch (`overlap`) của bản ghi mới cùng khoảng ngày.

### 1.5 Danh sách (`GET` list) mặc định chỉ lọc theo THÁNG HIỆN TẠI

Cả 3 module dùng chung pattern: nếu không truyền `month`/`year`, server mặc
định lọc theo tháng/năm hiện tại theo **giờ server**, **không phải** "toàn bộ
lịch sử". Không có tham số nào để lấy "cả năm" hay "tất cả" trong 1 lần gọi —
muốn hiển thị lịch sử nhiều tháng, mobile phải tự lặp gọi với `month`/`year`
khác nhau. Không có phân trang (`limit`/`offset`) trên bất kỳ endpoint list
nào trong 3 module.

### 1.6 Kiểu số thập phân trả về dạng string

`hours` (overtime), `days_count` (leave request) là cột `DECIMAL` — Sequelize
trả về JSON dạng **string** (`"2.5"`, `"0.5"`), không phải number. Luôn
`parseFloat`/`Number()` trước khi tính toán hoặc so sánh, đừng giả định kiểu
number.

### 1.7 Ngày giờ

- Các cột kiểu `DATEONLY` (`report_date`, `overtime_date`, `start_date`,
  `end_date`) luôn là string `YYYY-MM-DD`, không có giờ/timezone.
- Cột `TIME` (`proposed_check_in`, `proposed_check_out` của attendanceReport)
  là string `HH:mm` hoặc `HH:mm:ss`, gửi lên không cần offset/timezone —
  ngày lấy riêng từ `report_date`.
- Không hỗ trợ ca qua đêm (`proposed_check_out` phải sau
  `proposed_check_in` trong cùng ngày).

### 1.8 Push notification — bắt buộc để nhận thông báo duyệt/từ chối

Cả 3 module gửi push notification (Firebase, fire-and-forget — lỗi gửi không
làm fail API chính) khi có sự kiện tạo mới (tới admin) hoặc duyệt/từ chối
(tới nhân viên). Để nhận được, mobile app **phải** gọi:

```
PUT /api/users/update_device_token/:id
Authorization: Bearer <accessToken>
```
Body: `{ "device_token": "<FCM device token>" }`. `:id` là id của chính user
(lấy từ token sau khi login). Gọi lại mỗi khi FCM token đổi hoặc sau mỗi lần
login. Response 200: `{"message":"Cap nhat device_token thanh cong","device_token":"..."}`
(lưu ý: response này KHÔNG có field `success`, và message không dấu tiếng
Việt — khác style với các module khác).

---

## 2. Xác thực (Auth)

Không cần header `Authorization` cho 3 endpoint dưới, **trừ** `logout`.

### `POST /api/auth/login`
```json
// request
{ "email": "user@example.com", "password": "123456" }
```
```json
// 200
{
  "accessToken": "<JWT, hạn 3000 ngày>",
  "refreshToken": "<JWT, hạn 80 ngày>",
  "user": { "id": 5, "username": "...", "email": "...", "role_id": "...", "...": "toàn bộ cột bảng Users, bao gồm password đã hash — mobile KHÔNG được hiển thị field password" }
}
```
Lỗi (400): `{ "error": "Email hoặc mật khẩu không đúng." }` — **chú ý: field
lỗi ở đây tên là `error`, không phải `message`** (khác toàn bộ 3 module còn
lại trong tài liệu này).

### `POST /api/auth/register`
`multipart/form-data` (dùng multer, có upload avatar):
`username`, `email`, `password`, `part`, file field `avatar` (optional).
201: `{ "message": "Đăng ký thành công!", "user": {...} }`. Lỗi 400:
`{ "message": "<lý do>" }` (field `message`, không phải `error` — không nhất
quán với `login`).

### `POST /api/auth/refresh-token`
```json
{ "refreshToken": "<refreshToken>" }
```
200: `{ "accessToken": "<accessToken mới>" }`. Lỗi 400:
`{ "error": "Refresh token không hợp lệ." }`.

### `POST /api/auth/logout`
Header `Authorization` không bắt buộc bởi middleware (route này không đi qua
`authenticate`), nhưng cần body:
```json
{ "refreshToken": "<refreshToken>" }
```
200: `{ "message": "Logged out successfully" }`. Thiếu `refreshToken` → 400
`{ "message": "Refresh Token required" }`. Không tìm thấy token trong DB →
404 `{ "message": "Refresh Token not found" }` (đây là route auth **duy
nhất** thực sự dùng đúng 404 REST convention — khác 3 module business).

**Lưu ý bảo mật:** không log/hiển thị nguyên văn `accessToken`/`refreshToken`
ra console hay analytics của app mobile.

---

## 3. Module: Báo cáo quên chấm công — `/api/attendance-reports`, `/api/attendance-report-settings`

Mọi request cần `Authorization: Bearer <accessToken>`.

### 3.1 `POST /api/attendance-reports` — Nhân viên tạo báo cáo

```json
{
  "report_date": "2026-08-01",
  "type": "missed_both",
  "proposed_check_in": "08:00",
  "proposed_check_out": "17:30",
  "reason": "Quên bấm máy chấm công"
}
```
- `report_date`: bắt buộc, `YYYY-MM-DD`, phải là ngày có thật.
- `type`: bắt buộc, enum `missed_in` \| `missed_out` \| `missed_both`.
- `proposed_check_in`: bắt buộc nếu `type` là `missed_in`/`missed_both`, `HH:mm`.
- `proposed_check_out`: bắt buộc nếu `type` là `missed_out`/`missed_both`, `HH:mm`; nếu `missed_both` phải sau `proposed_check_in` cùng ngày.
- `reason`: optional, tối đa 255 ký tự.

Lỗi 400 (message nguyên văn — hiển thị trực tiếp cho user):
`"report_date phải theo định dạng YYYY-MM-DD"`, `"Ngày không hợp lệ"`,
`"type phải là 'missed_in', 'missed_out' hoặc 'missed_both'"`,
`"proposed_check_in phải theo định dạng HH:mm"` (tương tự cho check_out),
`"Lý do không được vượt quá 255 ký tự"`,
`"Giờ ra phải sau giờ vào (không hỗ trợ ca qua đêm)"`,
`"Đã có báo cáo quên chấm công cho ngày này đang chờ duyệt hoặc đã được duyệt"`.

201:
```json
{
  "success": true,
  "message": "Tạo báo cáo quên chấm công thành công",
  "data": {
    "id": 12, "user_id": 5, "report_date": "2026-08-01", "type": "missed_both",
    "proposed_check_in": "08:00:00", "proposed_check_out": "17:30:00",
    "reason": "Quên bấm máy chấm công", "status": "pending",
    "reviewed_by": null, "reviewed_at": null, "reject_reason": null,
    "synced_chamcong_id": null, "createdAt": "...", "updatedAt": "..."
  }
}
```

### 3.2 `GET /api/attendance-reports` — Danh sách

Query (optional): `status` (`pending`\|`approved`\|`rejected`, sai giá trị bị
lờ đi), `userId` (chỉ có tác dụng nếu caller là admin), `type`, `month`,
`year` (mặc định tháng/năm hiện tại). Sort `createdAt DESC`, không phân
trang.

200: `data` là mảng object giống mục 3.1 cộng thêm `username`, `part`
(người tạo), `reviewed_by_name` (username admin đã duyệt, `null` nếu chưa).

### 3.3 `GET /api/attendance-reports/:id`

Chủ sở hữu hoặc admin mới xem được. Không tồn tại → 400
`"Báo cáo quên chấm công không tồn tại"`. Không đúng chủ sở hữu → 403
`"Bạn không có quyền xem báo cáo này"`. 200: object giống 1 phần tử mục 3.2.

### 3.4 `PUT /api/attendance-reports/:id/approve` — admin only

Không cần body. Lỗi 400: `"Báo cáo không tồn tại hoặc đã được xử lý"`,
`"Đã có báo cáo quên chấm công cho ngày này đang chờ duyệt hoặc đã được duyệt"`.
Nếu setting `auto_sync_chamcong=true`, còn có thể lỗi đồng bộ (transaction
rollback, báo cáo giữ nguyên `pending`): `"Ngày {date} có N bản ghi chấm
công — không xác định được bản ghi cần sửa..."`,
`"Không tìm thấy bản ghi chấm công ngày {date} để bổ sung giờ ra..."`,
`"Bản ghi chấm công ngày {date} đã có giờ ra..."`,
`"Giờ ra phải sau giờ vào của bản ghi chấm công (không hỗ trợ ca qua đêm)"`.
200: `{success:true, message:"Duyệt báo cáo quên chấm công thành công", data:{...status:"approved"}}`.

### 3.5 `PUT /api/attendance-reports/:id/reject` — admin only

Body bắt buộc: `{ "reject_reason": "..." }` (non-empty sau trim, ≤255 ký
tự). Lỗi 400: `"reject_reason không được để trống"`,
`"Lý do từ chối không được vượt quá 255 ký tự"`,
`"Báo cáo không tồn tại hoặc đã được xử lý"`. 200: report với
`status:"rejected"`.

### 3.6 `/api/attendance-report-settings` — admin only, cấu hình toàn hệ thống

`GET`: 200 `{success:true, message:"...", data:{id:1, auto_sync_chamcong:false, updated_by:null, ...}}`.
`PUT`: body `{ "auto_sync_chamcong": true }` (phải là boolean thật, không
nhận string) → lỗi 400 `"auto_sync_chamcong phải là true hoặc false"` nếu sai
kiểu. Mobile app nhân viên **không cần** gọi 2 endpoint này (dành cho màn cấu
hình admin, nếu mobile có phần quản trị).

---

## 4. Module: Báo cáo tăng ca — `/api/overtime-reports`

Mọi request cần `Authorization: Bearer <accessToken>`.

### 4.1 `POST /api/overtime-reports`

```json
{ "overtime_date": "2026-08-01", "hours": 2.5, "reason": "Xử lý gấp đơn hàng ABC" }
```
- `overtime_date`: bắt buộc, `YYYY-MM-DD`, ngày có thật.
- `hours`: bắt buộc, số, `0 < hours ≤ 24`, **tối đa 1 chữ số thập phân**
  (`2.25` bị từ chối).
- `reason`: **bắt buộc** (khác `attendanceReport.reason` là optional),
  non-empty sau trim, ≤255 ký tự.

Lỗi 400: `"overtime_date phải theo định dạng YYYY-MM-DD"`,
`"Ngày không hợp lệ"`, `"hours là bắt buộc và phải là số"`,
`"hours phải lớn hơn 0 và không vượt quá 24"`,
`"Số giờ tăng ca chỉ được có tối đa 1 chữ số thập phân"`,
`"reason là bắt buộc"`, `"Lý do không được vượt quá 255 ký tự"`,
`"Đã có báo cáo tăng ca cho ngày này đang chờ duyệt hoặc đã được duyệt"`
(báo cáo `rejected` không tính trùng — tạo lại được).

201:
```json
{
  "success": true,
  "message": "Tạo báo cáo tăng ca thành công",
  "data": {
    "id": 12, "user_id": 7, "overtime_date": "2026-08-01", "hours": "2.5",
    "reason": "Xử lý gấp đơn hàng ABC", "status": "pending",
    "reviewed_by": null, "reviewed_at": null, "reject_reason": null,
    "createdAt": "...", "updatedAt": "..."
  }
}
```
**Rủi ro cần xác nhận với backend:** service không kiểm tra `overtime_date`
so với ngày hiện tại — về kỹ thuật có thể tạo báo cáo tăng ca cho ngày tương
lai. Nếu sản phẩm không muốn vậy, cần chặn thêm ở phía backend (không phải
lỗi của mobile).

### 4.2 `GET /api/overtime-reports`

Query (optional): `status`, `userId` (chỉ admin), `month`, `year` (mặc định
tháng/năm hiện tại). 200: `data` giống mục 4.1 kèm `username`, `part`,
`reviewed_by_name`.

### 4.3 `GET /api/overtime-reports/:id`

Không tồn tại → 400 `"Báo cáo tăng ca không tồn tại"`. Không đúng quyền →
403 `"Bạn không có quyền xem báo cáo này"`.

### 4.4 `PUT /api/overtime-reports/:id/approve` — admin only

Không cần body. Lỗi 400: `"Báo cáo không tồn tại hoặc đã được xử lý"`,
hoặc overlap tương tự 4.1. **Không đồng bộ sang ChamCong/timesheet** (khác
attendanceReport — duyệt tăng ca không ghi gì vào bảng chấm công khác).

### 4.5 `PUT /api/overtime-reports/:id/reject` — admin only

Body: `{ "reject_reason": "..." }`, cùng rule 255 ký tự/non-empty như các
module khác.

---

## 5. Module: Xin nghỉ phép — `/api/leave-types`, `/api/leave-requests`

Mọi request cần `Authorization: Bearer <accessToken>`.

### 5.1 `GET /api/leave-types` — mọi user, đổ dropdown khi tạo đơn

200: `{success:true, message:"Lấy danh sách loại nghỉ phép thành công", data:[{id, name, description, active:1}, ...]}`.
Chỉ trả `active:1`. Mobile dùng `id` này làm `leave_type_id` khi tạo đơn.

### 5.2 `GET /api/leave-types/all` — admin only

Giống trên nhưng gồm cả `active:0`.

### 5.3 `POST` / `PUT /:id` / `DELETE /:id` `/api/leave-types` — admin only

`DELETE` là **soft-delete** (set `active=0`), không xoá bản ghi. Body
`POST`/`PUT`: `{ name (bắt buộc, ≤255), description? (≤255) }`. Trùng `name`
→ 400 `"Dữ liệu đã tồn tại, vui lòng kiểm tra lại"`. Mobile nhân viên không
cần các endpoint này.

### 5.4 `POST /api/leave-requests` — Nhân viên tạo đơn nghỉ

```json
{ "leave_type_id": 1, "start_date": "2026-08-10", "end_date": "2026-08-10", "session": "morning", "reason": "Việc gia đình" }
```
- `leave_type_id`: bắt buộc, integer dương, phải tồn tại và `active=1` →
  sai: 400 `"Loại nghỉ phép không tồn tại hoặc đã ngừng sử dụng"`.
- `start_date`, `end_date`: bắt buộc, `YYYY-MM-DD`. `end_date` ≥
  `start_date` (`"Ngày kết thúc phải sau ngày bắt đầu"`). Phải cùng năm
  (`"Yêu cầu nghỉ phép phải nằm trong cùng 1 năm"`).
- `session`: optional, mặc định `full`, enum `full`\|`morning`\|`afternoon`.
  **Chỉ được khác `full` khi `start_date === end_date`** — UI mobile phải
  khoá lựa chọn nửa ngày khi user chọn khoảng nhiều ngày, nếu không sẽ nhận
  lỗi `"Chỉ được chọn nghỉ nửa ngày (buổi sáng/chiều) khi ngày bắt đầu và
  ngày kết thúc trùng nhau"`.
- `reason`: optional, ≤255 ký tự.
- `days_count`: **server tự tính, không gửi từ client.** `full` → số ngày
  trong khoảng; nửa ngày → luôn `0.5`.
- **Overlap check**: chặn nếu chồng lấn với đơn `pending`/`approved` khác
  của chính user đó — **trừ đúng 1 ngoại lệ**: 1 đơn `morning` + 1 đơn
  `afternoon` cùng ngày được phép cùng tồn tại. Mọi tổ hợp khác bị chặn →
  400 `"Yêu cầu nghỉ phép bị chồng lấn với 1 yêu cầu khác đang chờ duyệt
  hoặc đã được duyệt"`.

201: `data` trả về **không kèm** `username`/`part`/tên loại nghỉ (khác GET
list/detail — xem lưu ý §5.7). `days_count` có thể là string, `parseFloat`
trước khi dùng.

### 5.5 `GET /api/leave-requests` — Danh sách

Query (optional): `status` (không validate enum — sai giá trị → trả mảng
rỗng, không lỗi), `month`, `year` (mặc định tháng/năm hiện tại — **filter áp
dụng trên `start_date`**), `userId` (chỉ admin), `leave_type_id` (chỉ admin).
200: `data` kèm `username`, `part`, `reviewed_by_name` — **không kèm tên
loại nghỉ**, mobile phải tự map `leave_type_id` → gọi `GET /api/leave-types`
và lookup ở client.

### 5.6 `GET /api/leave-requests/:id`

Chủ sở hữu hoặc admin. Không tồn tại → 400
`"Yêu cầu nghỉ phép không tồn tại"`. Sai quyền → 403
`"Bạn không có quyền xem yêu cầu này"`.

### 5.7 `PUT /api/leave-requests/:id/approve` — admin only

Không cần body. Trước khi duyệt server chạy lại overlap check (trừ chính
đơn này) — nếu vẫn chồng lấn với đơn khác → cùng message overlap ở 5.4,
**không duyệt được**. Lỗi 400: `"Yêu cầu không tồn tại hoặc đã được xử lý"`.

### 5.8 `PUT /api/leave-requests/:id/reject` — admin only

Body: `{ "reject_reason": "..." }`, cùng rule non-empty/≤255 ký tự.

**Lưu ý thiết kế quan trọng cho mobile (module leave):**
- **Không có quota/số ngày phép còn lại** ở backend — không hiển thị "còn X
  ngày phép" trên UI, trường này không tồn tại.
- Response của `POST` (tạo mới) và `GET` (list/detail) có **schema khác
  nhau** (POST thiếu `username`/`part`/`reviewed_by_name`) — nếu cần đủ
  field để hiển thị ngay sau khi tạo, gọi thêm `GET /:id`.
- `session` trả về nguyên giá trị enum tiếng Anh (`morning`/`afternoon`) —
  tự map sang "Buổi sáng"/"Buổi chiều" ở client.

---

## 6. Bảng tổng hợp trạng thái (state machine) — cả 3 module

```
pending ──approve──▶ approved   (admin only)
pending ──reject───▶ rejected   (admin only, cần reject_reason)
```
Không có trạng thái nào khác. Không có "cancel" bởi chính nhân viên. Không
có quay lại `pending` từ `approved`/`rejected`. Không có sửa nội dung sau
khi tạo (trừ `leave-types`, dành cho admin quản lý danh mục, không áp dụng
cho leave-requests/attendance-reports/overtime-reports).

## 7. Checklist tích hợp cho mobile

- [ ] Lưu `accessToken`, dùng cho mọi request kèm header `Authorization: Bearer <token>`.
- [ ] `accessToken` sống rất lâu (3000 ngày) — không cần lo hết hạn thường
      xuyên, nhưng vẫn nên implement `refresh-token` để phòng trường hợp
      đổi secret/thu hồi.
- [ ] Sau login, gọi `PUT /api/users/update_device_token/:id` với FCM token
      để nhận push notification duyệt/từ chối.
- [ ] Khi tạo mới (POST) ở cả 3 module: validate client-side theo đúng rule
      ở mục 3–5 trước khi gọi API để tránh round-trip lỗi không cần thiết,
      nhưng **luôn hiển thị nguyên văn `message` lỗi từ server** làm nguồn
      sự thật cuối cùng (server có thể có rule mà client chưa biết).
  - [ ] Parse lỗi theo đúng shape ở bảng §1.1 tuỳ tầng.
- [ ] Không rẽ nhánh "not found" theo HTTP status 404 — dùng `message`.
- [ ] Màn "lịch sử" phải tự quản lý filter theo `month`/`year`, không có
      "tất cả" hay phân trang.
- [ ] `parseFloat` cho `hours`, `days_count` trước khi tính toán/hiển thị.
- [ ] Với leave-requests: gọi `GET /api/leave-types` để có danh sách chọn
      loại nghỉ và để map `leave_type_id` → tên khi hiển thị lịch sử.

## 8. Câu hỏi chưa giải quyết (cần xác nhận với backend/product owner)

- overtimeReport không chặn `overtime_date` ở tương lai — có phải hành vi
  mong muốn, hay cần bổ sung validate?
- `GET` danh sách của cả 3 module không hỗ trợ "toàn bộ lịch sử" hoặc nhiều
  tháng trong 1 lần gọi — nếu mobile cần màn lịch sử dạng infinite-scroll
  theo thời gian (không theo tháng), cần thêm tham số/endpoint mới ở backend
  (ngoài phạm vi tài liệu này).
- `PUT /api/users/update_device_token/:id` dùng shape response khác hẳn 3
  module còn lại (`message` không dấu, không có `success`) — nên chuẩn hoá
  lại nếu có thời gian, hiện tại mobile chỉ cần biết để xử lý riêng.
