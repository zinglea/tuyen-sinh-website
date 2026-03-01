# HƯỚNG DẪN CÀI ĐẶT CHI TIẾT - DÀNH CHO NGƯỜI MỚI

## 📋 CHUẨN BỊ

### Điều kiện:
- Máy tính Windows/Mac/Linux
- Kết nối Internet
- Không cần kiến thức lập trình (làm theo từng bước)

---

## 📦 BƯỚC 1: CÀI ĐẶT NODE.JS

### Windows:
1. Mở trình duyệt, vào: https://nodejs.org/
2. Click nút "Download" màu xanh (LTS)
3. Chạy file .msi vừa tải về
4. Click "Next" liên tục đến khi hoàn thành
5. Khởi động lại máy tính

### Mac:
1. Mở trình duyệt, vào: https://nodejs.org/
2. Click nút "Download" (LTS)
3. Mở file .pkg vừa tải về
4. Làm theo hướng dẫn trên màn hình

### Kiểm tra cài đặt thành công:

**Windows:**
1. Nhấn `Windows + R`
2. Gõ `cmd` và Enter
3. Trong cửa sổ màu đen, gõ: `node --version`
4. Sẽ hiện ra số phiên bản (ví dụ: v20.10.0)

**Mac:**
1. Mở Terminal (Cmd + Space, gõ "Terminal")
2. Gõ: `node --version`
3. Sẽ hiện ra số phiên bản

✅ Nếu thấy số phiên bản → Cài đặt thành công!

---

## 🔑 BƯỚC 2: LẤY API KEY TỪ GOOGLE GEMINI (MIỄN PHÍ)

1. Mở trình duyệt, vào: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google (Gmail)
3. Click nút "Create API key"
4. Chọn "Create API key in new project"
5. Copy chuỗi ký tự (dạng: AIzaSyXXXXXX...)
6. Lưu vào Notepad để dùng sau

📝 **Lưu ý:** 
- API key MIỄN PHÍ
- Giới hạn: 60 requests/phút (đủ dùng)
- KHÔNG chia sẻ API key cho người khác

---

## 💻 BƯỚC 3: CÀI ĐẶT DỰ ÁN

### A. Giải nén thư mục

1. Giải nén file zip dự án vào nơi bạn muốn
   Ví dụ: `C:\tuyen-sinh-website` hoặc `~/Desktop/tuyen-sinh-website`

### B. Mở Terminal/CMD tại thư mục dự án

**Windows:**
1. Mở thư mục `tuyen-sinh-website`
2. Click vào thanh địa chỉ phía trên
3. Gõ `cmd` và Enter
4. Cửa sổ CMD sẽ mở ra

**Mac:**
1. Mở Finder, vào thư mục `tuyen-sinh-website`
2. Chuột phải vào thư mục
3. Chọn "Services" > "New Terminal at Folder"

### C. Cài đặt các package

Trong Terminal/CMD, gõ lệnh:

```bash
npm install
```

Nhấn Enter và chờ...

⏱️ **Quá trình này mất 2-5 phút** (tùy tốc độ Internet)

Bạn sẽ thấy nhiều dòng chữ chạy. Đừng tắt cửa sổ!

✅ Khi nào thấy dòng cuối cùng không còn chạy nữa → Hoàn thành!

---

## 🔐 BƯỚC 4: CẤU HÌNH API KEY

### Tạo file .env.local

**Windows:**
1. Mở Notepad
2. Gõ nội dung:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
   ```
   (Thay `AIzaSy...` bằng API key của bạn ở Bước 2)
3. Chọn File > Save As
4. Đặt tên file: `.env.local`
5. Save type: "All files (*.*)"
6. Lưu vào thư mục `tuyen-sinh-website` (thư mục gốc)

**Mac:**
1. Mở TextEdit
2. Chọn Format > Make Plain Text
3. Gõ nội dung:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXX
   ```
4. Lưu với tên `.env.local` vào thư mục gốc dự án

📝 **Lưu ý quan trọng:**
- File phải tên chính xác: `.env.local` (có dấu chấm ở đầu)
- KHÔNG có khoảng trắng trước/sau dấu `=`
- KHÔNG có dấu ngoặc kép

---

## 🚀 BƯỚC 5: CHẠY WEBSITE

### Trong Terminal/CMD (vẫn ở thư mục dự án), gõ:

```bash
npm run dev
```

Nhấn Enter và chờ khoảng 10-30 giây...

Khi thấy dòng:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

→ Website đã chạy thành công! 🎉

### Xem website:

1. Mở trình duyệt (Chrome, Firefox, Safari...)
2. Vào địa chỉ: `http://localhost:3000`
3. Bạn sẽ thấy trang chủ website tuyển sinh!

### Thử nghiệm Chatbot:

1. Click nút "Hỏi Chatbot AI" trên trang chủ
2. Gõ câu hỏi: "Điều kiện tuyển sinh là gì?"
3. Chatbot sẽ trả lời tự động!

---

## 🛑 TẮT WEBSITE

Khi muốn tắt website:
1. Quay lại Terminal/CMD
2. Nhấn `Ctrl + C` (Windows/Mac)
3. Gõ `Y` nếu được hỏi

---

## ❓ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "npm: command not found"
→ Bạn chưa cài Node.js, quay lại Bước 1

### Lỗi: "Cannot find module"
→ Gõ lại: `npm install`

### Lỗi: "Port 3000 is already in use"
→ Cổng 3000 đã bị chiếm, dùng cổng khác:
```bash
npm run dev -- -p 3001
```
Sau đó vào: http://localhost:3001

### Chatbot không trả lời / báo lỗi
Kiểm tra:
1. File `.env.local` đã tạo chưa?
2. API key có đúng không?
3. Internet có kết nối không?

### Website hiển thị lỗi
→ Thử lại từ đầu:
```bash
npm install
npm run dev
```

---

## 📝 CHỈNH SỬA NỘI DUNG

### Thay đổi tên trường, logo:

Mở file `app/page.tsx` bằng Notepad/TextEdit, tìm dòng:
```
Học viện Cảnh sát Nhân dân
```
Đổi thành tên trường của bạn, lưu lại.

### Thêm tin tức:

Mở file `app/tin-tuc/page.tsx`, tìm `newsData`, thêm tin mới:
```javascript
{
  id: 7,
  title: 'Tin mới',
  excerpt: 'Mô tả ngắn',
  content: 'Nội dung đầy đủ',
  date: '2026-03-01',
  category: 'Thông báo',
}
```

### Thay đổi thông tin cho Chatbot:

Mở file `app/api/chat/route.ts`, sửa phần `TUYEN_SINH_CONTEXT`.

---

## 🌐 ĐĂNG WEBSITE LÊN INTERNET (MIỄN PHÍ)

### Dùng Vercel (Khuyến nghị):

1. Tạo tài khoản tại: https://vercel.com (đăng nhập bằng GitHub)
2. Tại trang vercel.com, click "Add New" > "Project"
3. Import dự án của bạn từ máy tính
4. Trong phần "Environment Variables":
   - Name: `GEMINI_API_KEY`
   - Value: API key của bạn
5. Click "Deploy"
6. Đợi 2-3 phút
7. Website sẽ có địa chỉ dạng: `ten-ban.vercel.app`

🎉 Hoàn thành! Website đã lên Internet, ai cũng truy cập được!

---

## 📞 CẦN HỖ TRỢ?

1. Đọc kỹ lại hướng dẫn
2. Tìm trên Google: "Next.js [tên lỗi]"
3. Hỏi trên group Facebook: "Cộng đồng lập trình Việt Nam"

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Đã cài Node.js
- [ ] Đã lấy API key Gemini
- [ ] Đã chạy `npm install` thành công
- [ ] Đã tạo file `.env.local`
- [ ] Website chạy tại http://localhost:3000
- [ ] Chatbot hoạt động bình thường
- [ ] (Tùy chọn) Đã deploy lên Vercel

---

🎊 **CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH!**

Nếu làm theo đúng các bước, bạn đã có 1 website tuyển sinh với Chatbot AI chạy tốt rồi đấy!
