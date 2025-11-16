import Player from "./player.js"

class Curse {
    
    /*constructor(name, effectFunction, icon) {
        this.name = name;
        this.effectFunction = effectFunction;
        this.icon = icon;
    }*/
   static curseTypes = ["Slow Down", "Speed Up", "Low Pass Filter", "High Pass Filter", "Distortion", "Bitcrush", "Reverb", "Chop Up", "Echo"];

    constructor() {
        this.name = Curse.curseTypes[Math.floor(Math.random() * Curse.curseTypes.length)];
    }
    /*
    Curse types:
    - Slow Down
    - Speed Up 
    - Low Pass
    - High Pass
    - Distortion
    - Bitcrush
    - Reverb
    - Chop Up
    - Delay
    */
}

export default Curse;