import { Server } from "socket.io";

const rooms = new Map();        // roomId => Set(socketId)
const messages = new Map();     // roomId => [{ sender, data, socketId }]
const socketRoom = new Map();   // socketId => roomId

export const connectTosocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        transports: ["websocket"], // more stable for WebRTC
    });

    io.on("connection", (socket) => {
        console.log("✅ Connected:", socket.id);

        /* ---------------- JOIN ROOM ---------------- */
        socket.on("join-call", (roomId) => {
            try {
                if (!roomId) return;

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Set());
                }

                const room = rooms.get(roomId);

                if (room.has(socket.id)) return;

                room.add(socket.id);
                socketRoom.set(socket.id, roomId);

                // Send existing users to new peer
                socket.emit("existing-users", [...room].filter(id => id !== socket.id));

                // Notify others
                socket.to(roomId).emit("user-joined", socket.id);

                socket.join(roomId);

                // Send chat history
                if (messages.has(roomId)) {
                    messages.get(roomId).forEach(msg => {
                        socket.emit("chat-message", msg.data, msg.sender, msg.socketId);
                    });
                }
            } catch (err) {
                console.error("Join error:", err);
            }
        });

        /* ---------------- SIGNALING ---------------- */
        socket.on("signal", ({ to, data }) => {
            try {
                if (!to || !data) return;
                io.to(to).emit("signal", {
                    from: socket.id,
                    data
                });
            } catch (err) {
                console.error("Signal error:", err);
            }
        });

        /* ---------------- CHAT ---------------- */
        socket.on("chat-message", (data, sender) => {
            try {
                const roomId = socketRoom.get(socket.id);
                if (!roomId) return;

                if (!messages.has(roomId)) {
                    messages.set(roomId, []);
                }

                const msg = {
                    sender,
                    data,
                    socketId: socket.id
                };

                messages.get(roomId).push(msg);

                io.to(roomId).emit("chat-message", data, sender, socket.id);
            } catch (err) {
                console.error("Chat error:", err);
            }
        });

        /* ---------------- LEAVE ROOM ---------------- */
        const leaveRoom = () => {
            const roomId = socketRoom.get(socket.id);
            if (!roomId) return;

            const room = rooms.get(roomId);
            if (!room) return;

            room.delete(socket.id);
            socket.to(roomId).emit("user-left", socket.id);

            if (room.size === 0) {
                rooms.delete(roomId);
                messages.delete(roomId);
            }

            socketRoom.delete(socket.id);
            socket.leave(roomId);
        };

        socket.on("leave-call", leaveRoom);
        socket.on("disconnect", leaveRoom);
    });

    return io;
};
