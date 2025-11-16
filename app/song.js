class Song {

  constructor(trackID, name = null, artist = null, cover = null, previewUrl = null) {
    this.trackID = trackID;
    this.name = name;
    this.artist = artist;
    this.cover = cover;
    this.previewUrl = previewUrl;
  }

  isSong(song) {
    if (song.trackID == this.trackID || (song.name === this.name && song.artist === this.artist)) {
      return true;
    }
    return false;
  }

    async getBase64FromURL() {
      console.log("PREVIEW URL IN BASE64FROMURL FUN:", this.previewUrl)
      const response = await fetch(this.previewUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const base64Audio = buffer.toString('base64');
      
      return `data:audio/mpeg;base64,${base64Audio}`;
  }
}

export default Song;