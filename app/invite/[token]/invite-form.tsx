'use client';

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { acceptInvitation } from "@/app/actions/invitations";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

interface InviteFormProps {
    token: string;
}

export function InviteForm({ token }: InviteFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("email", values.email);
            formData.append("password", values.password);

            try {
                const res = await acceptInvitation(token, formData);
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Account created! Redirecting...");
                    // Redirect handled by server action but backup here
                    setTimeout(() => window.location.href = "/login?verified=true", 1000);
                }
            } catch (error) {
                toast.error("Something went wrong");
                console.error(error);
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-200">Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} className="bg-neutral-800 border-neutral-700 text-neutral-200" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-200">Email Address</FormLabel>
                            <FormControl>
                                <Input placeholder="john@example.com" {...field} className="bg-neutral-800 border-neutral-700 text-neutral-200" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-200">Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} className="bg-neutral-800 border-neutral-700 text-neutral-200" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-neutral-200">Confirm Password</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} className="bg-neutral-800 border-neutral-700 text-neutral-200" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </Button>
            </form>
        </Form>
    );
}
