import Song from "./song.js";

class Playlist {
  constructor(playlistID) {
    this.playlistID = playlistID;
    this.songs = [];
  }

  async fetchTracks() {
    try {
      const res = await fetch(`https://api.deezer.com/playlist/${this.playlistID}`);
      const data = await res.json();

      if (!data.tracks || !data.tracks.data) return;

      this.songs = data.tracks.data.map(
        t => new Song(t.id, t.title, t.artist.name, t.album.cover, t.preview)
      );
    } catch (err) {
      console.error("Failed to fetch playlist", err);
    }
  }

  getRandomSongs(count) {
    if (!this.songs.length || this.songs.length < count) return [];
    const shuffled = this.songs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}

export default Playlist;


