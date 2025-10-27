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
  
  // Split document into paragraphs (by double newlines or long text blocks)
  const paragraphs = document.split(/\n{2,}|\r\n{2,}/).filter(p => p.trim().length > 30)
  
  const relevantParagraphs: { text: string; score: number }[] = []
  
  for (const paragraph of paragraphs) {
    let score = 0
    const lowerParagraph = paragraph.toLowerCase()
    
    // Count keyword matches
    for (const keyword of keywords) {
      if (lowerParagraph.includes(keyword)) {
        score += 1
      }
    }
    
    // Bonus for Arabic text if query is Arabic
    if (isMessageArabic && isArabic(paragraph)) {
      score += 0.5
    }
    
    if (score > 0) {
      relevantParagraphs.push({ text: paragraph.trim(), score })
    }
  }
  
  // Sort by score and get top results
  relevantParagraphs.sort((a, b) => b.score - a.score)
  
  if (relevantParagraphs.length > 0) {
    // Return top 2 paragraphs
    return relevantParagraphs.slice(0, 2).map(p => p.text).join('\n\n')
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
