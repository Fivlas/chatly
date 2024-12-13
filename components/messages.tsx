"use client";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "@/socket";
import { Loader2 } from "lucide-react";
import Message from "./message";

interface Message {
    senderId: string;
    content: string;
    createdAt: Date;
}

interface chatPartnerData {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface MessagesProps {
    initialMessages: Message[];
    userId: string;
    chatId: string;
    chatPartnerData: chatPartnerData | null;
}

const Messages = ({ initialMessages, userId, chatId, chatPartnerData }: MessagesProps) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages || []);
    const messageEndRef = useRef<HTMLDivElement | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const scrollToBottom = () => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            socket.emit("join-room", chatId);
        }

        function onDisconnect() {
            setIsConnected(false);
            socket.emit("leave-room", chatId);
        }

        function handleNewMessage(senderId: Message["senderId"], content: Message["content"], createdAt: Message["createdAt"]): void {
            setMessages((prevMessages) => [...prevMessages, { senderId, content, createdAt }]);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("new-message", handleNewMessage);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("new-message", handleNewMessage);
        };
    }, [chatId]);

    return (
        <div className="flex flex-1 flex-col gap-4 px-6 pt-6 overflow-y-auto">
            <div className="space-y-4">
                {isConnected ? (
                    messages.map((message, index) => {
                        const isSender = message.senderId === userId;
                        return (
                            <Message
                                content={message.content}
                                key={index}
                                sender={isSender}
                                chatPartnerData={chatPartnerData}
                                messageTimestamp={message.createdAt}
                            />
                        );
                    })
                ) : (
                    <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin" />
                    </div>
                )}
                <div ref={messageEndRef}></div>
            </div>
        </div>
    );
};

export default Messages;