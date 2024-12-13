"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LucideCheck, X } from "lucide-react";
import { Button } from "../ui/button";
import { useUser } from "@/hooks/useUser";
import {
    showFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
} from "@/actions/friends";
import { Skeleton } from "../ui/skeleton";
import { socket } from "@/socket";

interface FriendRequest {
    id: string;
    name: string;
    avatarUrl: string;
    mutualFriends: number;
}

interface FriendListSideBarProps {
    searchQuery: string;
}

const FriendRequestItem: React.FC<{
    request: FriendRequest;
    onAccept: (friendId: string) => void;
    onReject: (friendId: string) => void;
}> = ({ request, onAccept, onReject }) => {
    return (
        <a
            key={request.id}
            className="flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
            <div className="flex w-full items-center gap-2">
                <Avatar>
                    <AvatarImage src={request.avatarUrl} alt={request.name} />
                    <AvatarFallback>
                        {request.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                        {request.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {request.mutualFriends} mutual friends
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAccept(request.id)}
                    >
                        <LucideCheck className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(request.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </a>
    );
};

const FriendRequestListSideBar: React.FC<FriendListSideBarProps> = ({
    searchQuery,
}) => {
    const user = useUser();
    const [pendingFriendRequests, setPendingFriendRequests] = useState<
        FriendRequest[]
    >([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchFriendRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                const requests = await showFriendRequests(user.id);
                setPendingFriendRequests(requests);
            } catch (error) {
                console.error("Failed to fetch friend requests:", error);
                setError("Failed to fetch friend requests.");
            } finally {
                setLoading(false);
            }
        };

        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        async function handleFriendRequest() {
            if (!user) return;
            try {
                const requests = await showFriendRequests(user.id);
                setPendingFriendRequests(requests);
            } catch (e) {
                console.log(e);
            }
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("sendFriendRequestClient", handleFriendRequest);

        fetchFriendRequests();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("sendFriendRequestClient", handleFriendRequest);
        };
    }, [user?.id]);

    if (!user) {
        return (
            <div className="space-y-4 px-4">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
            </div>
        );
    }

    const handleAcceptRequest = async (friendId: string) => {
        try {
            await acceptFriendRequest(user.id, friendId);
            setPendingFriendRequests((prevRequests) =>
                prevRequests.filter((request) => request.id !== friendId)
            );

            socket.emit("refreshFriendList", friendId);
        } catch (error) {
            console.error("Failed to accept friend request:", error);
        }
    };

    const handleRejectRequest = async (friendId: string) => {
        try {
            await rejectFriendRequest(user.id, friendId);
            setPendingFriendRequests((prevRequests) =>
                prevRequests.filter((request) => request.id !== friendId)
            );
        } catch (error) {
            console.error("Failed to reject friend request:", error);
        }
    };

    const filteredRequests = pendingFriendRequests.filter((request) =>
        request.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col">
            {loading && !isConnected ? (
                <div className="space-y-4 px-4">
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                </div>
            ) : error ? (
                <p className="text-center text-sm text-red-500">{error}</p>
            ) : (
                <>
                    {filteredRequests.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                            No pending friend requests
                        </p>
                    ) : (
                        filteredRequests.map((request) => (
                            <FriendRequestItem
                                key={request.id}
                                request={request}
                                onAccept={handleAcceptRequest}
                                onReject={handleRejectRequest}
                            />
                        ))
                    )}
                </>
            )}
        </div>
    );
};

export default FriendRequestListSideBar;
