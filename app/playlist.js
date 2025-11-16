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
    // Filter out songs without preview URLs
    const songsWithPreviews = this.songs.filter(song => song.previewUrl && song.previewUrl !== null && song.previewUrl !== "");
    
    if (!songsWithPreviews.length || songsWithPreviews.length < count) {
      console.warn(`Not enough songs with previews. Requested: ${count}, Available: ${songsWithPreviews.length}`);
      return songsWithPreviews; // Return what we have
    }
    
    const shuffled = [...songsWithPreviews].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

}

export default Playlist;


