import { format } from 'date-fns';
import { EventFormValues } from '@/lib/schemas';
import { FileText, Users } from 'lucide-react';
import { DiscordMarkdown } from '@/components/discord-markdown';

interface DiscordPreviewProps {
    data: Partial<EventFormValues>;
    author?: {
        name: string;
        image?: string | null;
    };
}

export function DiscordPreview({ data, author }: DiscordPreviewProps) {
    return (
        <div className="w-full max-w-md">
            {/* The Embed */}
            <div className="bg-[#313338] rounded-md p-4 shadow-lg font-sans text-white border-l-4 border-blue-500">
                {/* Author */}
                {author && (
                    <div className="flex items-center gap-2 mb-2">
                        {author.image ? (
                            <img src={author.image} alt={author.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-600" />
                        )}
                        <span className="text-sm font-semibold text-white">{author.name}</span>
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                    {data.name || "Event Title"}
                </h3>

                {/* Description */}
                <DiscordMarkdown
                    content={data.description || "Event description will appear here..."}
                    className="mb-4"
                />

                {/* Fields Grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[14px]">
                    <div>
                        <div className="font-semibold text-[#b5bac1] text-xs uppercase mb-1">Time</div>
                        <div className="text-[#dbdee1]">
                            {data.startTime
                                ? format(data.startTime, "MMM d, yyyy h:mm a")
                                : "Not set"}
                        </div>
                    </div>

                </div>

                {/* Banner Image */}
                {data.bannerUrl && (
                    <div className="mt-4 rounded-md overflow-hidden">
                        <img
                            src={data.bannerUrl}
                            alt="Event Banner"
                            className="w-full h-auto object-cover max-h-[300px]"
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="mt-2 flex items-center gap-2 text-xs text-[#949ba4]">
                    <span>Today at {format(new Date(), 'h:mm a')}</span>
                </div>
            </div>

            {/* Discord Buttons (Components) */}
            {(data.sitrepUrl || data.rosterUrl || data.modlistUrl) && (
                <div className="mt-2 flex flex-wrap gap-3">
                    {data.sitrepUrl && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-[4px] text-sm font-medium transition-colors cursor-pointer select-none">
                            <FileText size={16} />
                            SITREP
                        </div>
                    )}
                    {data.rosterUrl && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#248046] hover:bg-[#1a6334] text-white rounded-[4px] text-sm font-medium transition-colors cursor-pointer select-none">
                            <Users size={16} />
                            Roster
                        </div>
                    )}
                    {data.modlistUrl && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#4f545c] hover:bg-[#40444b] text-white rounded-[4px] text-sm font-medium transition-colors cursor-pointer select-none">
                            <span>🛠️</span>
                            Modlist
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
