"use server";
import { prisma } from "../lib/prisma";

export const showFriendRequests = async (userId: string) => {
    const friendRequests = await prisma.friendship.findMany({
        where: {
            friendId: userId,
            status: "pending",
        },
        include: {
            user: true,
        },
    });

    const formattedRequests = friendRequests.map((request) => ({
        id: request.user.id,
        name: request.user.name || "Unknown",
        avatarUrl: request.user.image || null,
        mutualFriends: 0,
        requestedAt: request.createdAt,
    }));

    return JSON.parse(JSON.stringify(formattedRequests));
};

export const getTrashedFriends = async (userId: string) => {
    const trashedFriendships = await prisma.friendship.findMany({
        where: {
            OR: [{ userId }, { friendId: userId }],
            status: "deleted",
        },
        include: {
            user: true,
            friend: true,
        },
    });

    const trashedFriends = trashedFriendships.map((friendship) => {
        if (friendship.userId === userId) {
            return {
                id: friendship.friend.id,
                name: friendship.friend.name,
                avatarUrl: friendship.friend.image || null,
            };
        } else {
            return {
                id: friendship.user.id,
                name: friendship.user.name,
                avatarUrl: friendship.user.image || null,
            };
        }
    });

    return trashedFriends;
};

export const getFriends = async (userId: string) => {
    const friendships = await prisma.friendship.findMany({
        where: {
            OR: [{ userId }, { friendId: userId }],
            status: "accepted",
        },
        include: {
            user: true,
            friend: true,
        },
    });

    const friends = friendships.map((friendship) => {
        if (friendship.userId === userId) {
            return {
                id: friendship.friend.id,
                name: friendship.friend.name,
                avatarUrl: friendship.friend.image || null,
            };
        } else {
            return {
                id: friendship.user.id,
                name: friendship.user.name,
                avatarUrl: friendship.user.image || null,
            };
        }
    });

    return friends;
};

export const sendFriendRequest = async (userId: string, friendId: string) => {
    await prisma.friendship.create({
        data: {
            userId,
            friendId,
            status: "pending",
        },
    });

    console.log(`Friend request sent from User ${userId} to User ${friendId}`);
};

export const sendFriendRequestByEmail = async (
    userId: string,
    friendEmail: string
): Promise<{ success: boolean; message: string; friendId?: string }> => {
    try {
        const friend = await prisma.user.findUnique({
            where: {
                email: friendEmail,
            },
        });

        if (!friend) {
            return {
                success: false,
                message: `No user found with the email: ${friendEmail}`,
            };
        }

        if (userId === friend.id) {
            return {
                success: false,
                message: "You cannot send a friend request to yourself",
            };
        }

        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId, friendId: friend.id },
                    { userId: friend.id, friendId: userId },
                ],
            },
        });

        if (existingFriendship) {
            if (existingFriendship.status === "pending") {
                return {
                    success: false,
                    message:
                        "A friend request is already pending with this user",
                };
            }
            if (existingFriendship.status === "accepted") {
                return {
                    success: false,
                    message: "You are already friends with this user",
                };
            }
        }

        await prisma.friendship.create({
            data: {
                userId,
                friendId: friend.id,
                status: "pending",
            },
        });

        return {
            success: true,
            message: "Friend request sent successfully",
            friendId: friend.id,
        };
    } catch (error) {
        console.error("Error sending friend request by email:", error);

        return {
            success: false,
            message: "Failed to send friend request. Please try again later.",
        };
    }
};

export const acceptFriendRequest = async (userId: string, friendId: string) => {
    await prisma.friendship.updateMany({
        where: {
            userId: friendId,
            friendId: userId,
            status: "pending",
        },
        data: {
            status: "accepted",
        },
    });

    console.log(
        `Friend request accepted between User ${userId} and User ${friendId}`
    );
};

export const rejectFriendRequest = async (userId: string, friendId: string) => {
    await prisma.friendship.deleteMany({
        where: {
            userId: friendId,
            friendId: userId,
            status: "pending",
        },
    });

    console.log(
        `Friend request rejected between User ${userId} and User ${friendId}`
    );
};

export const addFriendShipToTrash = async (
    userId: string,
    friendId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const result = await prisma.friendship.updateMany({
            where: {
                AND: [
                    { status: "accepted" },
                    {
                        OR: [
                            { userId: userId, friendId: friendId },
                            { userId: friendId, friendId: userId },
                        ],
                    },
                ],
            },
            data: {
                status: "deleted",
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: "No active friendship found to move to trash.",
            };
        }

        return {
            success: true,
            message: "Chat moved to trash.",
        };
    } catch (e) {
        console.error("Error moving friendship to trash:", e);

        return {
            success: false,
            message: "Failed to move chat to trash.",
        };
    }
};

export const permamentDeleteFriend = async (
    userId: string,
    friendId: string
) => {
    //TODO remove all messages
    try {
        await prisma.friendship.deleteMany({
            where: {
                AND: [
                    { status: "deleted" },
                    {
                        OR: [
                            { userId: userId, friendId: friendId },
                            { userId: friendId, friendId: userId },
                        ],
                    },
                ],
            },
        });

        console.log(
            `Friend request rejected between User ${userId} and User ${friendId}`
        );
    } catch (error) {
        console.log(error);
    }
};

export const removeFromTrash = async (userId: string, friendId: string) => {
    try {
        await prisma.friendship.updateMany({
            where: {
                AND: [
                    { status: "deleted" },
                    {
                        OR: [
                            { userId: userId, friendId: friendId },
                            { userId: friendId, friendId: userId },
                        ],
                    },
                ],
            },
            data: {
                status: "accepted",
            },
        });

        console.log(
            `Friendship restored from trash between User ${userId} and User ${friendId}`
        );
    } catch (error) {
        console.log(error);
    }
};
