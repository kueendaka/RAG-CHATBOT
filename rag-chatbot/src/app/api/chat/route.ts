import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Load QIYAS document content
function loadQIYASDocument(): string {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'qiyas_text.txt')
    const content = fs.readFileSync(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error loading QIYAS document:', error)
    return ''
  }
}

// Detect if text is primarily Arabic
function isArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF]/
  const matches = text.match(arabicRegex)
  return matches ? matches.length > text.length * 0.3 : false
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  // Remove special characters and split by spaces
  const words = text.toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
  return words
}

// Find relevant context in document
function findRelevantContext(message: string, document: string, isMessageArabic: boolean): string {
  const keywords = extractKeywords(message)
  
  // Split document into chunks (lines or sentences)
  // First try splitting by single newlines for shorter chunks
  const lines = document.split(/\n/).filter(line => line.trim().length > 10)
  
  const relevantChunks: { text: string; score: number }[] = []
  
  // Combine consecutive lines into paragraphs of reasonable size
  let currentChunk = ''
  let chunkSize = 0
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Skip very short lines or header lines with only numbers
    if (trimmedLine.length < 10 || /^\s*\d+\s*$/.test(trimmedLine)) {
      continue
    }
    
    currentChunk += trimmedLine + ' '
    chunkSize++
    
    // Create chunks of 3-5 lines or if we hit a natural break
    if (chunkSize >= 3 && (chunkSize >= 5 || trimmedLine.match(/[.!?]$/))) {
      if (currentChunk.length > 20) {
        const chunk = currentChunk.trim()
        let score = 0
        const lowerChunk = chunk.toLowerCase()
        
        // Count keyword matches
        for (const keyword of keywords) {
          if (lowerChunk.includes(keyword)) {
            score += 1
          }
        }
        
        // Bonus for Arabic text if query is Arabic
        if (isMessageArabic && isArabic(chunk)) {
          score += 0.5
        }
        
        if (score > 0) {
          relevantChunks.push({ text: chunk, score })
        }
      }
      
      currentChunk = ''
      chunkSize = 0
    }
  }
  
  // Handle remaining chunk
  if (currentChunk.trim().length > 20) {
    const chunk = currentChunk.trim()
    let score = 0
    const lowerChunk = chunk.toLowerCase()
    
    for (const keyword of keywords) {
      if (lowerChunk.includes(keyword)) {
        score += 1
      }
    }
    
    if (isMessageArabic && isArabic(chunk)) {
      score += 0.5
    }
    
    if (score > 0) {
      relevantChunks.push({ text: chunk, score })
    }
  }
  
  // Sort by score and get top results
  relevantChunks.sort((a, b) => b.score - a.score)
  
  if (relevantChunks.length > 0) {
    // Return top 3 chunks for better context
    return relevantChunks.slice(0, 3).map(c => c.text).join('\n\n')
  }
  
  // If no exact match, try broader search with single words
  if (keywords.length > 0) {
    for (const line of lines) {
      if (line.trim().length > 20) {
        const lowerLine = line.toLowerCase()
        for (const keyword of keywords) {
          if (lowerLine.includes(keyword)) {
            return line.trim()
          }
        }
      }
    }
  }
  
  // Default response in appropriate language
  if (isMessageArabic) {
    return 'يمكنني مساعدتك بمعلومات عن قياس (QIYAS) - المركز الوطني للقياس في المملكة العربية السعودية. يرجى طرح أسئلة حول خدماتهم أو إجراءاتهم أو تقييماتهم.'
  } else {
    return 'I can help you with information about QIYAS (قِيَاس) - the Saudi Arabia national exam center. Please ask about their services, procedures, or assessments.'
  }
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

    // Detect if message is in Arabic
    const isMessageArabic = isArabic(message)
    
    // Load QIYAS document
    const document = loadQIYASDocument()
    
    if (!document) {
      const errorMessage = isMessageArabic 
        ? 'عذراً، لا يمكنني الوصول إلى وثيقة قياس في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً.'
        : 'Sorry, I am unable to access the QIYAS document at the moment. Please try again later.'
      
      return NextResponse.json({
        response: errorMessage,
      })
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Get relevant context from document
    const context = findRelevantContext(message, document, isMessageArabic)
    
    return NextResponse.json({
      response: context,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
