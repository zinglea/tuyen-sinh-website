'use client'

import React from 'react'

interface FormattedMessageProps {
  content: string
}

// Function to clean up LaTeX and special formatting
function cleanMessage(text: string): string {
  return text
    // Remove LaTeX math delimiters
    .replace(/\$\$(.*?)\$\$/g, '$1')
    .replace(/\$(.*?)\$/g, '$1')
    // Convert markdown bold to something readable
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Function to format text with visual styling
export function formatMessage(text: string): React.ReactNode {
  const cleaned = cleanMessage(text)
  
  // Split by newlines and format
  const lines = cleaned.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Skip empty lines but add spacing
    if (!trimmed) {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    // Headers (lines ending with : and starting with ** or uppercase)
    if (trimmed.match(/^(\*\*|\d+\.|🔹|📌|✅|⚠️|💡|📍|📝|⭐|🎯|📊|📈|💰|🏆|🎓|📚|🔍|👉|➡️|▶️|●|○|■|□)/) || 
        (trimmed.endsWith(':') && trimmed.length < 100)) {
      elements.push(
        <div key={key++} className="mt-3 mb-2">
          <span className="font-bold text-police-dark text-base">
            {trimmed.replace(/\*\*/g, '')}
          </span>
        </div>
      )
      continue
    }

    // Bullet points
    if (trimmed.match(/^[-•\*●○\.]\s/)) {
      const content = trimmed.replace(/^[-•\*●○\.]\s*/, '')
      elements.push(
        <div key={key++} className="flex gap-2 ml-2 my-1">
          <span className="text-police-light mt-1">•</span>
          <span className="text-gray-700">{content}</span>
        </div>
      )
      continue
    }

    // Numbered items
    if (trimmed.match(/^\d+[\.\)]\s/)) {
      const match = trimmed.match(/^(\d+)[\.\)]\s*(.*)/)
      if (match) {
        elements.push(
          <div key={key++} className="flex gap-2 ml-1 my-1">
            <span className="font-bold text-police-light min-w-[24px]">{match[1]}.</span>
            <span className="text-gray-700">{match[2]}</span>
          </div>
        )
        continue
      }
    }

    // Regular text with inline bold
    const parts = trimmed.split(/(\*\*.*?\*\*)/g)
    const formattedParts = parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={idx} className="font-bold text-police-dark">
            {part.slice(2, -2)}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })

    elements.push(
      <p key={key++} className="text-gray-700 my-1 leading-relaxed">
        {formattedParts}
      </p>
    )
  }

  return <>{elements}</>
}

export default function FormattedMessage({ content }: FormattedMessageProps) {
  return (
    <div className="formatted-message">
      {formatMessage(content)}
    </div>
  )
}
