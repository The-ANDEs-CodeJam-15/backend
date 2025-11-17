import { time } from "console";
import Player from "./player.js";
import Playlist from "./playlist.js";
import Song from "./song.js"
import Curse from "./curse.js"

const CURSE_DURATION = 10;
const GUESS_DURATION = 15;
const RESULT_DURATION = 5;
const INITIAL_START_TIME = 3;

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
    this.closed = false;
    this.firstGuessed = false;
  }



  // 1. Overall game management



  addPlayer(player) {
    if (this.players.find(p => p.sessionID === player.sessionID) || this.closed) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  getRandomHSLColor() {
      const h = Math.floor(Math.random() * 360); // hue: 0-359
      const s = 70; // saturation
      const l = 60; // lightness
      return `hsl(${h}, ${s}%, ${l}%)`;
  }

  getPlayersCondensed() {
    const mylist = [];
    for (let i = 0; i < this.players.length; i++) {
      mylist.push({
        userName: this.players[i].userName,
        sessionID: this.players[i].sessionID,
        points: this.players[i].points,
        color: this.getRandomHSLColor(),
      })
    }

    return mylist;
  }

  async startGame() {
    console.log("starting game")
    this.closed = true;
    // Load the songs - for now we will hardcode the playlist - use id 5339620562
    const playlistID = 13650203641;
    const playlist = new Playlist(playlistID);
    await playlist.fetchTracks();
    this.songs = playlist.getRandomSongs(this.totalRounds);
    console.log("songs:")
    console.log(this.songs)

    //temporary: check preview URLs
    const previewUrls = this.songs.map(song => song.previewUrl);
    console.log("Preview URLs:");
    console.log(previewUrls);

    // Ensure points start at 0; important when restarting after a previous round

    for (let i = 0; i < this.players.length; i++) {
      this.players[i].resetPoints();
    }

    // Will set up initial page structure; first transition from default loading page
    console.log("trying to start game: emitting 'game_starting' to clients")
    this.io.to(this.roomCode).emit("game_starting", {});
  }

  endGame() {
    //this.stopTimer();
    this.isRoundActive = false;

    // Calculate final scores, etc.
    this.io.to(this.roomCode).emit("end_game", {
        players: this.getPlayersCondensed()
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
      if (!allReady) break;
    }

    if (allReady && !this.running) {
      for (let i = 0; i < this.players.length; i++) {
        this.players[i].setReady(false);
      }
      this.gameLoop();
      this.running = true;
    }
  }


  // 2. Round management (rounds divided into timed "sequences")


  async gameLoop() {
    // Initial song load
    this.updateSong();
    /*  
    this.io.to(this.roomCode).emit("load_song", {
    song: {
      trackID: this.currentSong.trackID,
      previewUrl: this.currentSong.previewUrl,
      name: this.currentSong.name,
      artist: this.currentSong.artist,
      cover: this.currentSong.cover
    }
    });
    */
    // Initial countdown
    this.io.to(this.roomCode).emit("initial_countdown", { players: this.getPlayersCondensed(), totalRounds: this.totalRounds });
    await this.countdownToNext(INITIAL_START_TIME);

    while (this.currentRound <= this.totalRounds) {
      console.log("\nROUND STARTING\n", this.currentRound);

      await this.startCurseSequence();
      await this.startGuessingSequence();
      await this.startResultsSequence();

      //prep for next round
      this.currentRound++;
      this.updateSong();
    }
    //end game, looping is done
    this.endGame();
  }

  async startCurseSequence() {
    console.log("starting curse sequence")
    console.log("CURRENT SONG:", this.currentSong);

    // No parameter needed - it uses this.previewUrl
    const currentSongAudio = await this.currentSong.getBase64FromURL();
    console.log("Audio converted, length:", currentSongAudio?.length);

    this.io.to(this.roomCode).emit("update_round", { currentRound: this.currentRound})
    for (let i = 0; i < this.players.length; i++) {
      console.log(`Sending audio to ${this.players[i].userName}`);
      console.log("PLAYER SOCKET ID:", this.players[i].socketID);
      this.io.to(this.players[i].socketID).emit("cursing_started", {
        currentSongAudio: currentSongAudio,
        curses: this.players[i].getCursesCondensed()
      })
    }

    await this.countdownToNext(CURSE_DURATION)
  }

  async startGuessingSequence() {
    // SECOND SEQUENCE OF A ROUND (first sequence for first round)
    console.log("starting guessing sequence")
    this.io.to(this.roomCode).emit("guessing_started");

    this.firstGuessed = false;
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i];
      player.setAwarded(false);
    }

    // Main guessing logic
    // {here}

    await this.countdownToNext(GUESS_DURATION)
  }

  async startResultsSequence() {
    // THIRD AND FINAL SEQUENCE OF A ROUND
    // clean up active curses
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].activeCurses = [];
    }
    console.log("starting results sequence")
    const currentSongCondensed = { trackID: this.currentSong.trackID, name: this.currentSong.name, artist: this.currentSong.artist, cover: this.currentSong.cover };
    this.io.to(this.roomCode).emit("results_started", { song : currentSongCondensed, players: this.getPlayersCondensed() });

    // Main results logic
    // {here} 

    await this.countdownToNext(RESULT_DURATION);
  }

  countdownToNext(durationSeconds) {
    return new Promise((resolve) => {
      this.sequenceEndTime = Date.now() + ((durationSeconds + 1) * 1000);

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
          resolve(); // ✅ Resolves when timer finishes <-- sus green check mark
        }
      }, 1000);
    });
  }

  submitPlayerGuess(player, song, socket) {
    console.log("!!!TRACK ID OF PLAYER GUESS!!!", song.trackID);
    const points = this.currentSong.isSong(song) ? this.getTimeRemaining() : 0
    let newCurses = 0;
    console.log("Should get", points, "points")
    if (points > 0) {
      if (!this.firstGuessed) {
        this.firstGuessed = true;
        newCurses = player.awardRandomCurse();
      }

      socket.emit("correct_guess", { newCurses: newCurses }); //this isn't necessary here
      player.awardPoints(points);
      player.setAwarded(true);
      let allAwarded = true;

      for (let i = 0; i < this.players.length; i++) {
        allAwarded = allAwarded && this.players[i].hasBeenAwarded();
        if (!allAwarded) break;
      }

      if (allAwarded) {
        this.sequenceEndTime = Date.now();
      }

    } else {
      socket.emit("incorrect_guess");
    }
  }

  getTimeRemaining() {
    if (!this.sequenceEndTime) return 0;
    const remaining = Math.max(0, this.sequenceEndTime - Date.now());
    return Math.ceil(remaining / 1000);
  }

}

export default Room;