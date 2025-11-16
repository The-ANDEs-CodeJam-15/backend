class Player {
    constructor(sessionID, userName = null, roomCode = null) {
        this.sessionID = sessionID;
        this.userName = userName;
        this.roomCode = roomCode;
        this.points = 0;
        this.useCurses = [];
        this.activeCurses = [];
        this.awarded = false;
        this.isReady = false;
        this.color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
    }
    
    resetPoints() {
        this.points = 0;
    }

    awardPoints(points) {
        this.points += points;
    }

    hasBeenAwarded() {
        return this.awarded;
    }

    setAwarded(awarded) {
        this.awarded = awarded;
    }

    setReady(ready) {
        this.isReady = ready;
    }

    isReady() {
        return this.isReady;
    }
}

export default Player;