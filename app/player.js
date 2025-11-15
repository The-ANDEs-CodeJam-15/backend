class Player {
    constructor(sessionID, userName = null, roomCode = null) {
        this.sessionID = sessionID;
        this.userName = userName;
        this.roomCode = roomCode;
    }
}

export default Player;