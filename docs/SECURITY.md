# 🔐 Bảo mật & Mã hóa - Hướng dẫn sử dụng

## Tổng quan

Hệ thống bảo mật cho phép bạn:
- ✅ Mã hóa API key
- ✅ Mã hóa tài liệu RAG
- ✅ Triển khai an toàn mà không lộ dữ liệu nhạy cảm

## 📁 Các file bảo mật

| File | Mô tả |
|------|-------|
| `utils/encryption.ts` | Thuật toán mã hóa AES-256-GCM |
| `utils/secureStorage.ts` | Quản lý API key đã mã hóa |
| `utils/secureDocumentStorage.ts` | Quản lý tài liệu đã mã hóa |
| `scripts/setup-security.ts` | Công cụ CLI thiết lập bảo mật |

## 🚀 Cách sử dụng

### Bước 1: Mã hóa API Key và Tài liệu

```bash
# Chạy công cụ thiết lập
npx ts-node scripts/setup-security.ts
```

Công cụ sẽ yêu cầu:
1. **Gemini API Key** - Nhập key của bạn
2. **Master Password** - Tạo mật khẩu mạnh (min 12 ký tự)
3. Tự động mã hóa tài liệu trong `knowledge-base/`

### Bước 2: Triển khai

#### Cách A: Dùng Environment Variable (Đơn giản)
```bash
# Trên run.place dashboard, thêm:
GEMINI_API_KEY=AIzaSy... (key gốc, không mã hóa)
```

#### Cách B: Dùng Mã hóa (Bảo mật cao)
```bash
# 1. Commit file đã mã hóa (trong .secure/)
git add .secure/
git commit -m "Add encrypted keys and documents"
git push

# 2. Trên run.place dashboard, chỉ thêm:
MASTER_PASSWORD=YourStrongPassword123!
```

## 🔒 Cơ chế bảo mật

### Mã hóa API Key
- **Thuật toán**: AES-256-GCM
- **Key derivation**: PBKDF2 với 100,000 rounds
- **Salt**: Random 64 bytes
- **IV**: Random 16 bytes

### Mã hóa Tài liệu
- Mỗi tài liệu được mã hóa riêng lẻ
- Metadata được lưu riêng để truy vấn nhanh
- Không cần giải mã toàn bộ để liệt kê tài liệu

### Fallback Priority
1. `GEMINI_API_KEY` env (production)
2. Secure storage + `MASTER_PASSWORD` (encrypted)
3. Error nếu cả hai đều không có

## ⚠️ Quan trọng

### Những điều KHÔNG được commit
```
/.env
/.env.local
/knowledge-base/ (original files)
```

### Những điều CÓ THỂ commit
```
/.secure/ (encrypted files)
```

### Mật khẩu Master Password
- **KHÔNG** được commit
- **CHỈ** nhập vào Environment Variables trên server
- **KHÔNG THỂ** khôi phục nếu quên
- Nên dùng password manager để lưu trữ

## 📝 Ví dụ Workflow

### Development (Local)
```bash
# Dùng .env.local (không mã hóa)
GEMINI_API_KEY=AIzaSyC2I8bT...
```

### Production (Run.place)
```bash
# Cách 1: Dùng env trực tiếp
GEMINI_API_KEY=AIzaSyC2I8bT...

# Cách 2: Dùng mã hóa (bảo mật hơn)
MASTER_PASSWORD=MySecurePass123!
# (API key đã mã hóa trong .secure/)
```

## 🔧 Troubleshooting

### Lỗi: "Invalid master password"
- Kiểm tra password có đúng không
- Password phải giống lúc mã hóa

### Lỗi: "No valid API key found"
- Thêm `GEMINI_API_KEY` hoặc `MASTER_PASSWORD` vào env
- Kiểm tra file `.secure/keys.enc` có tồn tại không

### Reset mã hóa
```bash
# Xóa và thiết lập lại
rm -rf .secure/
npx ts-node scripts/setup-security.ts
```

## 📊 So sánh phương án

| Phương án | Bảo mật | Độ phức tạp | Khuyến nghị |
|-----------|---------|-------------|-------------|
| Env trực tiếp | ⭐⭐⭐ | Thấp | Dùng cho dev |
| Mã hóa + Env | ⭐⭐⭐⭐⭐ | Trung bình | Dùng cho production |
| Không bảo mật | ⭐ | N/A | ❌ Không nên |

## 🎯 Checklist triển khai an toàn

- [ ] Chạy `setup-security.ts` để mã hóa API key
- [ ] Mã hóa tài liệu RAG (nếu có)
- [ ] Kiểm tra `.gitignore` có `/.secure/` (để commit encrypted files)
- [ ] Kiểm tra `.gitignore` có `.env` (để không commit raw key)
- [ ] Thêm `MASTER_PASSWORD` vào run.place dashboard
- [ ] Không bao giờ commit raw API key
- [ ] Không bao giờ commit master password
- [ ] Test chatbot hoạt động sau deploy

## 🆘 Hỗ trợ

Nếu quên master password:
1. Không thể khôi phục API key đã mã hóa
2. Phải chạy lại `setup-security.ts` với API key mới
3. Cập nhật env trên server

---

**Lưu ý cuối**: Mã hóa là lớp bảo vệ thêm, nhưng vẫn phải bảo vệ `MASTER_PASSWORD` cẩn thận!
