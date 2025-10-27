'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Detect if text is primarily Arabic
function isArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/
  const matches = text.match(arabicRegex)
  return matches ? matches.length > text.length * 0.3 : false
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Error:', error)
      const errorMsg = isArabic(input)
        ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
        : 'Sorry, I encountered an error. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-2xl">
        {/* Messages */}
        <div className="h-96 overflow-y-auto mb-4 space-y-4 pr-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p>Start a conversation with the RAG chatbot...</p>
              <p className="text-sm mt-2 opacity-75">
                ابدأ محادثة مع روبوت قياس / Start chatting with QIYAS bot
              </p>
              <p className="text-xs mt-2 opacity-60">
                Available in English and Arabic / متاح بالعربية والإنجليزية
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMsgArabic = isArabic(msg.content)
              return (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-white'
                    } ${isMsgArabic ? 'text-right rtl' : 'text-left'}`}
                  >
                    <p className={`whitespace-pre-wrap ${isMsgArabic ? 'font-arabic' : ''}`}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اسأل سؤالاً... / Ask a question..."
            dir="auto"
            className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
