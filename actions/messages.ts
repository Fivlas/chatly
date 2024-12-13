"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

export async function sendMessage(
    chatId: string,
    senderId: string,
    message: string
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error("Unauthorized");
    }

    const { user } = session;

    if (user.id !== senderId) {
        throw new Error("Unauthorized");
    }

    if (!chatId || !message) {
        throw new Error("Invalid data");
    }

    try {
        const messageData = await prisma.message.create({
            data: {
                chatId,
                senderId,
                content: message,
            },
        });
        return messageData;
    } catch (error) {
        console.error("Failed to send message:", error);
        throw new Error("Failed to send message");
    }
}

export async function getLastMessage(chatId: string) {
    try {
        const lastMessage = await prisma.message.findFirst({
            where: {
                chatId: chatId
            },
            orderBy: { createdAt: "desc" },
        });
        
        return {
            content: lastMessage?.content || 'No messages yet.',
            senderId: lastMessage?.senderId || null,
        };
    } catch (error) {
        console.error("Error fetching last message:", error);
        throw new Error("Failed to fetch last message.");
    }
}