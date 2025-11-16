import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import Player from "./player.js";
import Room from "./room.js"

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" },
});

// in-memory session store (lasts until server restarts)
const sessionStore = {};
const user_rooms_mapping = {};
const players = {};
const rooms = {};

const onEventName = () => { };

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

    // create new player object and add to players store
    const new_player = new Player(socket.sessionID);
    players[socket.sessionID] = new_player;

    console.log("new session", socket.sessionID);
  }

  // send session back
  socket.emit("session", {
    sessionID: socket.sessionID,
  });

  // handle room host
  socket.on("create_room", ({ userName }) => {
    const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    socket.join(roomCode);

    // get player object of host from players store
    const hostPlayer = players[socket.sessionID];

    // update player obj info
    hostPlayer.roomCode = roomCode; // track user to room
    hostPlayer.userName = userName; // set userName

    // create new room and add to rooms store
    rooms[roomCode] = new Room(roomCode, hostPlayer, io)
    console.log("new room created", roomCode);
    socket.emit("room_created", { roomCode: roomCode });

  });

  socket.on("close_room", ({ roomCode }) => {
    //close room logic; validate that the sender is the host
  });

  socket.on("join_room", ({ roomCode, userName }) => {
    /* COME BACK TO THIS: handle case where user tries to join a room that is in progress, and that their session ID does not belong to */
    console.log("attempting to join room", roomCode);
    if (rooms[roomCode]) {
      console.log("user", userName, "is joining room", roomCode);
      socket.join(roomCode);

      // get player object of host from players store
      const player = players[socket.sessionID];

      player.roomCode = roomCode;
      player.userName = userName; // set userName

      rooms[roomCode].addPlayer(player);

      console.log("current players in room:", rooms[roomCode].players.map(p => p.userName));
      
      socket.emit("room_joined", { roomCode: roomCode });
    }
    else {
      console.log("room join error: room does not exist");
      socket.emit("join_error", {});
    }
  });

  socket.on("request_start_game", () => {
    const player = players[socket.sessionID];
    const roomCode = player.roomCode;
    const room = rooms[roomCode];
  
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (room.host_player.sessionID !== socket.sessionID) {
      socket.emit("error", { message: "Only host can start" });
      return;
    }

    room.startGame();
  });

  socket.on("submit_guess", ({ trackID }) => {
    const player = players[socket.sessionID];
    const roomCode = player.roomCode;
    const room = rooms[roomCode];
    room.submitPlayerGuess(player, trackID, socket);
  });

  socket.on("ready_status", () => {
    console.log("Attempting to mark player as ready")
    const player = players[socket.sessionID];
    const roomCode = player.roomCode;
    const room = rooms[roomCode];
    room.setPlayerReady(player);
  })
});

server.listen(3001, () => {
  console.log("Socket server running on 3001");
});
