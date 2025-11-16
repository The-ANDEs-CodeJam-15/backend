import { Server } from "socket.io";
import http from "http";
import crypto from "crypto";
import Player from "./player.js";
import Room from "./room.js"
import Song from "./song.js"

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: "*" },
});

// in-memory session store (lasts until server restarts)
const sessionStore = {};
const players = {};
const rooms = {};

//const onEventName = () => { };

io.on("connection", (socket) => {
  const incomingSessionID = socket.handshake.auth.sessionID;


  // restore existing session
  if (incomingSessionID && sessionStore[incomingSessionID]) {
    socket.sessionID = incomingSessionID;
    player = players[socket.sessionID];
    player.updateSocketID(socket.id);
    console.log("restored session", socket.sessionID);
  } else {
    // create new session
    socket.sessionID = crypto.randomUUID();
    sessionStore[socket.sessionID] = {};

    // create new player object and add to players store
    const new_player = new Player(socket.sessionID, socket.id);
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

    if (userName === "") {
      console.log("Join request with empty user name rejected")
      socket.emit("join error", { "Need to specify a user name!": string })
      return;
    }

    console.log("User named", userName, "is attempting to join room", roomCode);
    const room = rooms[roomCode]
    const player = players[socket.sessionID];

    if (room) {
      console.log("User", userName, "is trying to join room", roomCode);

      // Determine if the user name is taken
      /*
      const nameTaken = false;
      for (let i = 0; i < room.players.length; i++) {
        if (userName === players[i].userName) {
          nameTaken = true;
          break;
        }
      }

      if (nameTaken) {
        socket.emit("join_error", { "User name taken!": string });
        console.log("Request to join rejected; name is taken")
      } else {*/
        // Try to add to room!
        const success = room.addPlayer(player);
        if (success) {
          // Finalize player's multiplayer details
          player.roomCode = roomCode;
          player.userName = userName;
          socket.join(roomCode);
          socket.emit("room_joined", { roomCode: roomCode });
        } else {
          console.log("Request to join rejected; game already started")
          socket.emit("join_error", { "Game has already started!": string })
        }
      //}
    }
    else {
      console.log("Request to join rejected; room does not exist");
      socket.emit("join_error", { "Room does not exist!": string });
    }
    console.log("current players in room:", rooms[roomCode].players.map(p => p.userName));
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

  socket.on("get_dropdown_options", async ({ entry }) => {
    try {
      const res = await fetch(`https://api.deezer.com/search?q=${entry}&limit=5`);
      const data = await res.json();
      //parse song data to usable/consistent format
      const parsed_data = data.data.map(
        t => new Song(t.id, t.title, t.artist.name, null, null)
      )

     //console.log("Parsed Data for Dropdown", parsed_data)

      socket.emit("activate_dropdown", { dropDownData: parsed_data })
    } catch (err) {
      console.error("Failed to fetch query results", err);
    }
    // // Search your song database for matches
    // const matches = songs.filter(song =>
    //   song.name.toLowerCase().includes(guess.toLowerCase())
    // ).slice(0, 10); // Return max 10 suggestions

    // socket.emit("autocomplete_suggestions", {
    //   suggestions: matches.map(s => s.name)
    // });
  });

  socket.on("submit_guess", ({ song }) => {
    const player = players[socket.sessionID];
    const roomCode = player.roomCode;
    const room = rooms[roomCode];
    room.submitPlayerGuess(player, song, socket);
  });

  socket.on("curse_player", ({ opSessionID, selectedCurseIndex }) => {
    const player = players[socket.sessionID];
    const opPlayer = players[opSessionID];
    player.cursePlayer(opPlayer, selectedCurseIndex, io)
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
