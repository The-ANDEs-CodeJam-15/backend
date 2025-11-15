import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" },
});

// in-memory session store (lasts until server restarts)
const sessionStore = {};
const rooms = {};

io.on("connection", (socket) => {
  const incomingSessionID = socket.handshake.auth.sessionID;

  // restore existing session
  if (incomingSessionID && sessionStore[incomingSessionID]) {
    socket.sessionID = incomingSessionID;
    console.log("restored session", socket.sessionID);
  } else {
    // create new session
    socket.sessionID = crypto.randomUUID();
    sessionStore[socket.sessionID] = {};
    console.log("new session", socket.sessionID);
  }

  // send session back
  socket.emit("session", {
    sessionID: socket.sessionID,
  });

  // handle room host
  socket.on("create_room", () => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket.join(roomCode);

    rooms[socket.sessionID] = roomCode; // track user → room

    socket.emit("room_created", roomCode);
  });

  socket.on("join_room", (roomCode) => {
    socket.join(roomCode);
    rooms[socket.sessionID] = roomCode;
  });
});

server.listen(3001, () => {
  console.log("Socket server running on 3001");
});
