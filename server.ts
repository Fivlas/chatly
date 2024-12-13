import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(handle);

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        socket.on("setUserIdOwnRoom", (userId) => {
            console.log(`joined ${userId}`)
            socket.join(userId);
        })

        socket.on("revokeUserIdOwnRoom", (userId) => {
            socket.leave(userId);
        })

        socket.on("join-room", (chatId) => {
            socket.join(chatId);
        });

        socket.on("leave-room", (chatId) => {
            socket.leave(chatId);
        });

        socket.on("send-message", (chatId, senderId, message, messageTimestamp) => {
            io.to(chatId).emit("new-message", senderId, message, messageTimestamp);
        });

        socket.on("sendToast", (reciverId, senderId, message) => {
            io.to(reciverId).emit("sendToastClient", senderId, message);
        })

        socket.on("sendFriendRequest", (reciverId) => {
            io.to(reciverId).emit("sendFriendRequestClient");
        });

        socket.on("refreshFriendList", (reciverId) => {
            console.log(reciverId)
            io.to(reciverId).emit("refreshFriendListClient");
        })

        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://localhost:${port}`);
        });
});