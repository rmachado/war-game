import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { ArrowLeft } from 'lucide-react'

export default function Rules() {
  const [content, setContent] = useState('')

  useEffect(() => {
    fetch('/manual_war_espanol.md')
      .then(res => res.text())
      .then(setContent)
  }, [])

  return (
    <div className="min-h-screen bg-stone-900 text-stone-200">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="text-amber-400 hover:text-amber-300 text-sm mb-6 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Volver al inicio
        </Link>

        <div className="prose prose-invert prose-stone max-w-none
          prose-headings:text-amber-400 prose-headings:font-bold
          prose-h1:text-3xl prose-h1:text-center prose-h1:mb-8
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-stone-700 prose-h2:pb-2
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-amber-300
          prose-p:leading-relaxed prose-p:mb-4
          prose-strong:text-amber-200
          prose-li:marker:text-amber-500
          prose-em:text-amber-300/80
          prose-blockquote:border-amber-600 prose-blockquote:bg-stone-800/50 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:px-4
          prose-code:bg-stone-800 prose-code:text-amber-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-hr:border-stone-700
          prose-table:border-collapse
          prose-th:bg-stone-800 prose-th:text-amber-400 prose-th:px-3 prose-th:py-2
          prose-td:border prose-td:border-stone-700 prose-td:px-3 prose-td:py-2
        ">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
