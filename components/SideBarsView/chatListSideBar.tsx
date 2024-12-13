"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { addFriendShipToTrash, getFriends } from "@/actions/friends";
import { useUser } from "@/hooks/useUser";
import { Skeleton } from "../ui/skeleton";
import { chatHrefConstructor } from "@/lib/utils";
import { socket } from "@/socket";
import { getLastMessage } from "@/actions/messages";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "../ui/context-menu";
import { toast } from "@/hooks/use-toast";
import SideBarChat from "../sideBarChat";

interface ChatListSideBarProps {
    searchQuery: string;
}

interface FriendType {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    lastMessage?: string;
    senderId?: string | null;
}

const ChatListSideBar = ({ searchQuery }: ChatListSideBarProps) => {
    const user = useUser();
    const [friends, setFriends] = useState<FriendType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const handleFriendListRefresh = async (animation = true) => {
        if (!user) return;
        try {
            if (animation) {
                setLoading(true);
            }
            const friendsData = await getFriends(user.id);

            const friendsWithMessages = await Promise.all(
                friendsData.map(async (friend) => {
                    const lastMessageData = await getLastMessage(
                        chatHrefConstructor(user.id, friend.id)
                    );

                    const messageContent =
                        lastMessageData.senderId === user.id
                            ? `You: ${lastMessageData.content}`
                            : lastMessageData.content;

                    return {
                        ...friend,
                        lastMessage: messageContent,
                        senderId: lastMessageData.senderId,
                    };
                })
            );

            setFriends(friendsWithMessages);
        } catch (error) {
            console.error("Error refreshing friend list:", error);
            setError("Failed to refresh friend list.");
        } finally {
            if (animation) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!user) return;

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("refreshFriendListClient", () => handleFriendListRefresh(false));
        handleFriendListRefresh();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("refreshFriendListClient", () => handleFriendListRefresh(false));
        };
    }, [user?.id]);

    const filteredFriends = friends.filter((friend) =>
        //@ts-ignore
        friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContextMoveToTrash = async (friendId: string) => {
        try {
            if (!user?.id) throw new Error();
            const response = await addFriendShipToTrash(user.id, friendId);

            if (response.success) {
                toast({
                    description: response.message,
                });
                await handleFriendListRefresh(false);
            } else {
                toast({
                    description: response.message,
                });
            }
        } catch (e) {
            console.error("Failed to move to trash:", e);

            toast({
                description: "An unexpected error occurred. Please try again later.",
            });
        }
    };

    if (!user) {
        return (
            // <div className="space-y-4 px-4">
            //     {Array.from({ length: 4 }).map((_, index) => (
            //         <div key={index} className="flex items-center space-x-4">
            //             <Skeleton className="h-12 w-12 rounded-full" />
            //             <div className="space-y-2">
            //                 <Skeleton className="h-4 w-[200px]" />
            //                 <Skeleton className="h-4 w-[150px]" />
            //             </div>
            //         </div>
            //     ))}
            // </div>
            <div>
                wqkndwqdwqnk
            </div>
        );
    }

    return (
        <>
            {loading && !isConnected ? (
                <div className="space-y-4 px-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-4"
                        >
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[150px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <p className="text-center text-sm text-red-500">{error}</p>
            ) : (
                <>
                    {filteredFriends.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                            No friends found
                        </p>
                    ) : (
                        filteredFriends.map((friend) => (
                            <ContextMenu key={friend.id}>
                                <ContextMenuTrigger>
                                    <SideBarChat friend={friend} userId={user.id}/>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem className="px-2.5 md:px-2" onClick={() => handleContextMoveToTrash(friend.id)}>
                                        Delete chat
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))
                    )}
                </>
            )}
        </>
    );
};

export default ChatListSideBar;
