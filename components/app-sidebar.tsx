"use client";

import * as React from "react";
import {
    ArchiveX,
    Command,
    MessagesSquare,
    Send,
    Trash2,
    UserPlus,
} from "lucide-react";

import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/hooks/useUser";
import ChatListSideBar from "./SideBarsView/chatListSideBar";
import SearchInput from "./searchInput";
import { Button } from "./ui/button";
import { sendFriendRequestByEmail } from "@/actions/friends";
import { socket } from "@/socket";
import { useToast } from "@/hooks/use-toast";
import FriendRequestListSideBar from "./SideBarsView/friendRequestListSideBar";
import TrashListSideBar from "./SideBarsView/trashListSideBar";

const data = {
    navMain: [
        { title: "Chats", url: "#", icon: MessagesSquare, isActive: true },
        { title: "Friend Requests", url: "#", icon: UserPlus, isActive: false },
        { title: "Trash", url: "#", icon: Trash2, isActive: false },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
    const { setOpen } = useSidebar();
    const user = useUser();
    const [searchQuery, setSearchQuery] = React.useState<string>("");
    const { toast } = useToast();
    const { isMobile } = useSidebar()

    React.useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            if (!user?.id) return
            socket.emit("setUserIdOwnRoom", user.id);
        }

        function onDisconnect() {
            if (!user?.id) return
            socket.emit("revokeUserIdOwnRoom", user.id);
        }


        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [user?.id]);

    const renderView = () => {
        switch (activeItem.title) {
            case "Chats":
                return <ChatListSideBar searchQuery={searchQuery} />;
            case "Friend Requests":
                return <FriendRequestListSideBar searchQuery={searchQuery}/>
            case "Trash":
                return <TrashListSideBar searchQuery={searchQuery}/>
            default:
                return <div>Select an item to view its content</div>;
        }
    };

    const addFriend = async () => {
        try {
            if (!searchQuery.trim()) {
                toast({
                    description: "Please enter a valid email address.",
                });
                return;
            }
    
            const response = await sendFriendRequestByEmail(user?.id as string, searchQuery.trim());
    
            if (response.success) {
                socket.emit("sendFriendRequest", response.friendId);
                socket.emit("sendToast", response.friendId, user?.id, "New friend request");
    
                toast({
                    description: response.message
                });
            } else {
                toast({
                    description: response.message,
                });
            }
        } catch (error) {
            console.error("Unexpected error sending friend request:", error);
    
            toast({
                description: "An unexpected error occurred. Please try again later."
            });
        } finally {
            setSearchQuery("");
        }
    };
    

    return (
        <Sidebar
            collapsible="icon"
            className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
            {...props}
        >
            {/* Primary Sidebar */}
            <Sidebar
                collapsible="none"
                className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r"
            >
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="md:h-8 md:p-0"
                            >
                                <a href="#">
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        <Command className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            Acme Inc
                                        </span>
                                        <span className="truncate text-xs">
                                            Enterprise
                                        </span>
                                    </div>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent className="px-1.5 md:px-0">
                            <SidebarMenu>
                                {data.navMain.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            tooltip={{
                                                children: item.title,
                                                hidden: isMobile,
                                            }}
                                            onClick={() => {
                                                setActiveItem(item);
                                                setOpen(true);
                                            }}
                                            isActive={
                                                activeItem.title === item.title
                                            }
                                            className="px-2.5 md:px-2"
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                <SidebarGroupContent className="md:hidden">
                                    {renderView()}
                                </SidebarGroupContent>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <NavUser user={user} />
                </SidebarFooter>
            </Sidebar>

            {/* Secondary Sidebar */}
            <Sidebar collapsible="none" className="hidden flex-1 md:flex">
                <SidebarHeader className="gap-3.5 border-b p-4">
                    <div className="flex w-full items-center justify-between">
                        <div className="text-base font-medium text-foreground">
                            {activeItem.title}
                        </div>
                    </div>

                    <div className="flex w-full space-x-2 items-center">
                        <SearchInput
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                        />
                        <Button className="aspect-square p-2" onClick={addFriend}>
                            <UserPlus/>
                        </Button>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="px-0">
                        <SidebarGroupContent>
                            {renderView()}
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </Sidebar>
    );
}
