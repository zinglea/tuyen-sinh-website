'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Bot, User, Loader2, Trash2, Sparkles } from 'lucide-react'
import FormattedMessage from '@/components/FormattedMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function Chatbot() {
  const [sessionId, setSessionId] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng. Tôi có thể giúp bạn giải đáp các thắc mắc về tuyển sinh. Bạn muốn hỏi gì?'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize session ID from localStorage or create new one
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatbot_session_id')
    if (storedSessionId) {
      setSessionId(storedSessionId)
    } else {
      const newSessionId = generateSessionId()
      setSessionId(newSessionId)
      localStorage.setItem('chatbot_session_id', newSessionId)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Lỗi khi gọi API')
      }

      const data = await response.json()

      // Update session ID if server returns a new one
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
        localStorage.setItem('chatbot_session_id', data.sessionId)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lỗi không xác định'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearConversation = () => {
    // Clear local session
    localStorage.removeItem('chatbot_session_id')
    const newSessionId = generateSessionId()
    setSessionId(newSessionId)
    localStorage.setItem('chatbot_session_id', newSessionId)

    // Reset messages
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý AI của Phòng Tổ chức cán bộ - Công an tỉnh Cao Bằng. Tôi có thể giúp bạn giải đáp các thắc mắc về tuyển sinh. Bạn muốn hỏi gì?'
    }])
  }

  const suggestedQuestions = [
    'Điều kiện tuyển sinh là gì?',
    'Các ngành đào tạo có gì?',
    'Lệ phí tuyển sinh gồm những gì?',
    'Thời gian đăng ký khi nào?',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-slate-600 hover:text-police-light transition">
              <div className="p-2 rounded-xl bg-slate-100 hover:bg-police-100 transition">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium hidden sm:inline">Quay lại</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-police-light to-police-dark flex items-center justify-center shadow-lg shadow-police-light/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-800 block leading-tight">Trợ lý AI</span>
                <span className="text-xs text-slate-500">Tuyển sinh CAND</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/tin-tuc" className="hidden sm:flex items-center gap-1 text-police-light hover:text-police-dark font-semibold transition px-3 py-2 rounded-xl hover:bg-police-50">
                Tin tức
              </Link>
              <button
                onClick={clearConversation}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="Xóa lịch sử trò chuyện"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-4 py-4 max-w-3xl flex flex-col">
        {/* Messages */}
        <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/50 p-4 mb-4 overflow-y-auto border border-white" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 mb-5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-police-light to-police-dark flex items-center justify-center flex-shrink-0 shadow-lg shadow-police-light/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                  ? 'bg-gradient-to-br from-police-light to-police-dark text-white rounded-br-md'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md'
                  }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed">
                    <FormattedMessage content={message.content} />
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-police-light to-police-dark flex items-center justify-center shadow-lg shadow-police-light/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-police-light animate-spin" />
                  <span className="text-sm text-slate-500">Đang suy nghĩ...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 text-center">Gợi ý câu hỏi:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-blue-50 hover:text-blue-600 transition shadow-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 p-3 border border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về tuyển sinh..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-police-light/50 focus:border-police-light text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-police-light to-police-dark text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-police-light/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Info Note */}
        <p className="text-xs text-slate-400 text-center mt-3">
          💡 Các thông tin AI cung cấp chỉ mang tính chất tham khảo, thí sinh cần đối chiếu với thông tin chính thức từ Bộ Công an
        </p>
      </div>
    </div>
  )
}
