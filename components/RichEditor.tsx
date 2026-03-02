'use client'

import { useRef, useCallback, useState } from 'react'
import {
    Bold, Italic, Underline, List, ListOrdered,
    Heading1, Heading2, AlignLeft, AlignCenter, AlignRight,
    Link2, Image, Minus, Undo, Redo, Type, Smile
} from 'lucide-react'

interface RichEditorProps {
    value: string
    onChange: (html: string) => void
    placeholder?: string
}

const EMOJI_GROUPS = [
    { label: '😊 Biểu cảm', emojis: ['😊', '😃', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😮', '😢', '😡', '🤗', '🙏', '👋', '👍', '👎', '👏', '🤝', '💪', '🎉'] },
    { label: '📌 Ký hiệu', emojis: ['✅', '❌', '⚠️', '📌', '📍', '🔴', '🟢', '🟡', '🔵', '⭐', '❤️', '💯', '🔥', '✨', '💡', '📢', '🔔', '⏰', '📎', '🔗'] },
    { label: '📋 Công việc', emojis: ['📋', '📝', '📄', '📊', '📈', '📉', '📅', '🗓️', '📁', '📂', '🏷️', '🔍', '🔒', '🔓', '✏️', '📧', '📞', '💻', '🖥️', '📱'] },
    { label: '🎓 Giáo dục', emojis: ['🎓', '📚', '📖', '🏫', '👨‍🎓', '👩‍🎓', '📐', '🔬', '🏆', '🥇', '🥈', '🥉', '🎯', '✍️', '🎓', '👨‍💼', '👩‍💼', '🏛️', '⚖️', '🛡️'] },
]

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [showEmoji, setShowEmoji] = useState(false)

    const exec = useCallback((command: string, value?: string) => {
        document.execCommand(command, false, value)
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML)
        }
        editorRef.current?.focus()
    }, [onChange])

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML)
        }
    }, [onChange])

    const insertLink = () => {
        const url = prompt('Nhập URL liên kết:')
        if (url) exec('createLink', url)
    }

    const insertImage = () => {
        const url = prompt('Nhập URL hình ảnh:')
        if (url) exec('insertImage', url)
    }

    const insertEmoji = (emoji: string) => {
        editorRef.current?.focus()
        document.execCommand('insertText', false, emoji)
        handleInput()
    }

    const toolbarGroups = [
        {
            label: 'Hoàn tác',
            buttons: [
                { icon: <Undo className="w-4 h-4" />, cmd: 'undo', title: 'Hoàn tác (Ctrl+Z)' },
                { icon: <Redo className="w-4 h-4" />, cmd: 'redo', title: 'Làm lại (Ctrl+Y)' },
            ]
        },
        {
            label: 'Định dạng',
            buttons: [
                { icon: <Bold className="w-4 h-4" />, cmd: 'bold', title: 'In đậm (Ctrl+B)' },
                { icon: <Italic className="w-4 h-4" />, cmd: 'italic', title: 'In nghiêng (Ctrl+I)' },
                { icon: <Underline className="w-4 h-4" />, cmd: 'underline', title: 'Gạch chân (Ctrl+U)' },
            ]
        },
        {
            label: 'Tiêu đề',
            buttons: [
                { icon: <Type className="w-4 h-4" />, cmd: 'formatBlock', val: 'p', title: 'Văn bản thường' },
                { icon: <Heading1 className="w-4 h-4" />, cmd: 'formatBlock', val: 'h2', title: 'Tiêu đề lớn' },
                { icon: <Heading2 className="w-4 h-4" />, cmd: 'formatBlock', val: 'h3', title: 'Tiêu đề nhỏ' },
            ]
        },
        {
            label: 'Danh sách',
            buttons: [
                { icon: <List className="w-4 h-4" />, cmd: 'insertUnorderedList', title: 'Danh sách gạch đầu dòng' },
                { icon: <ListOrdered className="w-4 h-4" />, cmd: 'insertOrderedList', title: 'Danh sách đánh số' },
            ]
        },
        {
            label: 'Căn lề',
            buttons: [
                { icon: <AlignLeft className="w-4 h-4" />, cmd: 'justifyLeft', title: 'Căn trái' },
                { icon: <AlignCenter className="w-4 h-4" />, cmd: 'justifyCenter', title: 'Căn giữa' },
                { icon: <AlignRight className="w-4 h-4" />, cmd: 'justifyRight', title: 'Căn phải' },
            ]
        },
        {
            label: 'Chèn',
            buttons: [
                { icon: <Link2 className="w-4 h-4" />, action: insertLink, title: 'Chèn liên kết' },
                { icon: <Image className="w-4 h-4" />, action: insertImage, title: 'Chèn hình ảnh' },
                { icon: <Minus className="w-4 h-4" />, cmd: 'insertHorizontalRule', title: 'Đường kẻ ngang' },
            ]
        },
    ]

    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition relative">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 flex flex-wrap gap-0.5">
                {toolbarGroups.map((group, gi) => (
                    <div key={gi} className="flex items-center gap-0.5">
                        {gi > 0 && <div className="w-px h-6 bg-slate-200 mx-1"></div>}
                        {group.buttons.map((btn, bi) => (
                            <button
                                key={bi}
                                type="button"
                                title={btn.title}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    if ('action' in btn && btn.action) {
                                        btn.action()
                                    } else if (btn.cmd) {
                                        exec(btn.cmd, ('val' in btn ? btn.val : undefined) as string | undefined)
                                    }
                                }}
                                className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                            >
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                ))}
                {/* Emoji button */}
                <div className="flex items-center gap-0.5">
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                        type="button"
                        title="Chèn emoji"
                        onMouseDown={(e) => { e.preventDefault(); setShowEmoji(!showEmoji) }}
                        className={`p-1.5 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition ${showEmoji ? 'bg-blue-100 text-blue-600' : ''}`}
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Emoji Picker */}
            {showEmoji && (
                <div className="bg-white border-b border-slate-200 p-3 max-h-48 overflow-y-auto">
                    {EMOJI_GROUPS.map((group, gi) => (
                        <div key={gi} className="mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{group.label}</p>
                            <div className="flex flex-wrap gap-1">
                                {group.emojis.map((emoji, ei) => (
                                    <button
                                        key={ei}
                                        type="button"
                                        onClick={() => { insertEmoji(emoji); setShowEmoji(false) }}
                                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-blue-50 rounded-lg transition"
                                        title={emoji}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onPaste={(e) => {
                    e.preventDefault()
                    const html = e.clipboardData.getData('text/html')
                    const text = e.clipboardData.getData('text/plain')

                    if (html) {
                        const cleaned = html
                            .replace(/<meta[^>]*>/gi, '')
                            .replace(/<link[^>]*>/gi, '')
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                            .replace(/class="[^"]*"/gi, '')
                            .replace(/style="[^"]*"/gi, '')
                            .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
                            .replace(/<!--[\s\S]*?-->/g, '')
                            .replace(/<\/?span[^>]*>/gi, '')
                            .replace(/<\/?font[^>]*>/gi, '')
                        document.execCommand('insertHTML', false, cleaned)
                    } else {
                        document.execCommand('insertText', false, text)
                    }
                    handleInput()
                }}
                dangerouslySetInnerHTML={{ __html: value }}
                className="min-h-[300px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm text-slate-800 focus:outline-none prose prose-sm max-w-none
          [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-800 [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-slate-700 [&_h3]:mt-3 [&_h3]:mb-1.5
          [&_p]:mb-2 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2
          [&_li]:mb-1
          [&_a]:text-blue-600 [&_a]:underline
          [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2
          [&_hr]:my-4 [&_hr]:border-slate-200
        "
                data-placeholder={placeholder || 'Soạn nội dung bài viết tại đây...'}
                style={{ position: 'relative' }}
            />

            {/* Placeholder CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    pointer-events: none;
                    position: absolute;
                }
            `}} />
        </div>
    )
}
