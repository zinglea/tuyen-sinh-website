'use client'

import { useEffect, useRef } from 'react'

/**
 * Client component that initializes PPTX slide navigation
 * after the HTML content is rendered via dangerouslySetInnerHTML.
 */
export default function PptxSlideNav({ contentHtml }: { contentHtml: string }) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const presentations = containerRef.current.querySelectorAll('.pptx-presentation')
        presentations.forEach((container) => {
            const slides = container.querySelectorAll('.pptx-slide') as NodeListOf<HTMLElement>
            const prevBtn = container.querySelector('.pptx-prev') as HTMLButtonElement
            const nextBtn = container.querySelector('.pptx-next') as HTMLButtonElement
            const counter = container.querySelector('.pptx-current-num')

            if (!slides.length || !prevBtn || !nextBtn || !counter) return

            let current = 0

            function showSlide(idx: number) {
                slides.forEach((s, i) => {
                    if (i === idx) {
                        s.classList.add('pptx-slide-active')
                    } else {
                        s.classList.remove('pptx-slide-active')
                    }
                })
                current = idx
                counter!.textContent = String(idx + 1)
                prevBtn.disabled = idx === 0
                nextBtn.disabled = idx === slides.length - 1
            }

            prevBtn.addEventListener('click', () => {
                if (current > 0) showSlide(current - 1)
            })
            nextBtn.addEventListener('click', () => {
                if (current < slides.length - 1) showSlide(current + 1)
            })

            // Keyboard navigation
            const pres = container as HTMLElement
            pres.setAttribute('tabindex', '0')
            pres.addEventListener('keydown', (e: Event) => {
                const ke = e as KeyboardEvent
                if (ke.key === 'ArrowLeft' && current > 0) showSlide(current - 1)
                if (ke.key === 'ArrowRight' && current < slides.length - 1) showSlide(current + 1)
            })

            // Touch swipe
            let touchStartX = 0
            pres.addEventListener('touchstart', (e: Event) => {
                const te = e as TouchEvent
                touchStartX = te.touches[0].clientX
            }, { passive: true })
            pres.addEventListener('touchend', (e: Event) => {
                const te = e as TouchEvent
                const diff = touchStartX - te.changedTouches[0].clientX
                if (Math.abs(diff) > 50) {
                    if (diff > 0 && current < slides.length - 1) showSlide(current + 1)
                    if (diff < 0 && current > 0) showSlide(current - 1)
                }
            }, { passive: true })
        })
    }, [contentHtml])

    return (
        <div
            ref={containerRef}
            className="prose prose-sm md:prose-lg prose-slate max-w-none docx-content"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
    )
}
