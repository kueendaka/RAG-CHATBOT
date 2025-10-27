import { NextRequest, NextResponse } from 'next/server'

// Mock knowledge base for testing
const knowledgeBase: { [key: string]: string } = {
  'what is rag': 'RAG stands for Retrieval-Augmented Generation. It\'s a technique that enhances AI responses by retrieving relevant information from a knowledge base before generating an answer. This makes the AI more accurate and contextually aware.',
  'how does it work': 'RAG works by first converting documents into embeddings (vector representations), then when a question is asked, it searches for similar content in the knowledge base, and finally uses that retrieved context along with the question to generate a comprehensive answer.',
  'what are the benefits': 'RAG provides several benefits: it gives more accurate and up-to-date information by grounding responses in actual data, allows the AI to cite sources, reduces hallucinations, and enables the system to work with proprietary or domain-specific knowledge.',
  'vector database': 'A vector database stores information as high-dimensional vectors (embeddings) that capture semantic meaning. This allows for semantic search, where you can find relevant information based on meaning rather than just exact keyword matches.',
  'embeddings': 'Embeddings are numerical representations of text that capture semantic meaning. Similar texts have similar embedding vectors, which is why they can be used for semantic search and finding relevant information.',
  'llm': 'LLM stands for Large Language Model. These are AI models trained on vast amounts of text that can understand and generate human-like text. Examples include GPT-4, Claude, and Llama models.',
}

// Simple similarity search (keyword-based for demo)
function findRelevantContext(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  for (const [key, value] of Object.entries(knowledgeBase)) {
    if (lowerMessage.includes(key)) {
      return value
    }
  }
  
  return 'I can help you understand RAG systems, vector databases, embeddings, and related AI/ML concepts. Please ask me a more specific question.'
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get relevant context from knowledge base
    const context = findRelevantContext(message)
    
    // Generate a response (in production, this would use Groq API)
    const response = `${context}`
    
    return NextResponse.json({
      response,
      // Remove sources for cleaner display
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
