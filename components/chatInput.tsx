"use client";
import React, { FormEvent, useRef, useState, useEffect } from "react";
import { Button } from "./ui/button";
import { LucideImage, LucideSend } from "lucide-react";
import { Input } from "./ui/input";
import { sendMessage } from "@/actions/messages";
import { useUser } from "@/hooks/useUser";
import { socket } from "@/socket";

const ChatInput = ({
    chatId,
    chatPartnerId,
}: {
    chatId: string;
    chatPartnerId: string;
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const user = useUser();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessageHandler = async (e: FormEvent) => {
        e.preventDefault();
        const messageText = inputRef.current?.value?.trim();
        if (!messageText || !user || !user.id) return;

        setIsLoading(true);

        try {
            const messageData = await sendMessage(chatId, user.id, messageText);

            socket.emit(
                "send-message",
                messageData.chatId,
                messageData.senderId,
                messageData.content,
                messageData.createdAt
            );
            //TODO Remove notyfication if in trash
            // const isInTrash = await getF
            socket.emit("sendToast", chatPartnerId, user.id, messageText);
            socket.emit("refreshFriendList", chatPartnerId);
            socket.emit("refreshFriendList", user.id);

            if (inputRef.current) {
                inputRef.current.value = "";
            }
        } catch (error) {
            console.error(
                "Something went wrong while sending the message:",
                error
            );
        } finally {
            setIsLoading(false);
            inputRef.current?.focus(); // fix it
        }
    };

    return (
        <div className="sticky bottom-0 flex shrink-0 items-center border-t bg-background p-6">
            <form
                onSubmit={sendMessageHandler}
                className="flex w-full space-x-2"
            >
                <Input
                    className="flex-1 focus-visible:ring-transparent"
                    ref={inputRef}
                    disabled={isLoading}
                    placeholder="Send Message"
                />
                <Button
                    className="p-2 aspect-square"
                    type="button"
                    disabled={isLoading}
                >
                    <LucideImage />
                </Button>
                <Button
                    className="p-2 aspect-square"
                    type="submit"
                    disabled={isLoading}
                >
                    <LucideSend />
                </Button>
            </form>
        </div>
    );
};

export default ChatInput;
