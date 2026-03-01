# Website Tuyển sinh với Chatbot AI

Website tuyển sinh hiện đại được xây dựng với Next.js và tích hợp Chatbot AI sử dụng Google Gemini API.

## 🌟 Tính năng

- ✅ Trang chủ đẹp mắt, responsive
- ✅ Trang tin tức tuyển sinh với bộ lọc
- ✅ Chatbot AI trả lời tự động câu hỏi về tuyển sinh
- ✅ Giao diện thân thiện, dễ sử dụng

## 🚀 Hướng dẫn cài đặt trên máy tính cá nhân

### Bước 1: Cài đặt Node.js

1. Truy cập: https://nodejs.org/
2. Tải phiên bản LTS (khuyến nghị)
3. Cài đặt theo hướng dẫn
4. Kiểm tra cài đặt thành công bằng cách mở Terminal/CMD và gõ:
   ```bash
   node --version
   npm --version
   ```

### Bước 2: Lấy API Key từ Google Gemini

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Click "Create API Key"
4. Copy API key (dạng: AIzaSy...)

### Bước 3: Cài đặt dự án

1. Mở Terminal/CMD
2. Di chuyển đến thư mục dự án:
   ```bash
   cd duong-dan-den-thu-muc-tuyen-sinh-website
   ```

3. Cài đặt các package cần thiết:
   ```bash
   npm install
   ```
   ⏱️ Quá trình này mất khoảng 2-5 phút

### Bước 4: Cấu hình API Key

1. Tạo file `.env.local` trong thư mục gốc dự án
2. Thêm nội dung sau vào file:
   ```
   GEMINI_API_KEY=API_KEY_CUA_BAN_O_DAY
   ```
   (Thay `API_KEY_CUA_BAN_O_DAY` bằng API key đã copy ở Bước 2)

### Bước 5: Chạy website trên máy local

```bash
npm run dev
```

Website sẽ chạy tại: http://localhost:3000

🎉 Mở trình duyệt và truy cập http://localhost:3000 để xem website!

## 📝 Cách thêm/sửa nội dung

### Thêm tin tức mới

Mở file `app/tin-tuc/page.tsx`, tìm mảng `newsData` và thêm tin tức mới:

```javascript
{
  id: 7,
  title: 'Tiêu đề tin tức',
  excerpt: 'Mô tả ngắn...',
  content: 'Nội dung đầy đủ...',
  date: '2026-03-01',
  category: 'Thông báo',
  image: '/images/news7.jpg'
}
```

### Thêm/sửa thông tin tuyển sinh cho Chatbot

Mở file `app/api/chat/route.ts`, tìm biến `TUYEN_SINH_CONTEXT` và chỉnh sửa nội dung.

## 🌐 Cách public website lên Internet

### Cách 1: Deploy lên Vercel (MIỄN PHÍ - Khuyến nghị)

1. Tạo tài khoản tại: https://vercel.com
2. Cài đặt Vercel CLI:
   ```bash
   npm install -g vercel
   ```
3. Đăng nhập:
   ```bash
   vercel login
   ```
4. Deploy:
   ```bash
   vercel
   ```
5. Thêm API key trên Vercel:
   - Vào Settings > Environment Variables
   - Thêm `GEMINI_API_KEY` với giá trị API key của bạn

### Cách 2: Deploy lên Netlify (MIỄN PHÍ)

1. Tạo tài khoản tại: https://www.netlify.com
2. Kéo thả thư mục dự án vào Netlify
3. Thêm environment variable `GEMINI_API_KEY`

### Cách 3: Deploy lên VPS (Chi phí)

Nếu muốn host tại Việt Nam:
- Thuê VPS từ các nhà cung cấp: BKNS, Bizfly Cloud, Viettel IDC
- Chi phí: ~100,000 - 300,000 VND/tháng

## 🔧 Cấu trúc thư mục

```
tuyen-sinh-website/
├── app/
│   ├── api/
│   │   └── chat/          # API xử lý chatbot
│   ├── chatbot/           # Trang chatbot
│   ├── tin-tuc/           # Trang tin tức
│   ├── globals.css        # CSS toàn cục
│   ├── layout.tsx         # Layout chính
│   └── page.tsx           # Trang chủ
├── .env.local             # File chứa API key (TẠO SAU)
├── .env.local.example     # Ví dụ file .env
├── package.json           # Danh sách dependencies
└── README.md              # File này
```

## 🆘 Khắc phục sự cố thường gặp

### Lỗi: "Cannot find module"
```bash
npm install
```

### Lỗi: "Port 3000 is already in use"
Đổi port khác:
```bash
npm run dev -- -p 3001
```

### Chatbot không hoạt động
- Kiểm tra file `.env.local` đã tạo chưa
- Kiểm tra API key đã đúng chưa
- Kiểm tra kết nối Internet

### Website không hiển thị đúng
```bash
npm run build
npm start
```

## 📚 Tài liệu tham khảo

- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Google Gemini API: https://ai.google.dev/docs

## 💡 Mở rộng thêm

Bạn có thể thêm các tính năng:
- Upload PDF/DOCX cho chatbot
- Hệ thống đăng ký tài khoản
- Quản lý hồ sơ xét tuyển
- Tra cứu điểm số
- Admin panel

## 📧 Liên hệ hỗ trợ

Nếu gặp khó khăn, có thể:
- Xem lại hướng dẫn trong file này
- Tìm kiếm trên Google
- Hỏi trên các group lập trình Việt Nam

---

✨ **Chúc bạn thành công với dự án!**
