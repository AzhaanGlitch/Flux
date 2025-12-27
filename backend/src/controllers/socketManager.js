// backend/src/controllers/socketManager.js (Updated)
import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};
let participantNames = {}; // NEW: Store usernames

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    io.on("connection", (socket) => {
        console.log("✅ SOCKET CONNECTED:", socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Notify all participants in the room
            for (let i = 0; i < connections[path].length; i++) {
                io.to(connections[path][i]).emit(
                    "user-joined", 
                    socket.id, 
                    connections[path]
                );
            }

            // Send existing messages to new joiner
            if (messages[path] !== undefined) {
                for (let i = 0; i < messages[path].length; i++) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][i]['data'],
                        messages[path][i]['sender'],
                        messages[path][i]['socket-id-sender']
                    );
                }
            }

            console.log(`👤 ${socket.id} joined room: ${path}. Total: ${connections[path].length}`);
        });

        // NEW: Handle username broadcasts
        socket.on("username", (username) => {
            participantNames[socket.id] = username;
            console.log(`📝 Username set: ${socket.id} = ${username}`);
            
            // Find which room this socket is in
            const room = Object.keys(connections).find(key => 
                connections[key].includes(socket.id)
            );
            
            if (room) {
                // Broadcast username to all participants in room
                connections[room].forEach(participantId => {
                    io.to(participantId).emit("username", socket.id, username);
                });
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                });

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // NEW: Screen share events
        socket.on("screen-share-started", (sharerSocketId) => {
            console.log(`🖥️ Screen share started: ${sharerSocketId}`);
            
            // Find room and broadcast to all participants
            const room = Object.keys(connections).find(key => 
                connections[key].includes(socket.id)
            );
            
            if (room) {
                connections[room].forEach(participantId => {
                    if (participantId !== socket.id) {
                        io.to(participantId).emit("screen-share-started", sharerSocketId);
                    }
                });
            }
        });

        socket.on("screen-share-stopped", (sharerSocketId) => {
            console.log(`🛑 Screen share stopped: ${sharerSocketId}`);
            
            const room = Object.keys(connections).find(key => 
                connections[key].includes(socket.id)
            );
            
            if (room) {
                connections[room].forEach(participantId => {
                    if (participantId !== socket.id) {
                        io.to(participantId).emit("screen-share-stopped", sharerSocketId);
                    }
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`👋 SOCKET DISCONNECTED: ${socket.id}`);
            
            const diffTime = Math.abs(timeOnline[socket.id] - new Date());
            delete participantNames[socket.id];

            for (const [roomKey, roomValue] of Object.entries(connections)) {
                const index = roomValue.indexOf(socket.id);
                
                if (index !== -1) {
                    // Notify all other participants
                    for (let i = 0; i < connections[roomKey].length; i++) {
                        io.to(connections[roomKey][i]).emit('user-left', socket.id);
                    }

                    // Remove from room
                    connections[roomKey].splice(index, 1);

                    // Clean up empty rooms
                    if (connections[roomKey].length === 0) {
                        delete connections[roomKey];
                        delete messages[roomKey];
                    }
                    
                    break;
                }
            }
        });
    });

    return io;
};