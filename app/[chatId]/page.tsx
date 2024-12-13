import { authOptions } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import ChatInput from "@/components/chatInput";
import Messages from "@/components/messages";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserById } from "@/actions/user";
import { Loader2 } from "lucide-react";

async function page({ params }: { params: { chatId: string } }) {
    const { chatId } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session) {
        return notFound();
    }
    
    const { user } = session;

    const [userId1, userId2] = chatId.split('--');

    if (user.id !== userId1 && user.id !== userId2) {
        return notFound();
    }

    const chatPartnerId = user.id === userId1 ? userId2 : userId1;
    const chatPartnerData = await getUserById(chatPartnerId);

    const initialMessages = await prisma.message.findMany({
        where: {
            chatId: chatId,
        },
        include: {
            sender: true,
        },
    });

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "350px",
            } as React.CSSProperties}
        >
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/">All Inboxes</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{chatPartnerData?.name || <Loader2/>}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>

                <Messages
                    chatId={chatId}
                    initialMessages={initialMessages}
                    userId={user.id}
                    chatPartnerData={chatPartnerData}
                />
                <ChatInput chatId={chatId} chatPartnerId={chatPartnerId}/>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default page;
