'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setError(null);
        try {
            // We use server actions or just calling signIn via client
            // Since we used NextAuth v5, we might need to use a server action or the client-side signIn (re-exported)
            // Standard NextAuth client signIn works with Credentials
            const result = await signIn('credentials', {
                email: values.email,
                password: values.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid credentials');
            } else {
                router.refresh();
                router.push('/');
            }
        } catch (e) {
            console.error(e);
            setError('An error occurred');
        }
    }

    return (
        <div className="flex items-center justify-center flex-1 h-full p-4">
            <Card className="w-full max-w-[850px] min-h-[500px] border-neutral-800 bg-neutral-900 text-neutral-50 overflow-hidden grid md:grid-cols-2 p-0 gap-0">
                {/* Left Side: Branding */}
                <div className="relative hidden md:flex flex-col items-center justify-center p-10 bg-[#111111]">
                    <img
                        src="/logo.png"
                        alt="Event Commander Logo"
                        className="w-full h-auto max-w-[300px] object-contain"
                    />
                </div>

                {/* Right Side: Form */}
                <div className="flex flex-col justify-center p-6 md:p-10">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-2xl text-center md:text-left">Welcome Back</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="admin@example.com" {...field} className="bg-neutral-800 border-neutral-700" />
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
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="******" {...field} className="bg-neutral-800 border-neutral-700" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {error && <div className="text-red-500 text-sm">{error}</div>}
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500">Sign In</Button>
                            </form>
                        </Form>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
}
