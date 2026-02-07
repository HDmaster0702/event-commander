'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function EventsFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isAllEvents = searchParams.get('view') !== 'mine'; // Default to 'all' for admins

    const handleToggle = (checked: boolean) => {
        const params = new URLSearchParams(searchParams);
        if (checked) {
            params.delete('view'); // Default is all
        } else {
            params.set('view', 'mine');
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center space-x-2">
            <Switch
                id="events-filter"
                checked={isAllEvents}
                onCheckedChange={handleToggle}
            />
            <Label htmlFor="events-filter" className="text-neutral-400">
                {isAllEvents ? "All Events" : "My Events"}
            </Label>
        </div>
    );
}
