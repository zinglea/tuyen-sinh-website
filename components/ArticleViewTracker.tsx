'use client'

import { useEffect } from 'react'

export default function ArticleViewTracker({ articleId, category }: { articleId: string, category: string }) {
    useEffect(() => {
        const hasViewed = sessionStorage.getItem(`viewed_article_${articleId}`)

        if (!hasViewed) {
            fetch('/api/track-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'news',
                    id: articleId,
                    category: category
                })
            }).then(res => {
                if (res.ok) {
                    sessionStorage.setItem(`viewed_article_${articleId}`, 'true')
                }
            }).catch(e => console.error('Tracking failed:', e))
        }
    }, [articleId, category])

    return null
}
