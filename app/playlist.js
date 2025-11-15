import Song from "./song.js";

class Playlist {
  constructor(name, trackIds = []) {
    this.name = name;
    this.songs = trackIds.map(id => new Song(id));
  }

  getRandomSong() {
    return this.songs[Math.floor(Math.random() * this.songs.length)];
  }
}

export default Playlist;
