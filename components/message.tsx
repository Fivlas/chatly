import { formatRelativeDate } from "@/lib/utils";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2 } from "lucide-react";

interface chatPartnerData {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface MessageProps extends Message {
    chatPartnerData: chatPartnerData | null;
    messageTimestamp: Date;
}

const Message = ({ content, sender = false, chatPartnerData, messageTimestamp }: MessageProps) => {
    if (!chatPartnerData || !chatPartnerData.name) {
        return <Loader2 className="animate-spin"/>
    }
    return (
        <div className={`flex ${sender ? "justify-end" : "justify-start"} min-w-full items-center`}>
            <div className="flex items-center gap-2 max-w-[55%] w-fit">
                {!sender && (
                    <Avatar className="static">
                        <AvatarImage src={chatPartnerData.image || ""} alt={chatPartnerData.name} />
                        <AvatarFallback>
                            {chatPartnerData.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className="flex flex-col gap-1">
                    {!sender && (
                        <span className="font-medium items-center gap-2 text-sm text-muted-foreground">{chatPartnerData.name}</span>
                    )}
                    <div className={`px-4 py-3 w-fit text-md rounded-lg text-wrap ${sender ? "bg-primary text-primary-foreground" : "bg-muted"}`} title={formatRelativeDate(new Date(messageTimestamp))}>
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
