"use client";
import React, { useEffect, useState } from "react";
import {
    addFriendShipToTrash,
    getFriends,
    getTrashedFriends,
    permamentDeleteFriend,
    removeFromTrash,
} from "@/actions/friends";
import { useUser } from "@/hooks/useUser";
import { Skeleton } from "../ui/skeleton";
import { chatHrefConstructor } from "@/lib/utils";
import { socket } from "@/socket";
import { getLastMessage } from "@/actions/messages";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "../ui/context-menu";
import SideBarChat from "../sideBarChat";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ChatListSideBarProps {
    searchQuery: string;
}

const TrashListSideBar = ({ searchQuery }: ChatListSideBarProps) => {
    const user = useUser();
    const { toast } = useToast();
    const [trashedFriends, setTrashedFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

    const handleTrashedFriendListRefresh = async (animation = true) => {
        if (!user) return;
        try {
            if (animation) {
                setLoading(true);
            }
            const trashedFriendsData = await getTrashedFriends(user.id);

            const trashedFriendsWithMessages = await Promise.all(
                trashedFriendsData.map(async (friend) => {
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

            setTrashedFriends(trashedFriendsWithMessages);
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
        socket.on("refreshFriendListClient", () =>
            handleTrashedFriendListRefresh(false)
        );
        handleTrashedFriendListRefresh();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("refreshFriendListClient", () =>
                handleTrashedFriendListRefresh(false)
            );
        };
    }, [user?.id]);

    const filteredTrashedFriends = trashedFriends.filter((friend) =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContextPermDelete = (friendId: string) => {
        setSelectedFriendId(friendId);
        setOpenDialog(true);
    };

    const handleDeleteConfirmation = async () => {
        if (selectedFriendId) {
            console.log(`Deleting friend with ID: ${selectedFriendId}`);
            try {
                if (!user) return;
                await permamentDeleteFriend(user.id, selectedFriendId);
            } catch (error) {
                console.log(error);
            } finally {
                setOpenDialog(false); 
            }
        }
    };

    const handleRemoveFromTrash = async (friendId: string) => {
        if (!friendId || !user) return;
        try {
            await removeFromTrash(user.id, friendId);
            handleTrashedFriendListRefresh();
            toast({
                description: "Removed friend from trash",
            })
        } catch (error) {
            console.log(error);
            toast({
                description: "Error removing friend from trash",
                variant: "destructive"
            });
        }

    }

    const handleCancelDelete = () => {
        setOpenDialog(false);
    };

    if (!user) {
        return (
            <div className="space-y-4 px-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                ))}
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
                    {filteredTrashedFriends.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                            No trashed chats
                        </p>
                    ) : (
                        filteredTrashedFriends.map((friend) => (
                            <ContextMenu key={friend.id}>
                                <ContextMenuTrigger>
                                    <SideBarChat
                                        friend={friend}
                                        userId={user.id}
                                    />
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem
                                        className="px-2.5 md:px-2"
                                        onClick={() =>
                                            handleContextPermDelete(friend.id)
                                        }
                                    >
                                        Permanent delete
                                    </ContextMenuItem>
                                    <ContextMenuItem
                                        className="px-2.5 md:px-2"
                                        onClick={() =>
                                            handleRemoveFromTrash(friend.id)
                                        }
                                    >
                                        Remove from trash
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))
                    )}
                </>
            )}

            {/* AlertDialog for permanent deletion */}
            <AlertDialog open={openDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will
                            permanently delete your account and remove
                            your friendship with this person.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancelDelete}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirmation}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default TrashListSideBar;
