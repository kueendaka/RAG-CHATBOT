'use client'

import { useState } from 'react'
import ChatInterface from '@/components/ChatInterface'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          RAG Chatbot
        </h1>
        <p className="text-center text-gray-300 mb-8">
          A Retrieval-Augmented Generation chatbot powered by Groq API
        </p>
        <ChatInterface />
      </div>
    </main>
  )
}
