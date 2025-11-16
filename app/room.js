import { time } from "console";
import Player from "./player.js";
import Playlist from "./playlist.js";

const DEFAULT_DURATION = 10;
const INITIAL_START_TIME = 5;

class Room {
  constructor(roomCode, hostPlayer, io) {
    this.roomCode = roomCode;
    this.host_player = hostPlayer;
    this.io = io
    this.players = [hostPlayer];
    this.songs = [];
    this.currentSong = null;
    this.totalRounds = 10;
    this.currentRound = 1;
    this.sequence = 0;
    this.running = false;
  }

  

  // 1. Overall game management



  addPlayer(player) {
    if (this.players.find(p => p.sessionID === player.sessionID)) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  async startGame() {
    console.log("starting game")
    // Load the songs - for now we will hardcode the playlist - use id 5339620562
    const playlistID = 5339620562;
    const playlist = new Playlist(playlistID);
    await playlist.fetchTracks();
    this.songs = playlist.getRandomSongs(this.totalRounds);
    console.log("songs:")
    console.log(this.songs)

    // Ensure points start at 0; important when restarting after a previous round
    
    for (let i=0; i < this.players.length; i++) {
      this.players[i].resetPoints();
    }

    // Will set up initial page structure; first transition from default loading page
    console.log("trying to start game: emitting 'game_starting' to clients")
    this.io.to(this.roomCode).emit("game_starting", {});

    // Round starts set to 1; will be updated during curse sequences
    this.updateSong()
  }

  endGame() {
    //this.stopTimer();
    this.isRoundActive = false;
    
    // Calculate final scores, etc.
    this.io.to(this.roomCode).emit("game_ended", {
      // Send final results
      totalRounds: this.totalRounds
    });
  }

  updateSong() {
    this.currentSong = this.songs[this.currentRound - 1]; //are we indexing from 1?
  }

  setPlayerReady(player) {
    player.setReady(true);
    console.log("Player ", player.userName, " is ready!")
    let allReady = true
    for (let i = 0; i < this.players.length; i++) {
      allReady = allReady && this.players[i].isReady
    }
    //console.log("Overall ready status at this time: ", allReady)

    if (allReady && !this.running) {
        console.log("all ready!")
        for (let i = 0; i < this.players.length; i++) {
            player.setReady(false);
        }
        console.log("initial countdown")
        this.io.to(this.roomCode).emit("initial_countdown", ({ }));
        console.log("starting gameloop")
        this.gameLoop();
        this.running = true;
    }
  }



  // 2. Round management (rounds divided into timed "sequences")

  async gameLoop() {
    await this.countdownToNext(INITIAL_START_TIME);
    while (this.currentRound <= this.totalRounds) {
      console.log("\nROUND STARTING\n", this.currentRound);
      if (this.currentRound > 1) {
        await this.startCurseSequence();
      }
      await this.startGuessingSequence();
      await this.startResultsSequence();
      this.currentRound++;
    }
  }

  async startCurseSequence() {
    console.log("starting curse sequence")
    // FIRST SEQUENCE OF A ROUND (aside from first round)

    // if all rounds done break

    this.currentRound++;
    
    if (this.currentRound > this.totalRounds) {
      this.endGame();
      return;
    }

    this.updateSong()

-   this.io.to(this.roomCode).emit("cursing_started"); 

    await this.countdownToNext(DEFAULT_DURATION)
  }

  async startGuessingSequence() {
    // SECOND SEQUENCE OF A ROUND (first sequence for first round)
    console.log("starting guessing sequence")

    for (let i = 0; i < this.players.length; i++) {
        const player = this.players[i];
        player.setAwarded(false);
    }
    
-   this.io.to(this.roomCode).emit("guessing_started");

    await this.countdownToNext(DEFAULT_DURATION)
  }
  
  async startResultsSequence() {
    // THIRD AND FINAL SEQUENCE OF A ROUND
    console.log("starting results sequence")


-   this.io.to(this.roomCode).emit("results_started");

    await this.countdownToNext(DEFAULT_DURATION)
  }

  countdownToNext(durationSeconds) {
    // this.roundEndTime = Date.now() + (durationSeconds * 1000);

    // // Start broadcasting timer updates
    // this.timerInterval = setInterval(() => {
    //   const timeRemaining = this.getTimeRemaining();
    //   console.log("time remaining:", timeRemaining)
      
    //   this.io.to(this.roomCode).emit("timer_update", {
    //     timeRemaining: timeRemaining,
    //     totalTime: durationSeconds,
    //   });

    //   if (timeRemaining <= 0) {
    //     clearInterval(this.timerInterval);
    //     next();
    //   }
    // }, 1000);
    return new Promise((resolve) => {
    this.roundEndTime = Date.now() + (durationSeconds * 1000);
    
    this.timerInterval = setInterval(() => {
      const timeRemaining = this.getTimeRemaining();
      console.log("time remaining:", timeRemaining);
      
      this.io.to(this.roomCode).emit("timer_update", {
        timeRemaining: timeRemaining,
        totalTime: durationSeconds,
      });
      
      if (timeRemaining <= 0) {
        console.log("Stopping interval!!")
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        resolve(); // ✅ Resolves when timer finishes
      }
    }, 1000);
  });
  }

  submitPlayerGuess(player, trackID, socket) {
    const points = this.currentSong.isSong(trackID) ? this.getTimeRemaining() : 0
    if (points > 0) {
      socket.emit("correct_guess", { points: correct });
      player.awardPoints(points);
      player.setAwarded(true);
      //loop through all players, ending round if all awarded

    } else {
      socket.emit("incorrect_guess");
    }
  }

  getTimeRemaining() {
    if (!this.roundEndTime) return 0;
    const remaining = Math.max(0, this.roundEndTime - Date.now());
    return Math.ceil(remaining / 1000);
  }

}

export default Room;