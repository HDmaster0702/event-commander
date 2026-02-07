import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Globe, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeZoneToggleProps {
    communityTimeZone: string;
    userTimeZone: string | undefined;
    mode: 'community' | 'user';
    onModeChange: (mode: 'community' | 'user') => void;
}

export function TimeZoneToggle({ communityTimeZone, userTimeZone, mode, onModeChange }: TimeZoneToggleProps) {
    // If no user timezone or it's the same as community, don't show toggle
    if (!userTimeZone || userTimeZone === communityTimeZone) {
        return null;
    }

    return (
        <div className="flex items-center space-x-3 bg-neutral-900/50 p-1.5 rounded-lg border border-neutral-800 w-fit">
            <div
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors text-xs font-medium",
                    mode === 'community'
                        ? "bg-blue-900/20 text-blue-400"
                        : "text-neutral-500 hover:text-neutral-400"
                )}
                onClick={() => onModeChange('community')}
            >
                <Globe className="h-3 w-3" />
                <span>{communityTimeZone}</span>
            </div>

            <Switch
                id="timezone-mode"
                checked={mode === 'user'}
                onCheckedChange={(checked) => onModeChange(checked ? 'user' : 'community')}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-neutral-700"
            />

            <div
                className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-colors text-xs font-medium",
                    mode === 'user'
                        ? "bg-blue-900/20 text-blue-400"
                        : "text-neutral-500 hover:text-neutral-400"
                )}
                onClick={() => onModeChange('user')}
            >
                <User className="h-3 w-3" />
                <span>{userTimeZone}</span>
            </div>
        </div>
    );
}
