import { Loader2 } from 'lucide-react'

// Render logic:
// Inside the messages.map:
{
    message.role === 'assistant' ? (
        <div className="text-sm leading-relaxed">
            <FormattedMessage content={message.content} />
            {/* NEW: Streaming Indicator */}
            {isStreaming && index === messages.length - 1 && (
                <span className="inline-flex items-center ml-2 space-x-1">
                    <span className="w-1.5 h-1.5 bg-police-light rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-police-light rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-police-light rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </span>
            )}
        </div>
    ) : ...
}

// And replace the global isLoading indicator with this so it only shows before the first chunk
// (Currently it shows during isLoading, but streaming may start quickly)
// Wait, currently isLoading is set to false right before streaming starts. That is correct.
