'use client';

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { searchDiscordUsers } from "@/app/actions/invitations"
import { useDebounce } from "@/hooks/use-debounce"

type DiscordMember = {
    id: string;
    username: string;
    globalName?: string;
    avatar?: string | null;
};

interface DiscordUserPickerProps {
    value?: string;
    onSelect: (discordId: string, member?: DiscordMember) => void;
    disabled?: boolean;
}

export function DiscordUserPicker({ value, onSelect, disabled }: DiscordUserPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedMember, setSelectedMember] = React.useState<DiscordMember | null>(null)

    // Search state
    const [query, setQuery] = React.useState("")
    const debouncedQuery = useDebounce(query, 300)
    const [members, setMembers] = React.useState<DiscordMember[]>([])
    const [loading, setLoading] = React.useState(false)

    // Initial search or fetch if value exists? 
    // Ideally we would fetch the specific user if value is set but searching is okay for now.

    React.useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setMembers([])
            return
        }

        async function fetchMembers() {
            setLoading(true)
            try {
                const results = await searchDiscordUsers(debouncedQuery)
                setMembers(results)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchMembers()
    }, [debouncedQuery])

    const handleSelect = (member: DiscordMember) => {
        setSelectedMember(member)
        onSelect(member.id, member)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700 hover:text-neutral-100"
                >
                    {selectedMember || value ? (
                        <div className="flex items-center gap-2">
                            {selectedMember?.avatar && (
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedMember.avatar} />
                                    <AvatarFallback>{selectedMember.username[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            <span className="truncate">
                                {selectedMember ? (selectedMember.globalName || selectedMember.username) : (value || "Discord User")}
                            </span>
                        </div>
                    ) : (
                        "Select Discord User..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 bg-neutral-800 border-neutral-700">
                <Command shouldFilter={false} className="bg-neutral-800 text-neutral-50">
                    <CommandInput
                        placeholder="Search Discord users..."
                        value={query}
                        onValueChange={setQuery}
                        className="text-neutral-50"
                    />
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                            </div>
                        )}
                        {!loading && members.length === 0 && (
                            <div className="py-6 text-center text-sm text-neutral-400">
                                {query.length < 2 ? "Type to search..." : "No users found."}
                            </div>
                        )}
                        <CommandGroup>
                            {members.map((member) => (
                                <CommandItem
                                    key={member.id}
                                    value={member.id}
                                    onSelect={() => handleSelect(member)}
                                    className="cursor-pointer text-neutral-200 data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-500"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === member.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={member.avatar || undefined} />
                                        <AvatarFallback>{member.username[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{member.globalName || member.username}</span>
                                        <span className="text-xs text-neutral-400">@{member.username}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
