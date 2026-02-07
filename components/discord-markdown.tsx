import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface DiscordMarkdownProps {
    content: string;
    className?: string;
}

export function DiscordMarkdown({ content, className }: DiscordMarkdownProps) {
    if (!content) return null;

    // Pre-process custom Discord syntax
    const processContent = (text: string) => {
        if (!text) return "";
        let processed = text;

        // Spoilers: ||text|| -> <span class="spoiler">text</span>
        processed = processed.replace(/\|\|(.*?)\|\|/g, '<span class="bg-[#1e1f22] text-transparent hover:text-white hover:bg-neutral-700 rounded px-1 py-0.5 cursor-pointer transition-colors duration-75 select-none">$1</span>');

        // Underline: __text__ -> <u>text</u>
        processed = processed.replace(/__(.*?)__/g, '<u>$1</u>');

        return processed;
    };

    return (
        <div className={cn("text-[14px] text-[#dbdee1] font-light overflow-hidden whitespace-pre-wrap break-words prose-inv:no-underline prose-a:text-[#00b0f4]", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Override standard elements to match Discord styling
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2 first:mt-0" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold text-white mt-2 mb-1" {...props} />,
                    h4: ({ node, ...props }) => <h4 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                    strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                    em: ({ node, ...props }) => <span className="italic" {...props} />,
                    u: ({ node, ...props }) => <u className="underline underline-offset-2" {...props} />,
                    del: ({ node, ...props }) => <del className="line-through text-neutral-400" {...props} />,
                    a: ({ node, ...props }) => <a className="text-[#00b0f4] hover:underline" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-1 last:mb-0 leading-[1.375rem]" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-neutral-600 pl-3 my-2 text-neutral-400 block max-w-full" {...props} />,
                    code: ({ node, className, ...props }) => {
                        return <code className="bg-[#1e1f22] rounded px-1.5 py-0.5 font-mono text-[85%]" {...props} />
                    },
                    pre: ({ node, ...props }) => (
                        <pre className="bg-[#2b2d31] border border-[#1e1f22] rounded p-2 my-2 overflow-x-auto font-mono text-sm leading-relaxed" {...props} />
                    ),
                }}
            >
                {processContent(content)}
            </ReactMarkdown>
        </div>
    );
}
