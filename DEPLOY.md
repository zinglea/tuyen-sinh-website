# Deploy Node.js lên TUYENSINHCATCB.RUN.PLACE

## ✅ Cấu hình đã sẵn sàng

`next.config.js` đã đúng cho Node.js server (không có `output: 'export'`).

---

## 🚀 Cách deploy

### Bước 1: Push code lên GitHub

```bash
git init
git add .
git commit -m "Deploy to run.place"
git remote add origin https://github.com/[username]/[repo-name].git
git push -u origin main
```

### Bước 2: Tạo project trên run.place

1. Vào https://run.place/dashboard
2. Click **"New Project"** → **"Import from GitHub"**
3. Chọn repository vừa push

### Bước 3: Cấu hình build

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Port | `3000` |

### Bước 4: Environment Variables

Thêm biến môi trường quan trọng:

| Key | Value | Lấy ở đâu |
|-----|-------|-----------|
| `GEMINI_API_KEY` | `AIzaSy...` | Google AI Studio |

### Bước 5: Deploy

Click **"Deploy"** và đợi build xong.

---

## 🔄 Auto-update (Tự động cập nhật)

Sau khi setup xong, mỗi lần:

```bash
git add .
git commit -m "Update..."
git push
```

→ run.place tự động rebuild và deploy lại trong ~2-3 phút.

---

## ⚠️ Lưu ý

1. **Knowledge Base**: Upload thư mục `knowledge-base/` qua SFTP nếu cần RAG
2. **Domain**: Tự động là `tuyensinhcatcb.run.place`
3. **Port**: Phải là `3000` (Next.js default)

---

## 🔧 Kiểm tra sau deploy

Truy cập `https://tuyensinhcatcb.run.place` và test:
- [ ] Trang chủ hiển thị
- [ ] Tính điểm xét tuyển hoạt động
- [ ] Chatbot trả lời được (cần `GEMINI_API_KEY` đúng)
