# Hệ thống Chatbot RAG với Conversation Memory

## 🧠 Tính năng nhớ ngữ cảnh (Conversation History)

Chatbot giờ đã có khả năng **nhớ lịch sử cuộc trò chuyện**, giúp trả lời các câu hỏi liên quan đến nhau một cách chính xác và liên tục.

## 🎯 Ví dụ sử dụng

### Ví dụ 1: Hỏi về các năm khác nhau
```
User: "Cách tính điểm phương thức 3 năm 2026 như thế nào?"
AI: [Trả lời về cách tính điểm năm 2026]

User: "Còn năm 2025 thì sao?"
AI: [So sánh với năm 2026 đã nói trước đó và trả lời về năm 2025]
```

### Ví dụ 2: Hỏi tiếp theo chủ đề
```
User: "Điều kiện về chiều cao là gì?"
AI: Nam >= 1.64m, Nữ >= 1.58m...

User: "Còn cân nặng thì sao?"
AI: [Hiểu là đang hỏi tiếp về điều kiện sức khỏe, trả lời về cân nặng]
```

### Ví dụ 3: Tham chiếu thông tin cũ
```
User: "Thời hạn nộp hồ sơ năm nay khi nào?"
AI: [Trả lời về năm 2026]

User: "Năm trước thì sao?"
AI: [So sánh với năm 2025 đã nộp trong tháng X...]
```

## 🔧 Cách hoạt động

### Lưu trữ
- **Server-side**: Lưu 10 tin nhắn gần nhất trong bộ nhớ (Map)
- **Client-side**: Lưu `sessionId` trong localStorage
- **Thời gian**: Session tồn tại cho đến khi server restart hoặc user xóa

### Luồng xử lý
1. User gửi tin nhắn → Frontend gửi kèm `sessionId`
2. Server tìm lịch sử của session đó
3. Thêm câu hỏi mới vào lịch sử
4. Tìm kiếm RAG (nếu có)
5. Build prompt với: Context + RAG + Conversation History + Question
6. Gửi cho Gemini AI
7. Lưu câu trả lời vào lịch sử
8. Trả về response + sessionId

## 📝 Prompt Structure

```
[SYSTEM CONTEXT - Tuyển sinh 2026]

[RAG RESULTS - Từ documents/images nếu có]

[CONVERSATION HISTORY - 10 tin nhắn gần nhất]
1. Thí sinh: ...
2. Trợ lý AI: ...
3. Thí sinh: ...

[CÂU HỎI HIỆN TẠI]

=> AI trả lời dựa trên toàn bộ context
```

## 🚀 Hướng dẫn sử dụng cho User

### Bắt đầu cuộc trò chuyện mới
- Click nút **"Xóa lịch sử"** để bắt đầu session mới
- Hoặc đóng tab và mở lại

### Cách hỏi hiệu quả

✅ **Nên:**
- Hỏi rõ ràng từ đầu: "Cách tính điểm năm 2026"
- Dùng từ ngữ liên kết: "còn", "thế còn", "vậy", "năm trước/ năm sau"
- Hỏi tiếp trong cùng chủ đề để AI nhận context

❌ **Không nên:**
- Hỏi quá 10 câu liên tiếp (sẽ mất context cũ)
- Nhảy chủ đề đột ngột không liên quan
- Dùng đại từ không rõ ràng: "nó", "cái đó" (khi chưa thiết lập context)

### Từ khóa đặc biệt AI hiểu
- `"năm nay"` → 2026
- `"năm sau"` → 2027
- `"năm trước"` → 2025
- `"còn"` / `"thế còn"` → So sánh với câu trước

## 🔐 Quản lý Session

### Tự động
- Mỗi tab browser = 1 session ID duy nhất
- Session lưu trong localStorage, không mất khi refresh
- Tối đa 10 tin nhắn được nhớ (cũ nhất bị xóa)

### Thủ công
```javascript
// Xóa session trong browser
localStorage.removeItem('chatbot_session_id')
location.reload()
```

## 📊 Giới hạn & Lưu ý

| Giới hạn | Giá trị | Ý nghĩa |
|----------|---------|---------|
| Max history | 10 messages | Giữ context gần nhất |
| Message length (stored) | 200 chars | Chỉ lưu tóm tắt |
| Session lifetime | Server restart | Lưu trong RAM server |
| Rate limit | 10 req/min | Chống spam |

### Lưu ý quan trọng:
1. **Server restart** = Mất tất cả conversation history
2. **Production**: Nên dùng Redis thay vì in-memory Map
3. **Privacy**: Không lưu PII (personally identifiable information)

## 🛠️ Nâng cấp Production

Nếu cần lưu trữ lâu dài, hãy:

1. **Thay Map bằng Redis:**
```typescript
// Thay vì const conversationStore = new Map()
// Dùng Redis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);
```

2. **Thêm database persistence:**
```typescript
// Lưu vào MongoDB/PostgreSQL
await db.conversations.create({
  sessionId,
  messages,
  createdAt: new Date(),
});
```

3. **Tăng giới hạn tin nhắn:**
```typescript
const MAX_HISTORY = 50; // Hoặc cao hơn
```

## 🐛 Debug

### Kiểm tra session đang hoạt động
```javascript
// Trong console browser
console.log(localStorage.getItem('chatbot_session_id'));
```

### Xem conversation trên server
```typescript
// Trong API route
console.log('Active sessions:', conversationStore.size);
console.log('Current session:', conversationStore.get(sessionId));
```

### Test API trực tiếp
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cách tính điểm năm 2026?",
    "sessionId": "test-session-123"
  }'
```

## 📚 Knowledge Base + Conversation History

Kết hợp cả hai để có trải nghiệm tốt nhất:

1. **Đặt file tài liệu** vào `knowledge-base/documents/`
2. **Chạy script xử lý** để tạo vector store
3. **Trò chuyện** với AI - nó sẽ vừa tìm RAG vừa nhớ context

Ví dụ tối ưu:
```
User: "Theo thông báo 123, điều kiện tuyển sinh là gì?"
AI: [Tìm trong RAG file "thong-bao-123.pdf" và trả lời]

User: "Còn chiều cao thì sao?"
AI: [Nhớ context từ câu trước + tìm trong cùng file và trả lời]
```
