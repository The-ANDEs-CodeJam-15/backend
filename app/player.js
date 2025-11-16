import Curse from "./curse.js"

class Player {
    constructor(sessionID, socketID, userName = null, roomCode = null) {
        this.sessionID = sessionID;
        this.socketID = socketID;
        this.userName = userName;
        this.roomCode = roomCode;
        this.points = 0;
        this.curseInventory = [];
        this.activeCurses = [];
        this.awarded = false;
        this.isReady = false;
    }

    updateSocketID(newID) {
        this.socketID = newID
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

    awardRandomCurse() {
        this.curseInventory.push(new Curse())
    }

    getCursesCondensed() {
        const mylist = [];

        for (let i = 0; i < this.curseInventory.length; i++) {
            mylist.push({ curseIndex: i, curseName: this.curseInventory[i].name })
        }

        return mylist;
    }

    cursePlayer(targetPlayer, indexOfCurse, io) {
        const curseToApply = this.curseInventory[indexOfCurse];
        targetPlayer.activeCurses.push(curseToApply);
        this.curseInventory.splice(indexOfCurse, 1);
        io.to(targetPlayer.socketID).emit("apply_curse", { curseToApply: curseToApply.name });
        //io.to(this.socketID).emit("use_curse")
    }
}

export default Player;