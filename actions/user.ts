"use server"

import { prisma } from "@/lib/prisma";

export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    return user;
};