import Player from "./player.js"

class Curse {
    
    /*constructor(name, effectFunction, icon) {
        this.name = name;
        this.effectFunction = effectFunction;
        this.icon = icon;
    }*/
   static curseTypes = ["slowDown", "speedUp", "lowPass", "highPass", "distort", "bitCrush", "reverb", "chop", "delay"];

    constructor() {
        this.name = Curse.curseTypes[Math.floor((Math.random() * 10))];
    }

    /*
    Curse types:
    - slowDown 
    - speedUp 
    - lowPass
    - highPass
    - distort
    - bitCrush
    - reverb
    - chop
    - delay
    */

}

export default Curse;