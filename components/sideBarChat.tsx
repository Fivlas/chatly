import { chatHrefConstructor } from "@/lib/utils";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface FriendType {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    lastMessage?: string;
    senderId?: string | null;
}

interface SideBarChatProps {
    friend: FriendType;
    userId: string;
}

const SideBarChat = ({ friend, userId }: SideBarChatProps) => {
    return (
        <a
            href={chatHrefConstructor(friend.id, userId)}
            className="cursor-pointer flex flex-col items-start gap-2 whitespace-nowrap border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
            <div className="flex w-full items-center gap-2">
                <Avatar>
                    <AvatarImage
                        src={friend.avatarUrl || undefined}
                        alt={friend.name || "Unknown"}
                    />
                    <AvatarFallback>
                        {friend.name ? friend.name.slice(0, 2).toUpperCase() : "NA"}
                    </AvatarFallback>
                </Avatar>
                <span>{friend.name || "Unknown"}</span>
                <span className="ml-auto text-xs">09:34 AM</span>
            </div>
            <span className="line-clamp-2 max-w-[260px] whitespace-break-spaces text-xs">
                {friend.lastMessage || ""}
            </span>
        </a>
    );
};

export default SideBarChat;
