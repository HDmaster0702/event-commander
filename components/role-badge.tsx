import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
    role: Role | string;
    variant?: "text" | "badge";
    className?: string; // Allow extra styling
}

export function RoleBadge({ role, variant = "badge", className }: RoleBadgeProps) {
    // Normalize role string just in case
    const normalizedRole = role.toUpperCase();

    let label = role;
    let colorClass = "text-neutral-400 bg-neutral-400/10 border-neutral-400/20"; // Default

    switch (normalizedRole) {
        case "SUPER_ADMIN":
            label = "Super Admin";
            colorClass = variant === "text"
                ? "text-red-500"
                : "text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20";
            break;
        case "ADMIN":
            label = "Administrator";
            colorClass = variant === "text"
                ? "text-orange-500"
                : "text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20";
            break;
        case "ANNOUNCER":
            label = "Announcer";
            colorClass = variant === "text"
                ? "text-blue-400"
                : "text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20";
            break;
        default:
            // Fallback for unknown roles (e.g. USER if it still existed)
            label = role.toString();
            break;
    }

    if (variant === "text") {
        return (
            <span className={cn("text-[10px] uppercase tracking-wider font-bold", colorClass, className)}>
                {label}
            </span>
        );
    }

    return (
        <Badge variant="outline" className={cn("font-mono text-xs font-normal", colorClass, className)}>
            {label}
        </Badge>
    );
}
