
import { validateInvitation, acceptInvitation } from "@/app/actions/invitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteForm } from "./invite-form";

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    // Validate Token Server-Side
    const { token } = await params;
    const { valid, error, invite } = await validateInvitation(token);

    if (!valid || !invite) {
        return (
            <div className="flex-1 h-full flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-neutral-900 border-red-900/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-red-500">Invitation Invalid</CardTitle>
                        <CardDescription className="text-neutral-400">
                            {error || "This invitation link is invalid or has expired."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Button asChild variant="outline" className="border-neutral-700 hover:bg-neutral-800 text-neutral-200">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-neutral-900 border-neutral-800">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <img src="/logo_notext.png" alt="Event Commander Logo" className="h-16 w-16 object-contain" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-neutral-50">Setup Your Account</CardTitle>
                    <CardDescription className="text-neutral-400">
                        You've been invited to join Event Commander as a <strong>{invite.role}</strong>.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InviteForm token={token} />
                </CardContent>
            </Card>
        </div>
    );
}
