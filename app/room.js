import Player from "./player.js";

class Room {
  constructor(code, hostPlayer) {
    this.code = code;
    this.host_player = hostPlayer;
    this.players = [hostPlayer];
    this.songs = [];
    this.currentSong = null;
    
  }

  addPlayer(player) {
    if (this.players.find(p => p.sessionID === player.sessionID)) {
      return false;
    }
    this.players.push(player);
    return true;
  }

  startGame() {
    //load the songs - prompt host for a playlist?
    //for each player, init points
  }

  distributePoints() {
    //for each player, give points if their in
  }
}

export default Room;