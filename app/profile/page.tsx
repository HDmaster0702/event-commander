
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.email) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-center sm:text-left mx-auto max-w-2xl">My Profile</h1>
            <ProfileForm user={user} />
        </div>
    );
}
