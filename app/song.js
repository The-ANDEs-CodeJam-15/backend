class Song {

  constructor(trackID, name = null, artist = null, cover = null, previewUrl = null) {
    this.trackID = trackID;
    this.name = name;
    this.artist = artist;
    this.cover = cover;
    this.previewUrl = previewUrl;
  }
}

export default Song;