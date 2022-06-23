// ==UserScript==
// @name         Stratums.io
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Zaary
// @match        *://*.stratums.io/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ondigitalocean.app
// @grant        none
// @run-at       document-start
// @require      https://rawgit.com/kawanet/msgpack-lite/master/dist/msgpack.min.js
// ==/UserScript==
/* global msgpack */
const settings = {
    autochat: false
}
const isEnemyNear = ()=> playerMemory.filter(x => x.sid != mainMemory.get("my_sid") && x.team != mainMemory.get("my_player").team && x.visible && dist(x, mainMemory.get("my_player")) < 300).length;
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});
class MathHelper {

    static randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static lerp(value1, value2, amount) {
        return value1 + (value2 - value1) * amount;
    }

    static decel(val, cel) {
        if (val > 0)
            val = Math.max(0, val - cel);
        else if (val < 0)
            val = Math.min(0, val + cel);
        return val;
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
    }

    static getDirection(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static getAngleDist(a, b) {
        var p = Math.abs(b - a) % (Math.PI * 2);
        return (p > Math.PI ? (Math.PI * 2) - p : p);
    }

    static lerpAngle(value1, value2, amount) {
        var difference = Math.abs(value2 - value1);
        if (difference > Math.PI) {
            if (value1 > value2) {
                value2 += Math.PI * 2;
            } else {
                value1 += Math.PI * 2;
            }
        }
        var value = (value2 + ((value1 - value2) * amount));
        if (value >= 0 && value <= Math.PI * 2)
            return value;
        return (value % Math.PI * 2);
    }

    static isNumber(n) {
        return (typeof n == "number" && !isNaN(n) && isFinite(n));
    }

    static fixTo(n, v) {
        return parseFloat(n.toFixed(v));
    }

    static sortByPoints(a, b) {
        return parseFloat(b.points) - parseFloat(a.points);
    }

    static degToRad(a) {
        return a * (Math.PI / 180);
    }

    static radToDeg(a) {
        return a * (180 / Math.PI);
    }
}

class Constant {
    static Item = {
        APPLE: 0,
        COOKIE: 1,
        CHEESE: 2,
        WOODEN_WALL: 3,
        STONE_WALL: 4,
        CASTLE_WALL: 5,
        SPIKES: 6,
        GREATER_SPIKES: 7,
        POISON_SPIKES: 8,
        SPINNING_SPIKES: 9,
        WINDMILL: 10,
        FASTER_WINDMILL: 11,
        POWER_MILL: 12,
        MINE: 13,
        SAPLING: 14,
        PIT_TRAP: 15,
        BOOST_PAD: 16,
        TURRET: 17,
        PLATFORM: 18,
        HEALING_PAD: 19,
        SPAWN_PAD: 20,
        BLOCKER: 21,
        TELEPORTER: 22
    }

    static Weapon = {
        Primary: {
            TOOL_HAMMER: 0,
            HAND_AXE: 1,
            GREAT_AXE: 2,
            SHORT_SWORD: 3,
            KATANA: 4,
            POLEARM: 5,
            BAT: 6,
            DAGGERS: 7,
            STICK: 8
        },
        Secondary: {
            HUNTING_BOW: 9,
            GREAT_HAMMER: 10,
            WOODEN_SHIELD: 11,
            CROSSBOW: 12,
            REPEATER_CROSSBOW: 13,
            MC_GRABBY: 14,
            MUSKET: 15
        },
        isPrimary: function(id) {
            return Object.values(Constant.Weapon.Primary).indexOf(id) > -1;
        }
    }
}
class ItemData {
    static Weapons = [{
        id: 0,
        type: 0,
        name: "tool hammer",
        desc: "tool for gathering all resources",
        src: "hammer_1",
        length: 140,
        width: 140,
        xOff: -3,
        yOff: 18,
        dmg: 25,
        range: 65,
        gather: 1,
        speed: 300
    }, {
        id: 1,
        type: 0,
        age: 2,
        name: "hand axe",
        desc: "gathers resources at a higher rate",
        src: "axe_1",
        length: 140,
        width: 140,
        xOff: 3,
        yOff: 24,
        dmg: 30,
        spdMult: 1,
        range: 70,
        gather: 2,
        speed: 400
    }, {
        id: 2,
        type: 0,
        age: 8,
        pre: 1,
        name: "great axe",
        desc: "deal more damage and gather more resources",
        src: "great_axe_1",
        length: 140,
        width: 140,
        xOff: -8,
        yOff: 25,
        dmg: 35,
        spdMult: 1,
        range: 75,
        gather: 4,
        speed: 400
    }, {
        id: 3,
        type: 0,
        age: 2,
        name: "short sword",
        desc: "increased attack power but slower move speed",
        src: "sword_1",
        iPad: 1.3,
        length: 130,
        width: 210,
        xOff: -8,
        yOff: 46,
        dmg: 35,
        spdMult: 0.85,
        range: 110,
        gather: 1,
        speed: 300
    }, {
        id: 4,
        type: 0,
        age: 8,
        pre: 3,
        name: "katana",
        desc: "greater range and damage",
        src: "samurai_1",
        iPad: 1.3,
        length: 130,
        width: 210,
        xOff: -8,
        yOff: 59,
        dmg: 40,
        spdMult: 0.8,
        range: 118,
        gather: 1,
        speed: 300
    }, {
        id: 5,
        type: 0,
        age: 2,
        name: "polearm",
        desc: "long range melee weapon",
        src: "spear_1",
        iPad: 1.3,
        length: 130,
        width: 210,
        xOff: -8,
        yOff: 53,
        dmg: 45,
        knock: 0.2,
        spdMult: 0.82,
        range: 142,
        gather: 1,
        speed: 700
    }, {
        id: 6,
        type: 0,
        age: 2,
        name: "bat",
        desc: "fast long range melee weapon",
        src: "bat_1",
        iPad: 1.3,
        length: 110,
        width: 180,
        xOff: -8,
        yOff: 53,
        dmg: 20,
        knock: 0.7,
        range: 110,
        gather: 1,
        speed: 300
    }, {
        id: 7,
        type: 0,
        age: 2,
        name: "daggers",
        desc: "really fast short range weapon",
        src: "dagger_1",
        iPad: 0.8,
        length: 110,
        width: 110,
        xOff: 18,
        yOff: 0,
        dmg: 20,
        knock: 0.1,
        range: 65,
        gather: 1,
        hitSlow: 0.1,
        spdMult: 1.13,
        speed: 100
    }, {
        id: 8,
        type: 0,
        age: 2,
        name: "stick",
        desc: "great for gathering but very weak",
        src: "stick_1",
        length: 140,
        width: 140,
        xOff: 3,
        yOff: 24,
        dmg: 1,
        spdMult: 1,
        range: 70,
        gather: 7,
        speed: 400
    }, {
        id: 9,
        type: 1,
        age: 6,
        name: "hunting bow",
        desc: "bow used for ranged combat and hunting",
        src: "bow_1",
        req: ["wood", 4],
        length: 120,
        width: 120,
        xOff: -6,
        yOff: 0,
        projectile: 0,
        spdMult: 0.75,
        speed: 600
    }, {
        id: 10,
        type: 1,
        age: 6,
        name: "great hammer",
        desc: "hammer used for destroying structures",
        src: "great_hammer_1",
        length: 140,
        width: 140,
        xOff: -9,
        yOff: 25,
        dmg: 10,
        spdMult: 0.88,
        range: 75,
        sDmg: 7.5,
        gather: 1,
        speed: 400
    }, {
        id: 11,
        type: 1,
        age: 6,
        name: "wooden shield",
        desc: "blocks projectiles and reduces melee damage",
        src: "shield_1",
        length: 120,
        width: 120,
        shield: 0.2,
        xOff: 6,
        yOff: 0,
        spdMult: 0.7
    }, {
        id: 12,
        type: 1,
        age: 8,
        pre: 9,
        name: "crossbow",
        desc: "deals more damage and has greater range",
        src: "crossbow_1",
        req: ["wood", 5],
        aboveHand: true,
        armS: 0.75,
        length: 120,
        width: 120,
        xOff: -4,
        yOff: 0,
        projectile: 2,
        spdMult: 0.7,
        speed: 700
    }, {
        id: 13,
        type: 1,
        age: 9,
        pre: 12,
        name: "repeater crossbow",
        desc: "high firerate crossbow with reduced damage",
        src: "crossbow_2",
        req: ["wood", 10],
        aboveHand: true,
        armS: 0.75,
        length: 120,
        width: 120,
        xOff: -4,
        yOff: 0,
        projectile: 3,
        spdMult: 0.7,
        speed: 230
    }, {
        id: 14,
        type: 1,
        age: 6,
        name: "mc grabby",
        desc: "steals resources from enemies",
        src: "grab_1",
        length: 130,
        width: 210,
        xOff: -8,
        yOff: 53,
        dmg: 0,
        steal: 250,
        knock: 0.2,
        spdMult: 1.05,
        range: 125,
        gather: 0,
        speed: 700
    }, {
        id: 15,
        type: 1,
        age: 9,
        pre: 12,
        name: "musket",
        desc: "slow firerate but high damage and range",
        src: "musket_1",
        req: ["stone", 10],
        aboveHand: true,
        rec: 0.35,
        armS: 0.6,
        hndS: 0.3,
        hndD: 1.6,
        length: 205,
        width: 205,
        xOff: 25,
        yOff: 0,
        projectile: 5,
        hideProjectile: true,
        spdMult: 0.6,
        speed: 1500
    }];
    static Variant = [{
        id: 0,
        src: "",
        xp: 0,
        val: 1
    }, {
        id: 1,
        src: "_g",
        xp: 3000,
        val: 1.1
    }, {
        id: 2,
        src: "_d",
        xp: 7000,
        val: 1.18
    }, {
        id: 3,
        src: "_r",
        poison: true,
        xp: 12000,
        val: 1.18
    }];
    static Projectile = [{
        indx: 0,
        layer: 0,
        src: "arrow_1",
        dmg: 25,
        speed: 1.6,
        scale: 103,
        range: 1000
    }, {
        indx: 1,
        layer: 1,
        dmg: 25,
        scale: 20
    }, {
        indx: 0,
        layer: 0,
        src: "arrow_1",
        dmg: 35,
        speed: 2.5,
        scale: 103,
        range: 1200
    }, {
        indx: 0,
        layer: 0,
        src: "arrow_1",
        dmg: 30,
        speed: 2,
        scale: 103,
        range: 1200
    }, {
        indx: 1,
        layer: 1,
        dmg: 16,
        scale: 20
    }, {
        indx: 0,
        layer: 0,
        src: "bullet_1",
        dmg: 50,
        speed: 3.6,
        scale: 160,
        range: 1400
    }];

    static Hat = [{
        id: 0,
        name: "None",
        price: null,
        scale: null,
        desc: null
    }, {
        id: 45,
        name: "Shame!",
        dontSell: true,
        price: 0,
        scale: 120,
        desc: "hacks are for losers"
    }, {
        id: 51,
        name: "Moo Cap",
        price: 0,
        scale: 120,
        desc: "coolest mooer around"
    }, {
        id: 50,
        name: "Apple Cap",
        price: 0,
        scale: 120,
        desc: "apple farms remembers"
    }, {
        id: 28,
        name: "Moo Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 29,
        name: "Pig Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 30,
        name: "Fluff Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 36,
        name: "Pandou Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 37,
        name: "Bear Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 38,
        name: "Monkey Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 44,
        name: "Polar Head",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 35,
        name: "Fez Hat",
        price: 0,
        scale: 120,
        desc: "no effect"
    }, {
        id: 42,
        name: "Enigma Hat",
        price: 0,
        scale: 120,
        desc: "join the enigma army"
    }, {
        id: 43,
        name: "Blitz Hat",
        price: 0,
        scale: 120,
        desc: "hey everybody i'm blitz"
    }, {
        id: 49,
        name: "Bob XIII Hat",
        price: 0,
        scale: 120,
        desc: "like and subscribe"
    }, {
        id: 57,
        name: "Pumpkin",
        price: 50,
        scale: 120,
        desc: "Spooooky"
    }, {
        id: 8,
        name: "Bummle Hat",
        price: 100,
        scale: 120,
        desc: "no effect"
    }, {
        id: 2,
        name: "Straw Hat",
        price: 500,
        scale: 120,
        desc: "no effect"
    }, {
        id: 15,
        name: "Winter Cap",
        price: 600,
        scale: 120,
        desc: "allows you to move at normal speed in snow",
        coldM: 1
    }, {
        id: 5,
        name: "Cowboy Hat",
        price: 1000,
        scale: 120,
        desc: "no effect"
    }, {
        id: 4,
        name: "Ranger Hat",
        price: 2000,
        scale: 120,
        desc: "no effect"
    }, {
        id: 18,
        name: "Explorer Hat",
        price: 2000,
        scale: 120,
        desc: "no effect"
    }, {
        id: 31,
        name: "Flipper Hat",
        price: 2500,
        scale: 120,
        desc: "have more control while in water",
        watrImm: true
    }, {
        id: 1,
        name: "Marksman Cap",
        price: 3000,
        scale: 120,
        desc: "increases arrow speed and range",
        aMlt: 1.3
    }, {
        id: 10,
        name: "Bush Gear",
        price: 3000,
        scale: 160,
        desc: "allows you to disguise yourself as a bush"
    }, {
        id: 48,
        name: "Halo",
        price: 3000,
        scale: 120,
        desc: "no effect"
    }, {
        id: 6,
        name: "Soldier Helmet",
        price: 4000,
        scale: 120,
        desc: "reduces damage taken but slows movement",
        spdMult: 0.94,
        dmgMult: 0.75
    }, {
        id: 23,
        name: "Anti Venom Gear",
        price: 4000,
        scale: 120,
        desc: "makes you immune to poison",
        poisonRes: 1
    }, {
        id: 13,
        name: "Medic Gear",
        price: 5000,
        scale: 110,
        desc: "slowly regenerates health over time",
        healthRegen: 3
    }, {
        id: 9,
        name: "Miners Helmet",
        price: 5000,
        scale: 120,
        desc: "earn 1 extra gold per resource",
        extraGold: 1
    }, {
        id: 32,
        name: "Musketeer Hat",
        price: 5000,
        scale: 120,
        desc: "reduces cost of projectiles",
        projCost: 0.5
    }, {
        id: 7,
        name: "Bull Helmet",
        price: 6000,
        scale: 120,
        desc: "increases damage done but drains health",
        healthRegen: -5,
        dmgMultO: 1.5,
        spdMult: 0.96
    }, {
        id: 22,
        name: "Emp Helmet",
        price: 6000,
        scale: 120,
        desc: "turrets won't attack but you move slower",
        antiTurret: 1,
        spdMult: 0.7
    }, {
        id: 12,
        name: "Booster Hat",
        price: 6000,
        scale: 120,
        desc: "increases your movement speed",
        spdMult: 1.16
    }, {
        id: 26,
        name: "Barbarian Armor",
        price: 8000,
        scale: 120,
        desc: "knocks back enemies that attack you",
        dmgK: 0.6
    }, {
        id: 21,
        name: "Plague Mask",
        price: 10000,
        scale: 120,
        desc: "melee attacks deal poison damage",
        poisonDmg: 5,
        poisonTime: 6
    }, {
        id: 46,
        name: "Bull Mask",
        price: 10000,
        scale: 120,
        desc: "bulls won't target you unless you attack them",
        bullRepel: 1
    }, {
        id: 14,
        name: "Windmill Hat",
        topSprite: true,
        price: 10000,
        scale: 120,
        desc: "generates points while worn",
        pps: 1.5
    }, {
        id: 11,
        name: "Spike Gear",
        topSprite: true,
        price: 10000,
        scale: 120,
        desc: "deal damage to players that damage you",
        dmg: 0.45
    }, {
        id: 53,
        name: "Turret Gear",
        topSprite: true,
        price: 10000,
        scale: 120,
        desc: "you become a walking turret",
        turret: {
            proj: 1,
            range: 700,
            rate: 2500
        },
        spdMult: 0.7
    }, {
        id: 20,
        name: "Samurai Armor",
        price: 12000,
        scale: 120,
        desc: "increased attack speed and fire rate",
        atkSpd: 0.78
    }, {
        id: 58,
        name: "Dark Knight",
        price: 12000,
        scale: 120,
        desc: "restores health when you deal damage",
        healD: 0.4
    }, {
        id: 27,
        name: "Scavenger Gear",
        price: 15000,
        scale: 120,
        desc: "earn double points for each kill",
        kScrM: 2
    }, {
        id: 40,
        name: "Tank Gear",
        price: 15000,
        scale: 120,
        desc: "increased damage to buildings but slower movement",
        spdMult: 0.3,
        bDmg: 3.3
    }, {
        id: 52,
        name: "Thief Gear",
        price: 15000,
        scale: 120,
        desc: "steal half of a players gold when you kill them",
        goldSteal: 0.5
    }, {
        id: 55,
        name: "Bloodthirster",
        price: 20000,
        scale: 120,
        desc: "Restore Health when dealing damage. And increased damage",
        healD: 0.25,
        dmgMultO: 1.2,
    }, {
        id: 56,
        name: "Assassin Gear",
        price: 20000,
        scale: 120,
        desc: "Go invisible when not moving. Can't eat. Increased speed",
        noEat: true,
        spdMult: 1.1,
        invisTimer: 1000
    }];

    static Tail = [{
        id: 0,
        name: "None",
        price: null,
        scale: null,
        desc: null
    }, {
        id: 12,
        name: "Snowball",
        price: 1000,
        scale: 105,
        xOff: 18,
        desc: "no effect"
    }, {
        id: 9,
        name: "Tree Cape",
        price: 1000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 10,
        name: "Stone Cape",
        price: 1000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 3,
        name: "Cookie Cape",
        price: 1500,
        scale: 90,
        desc: "no effect"
    }, {
        id: 8,
        name: "Cow Cape",
        price: 2000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 11,
        name: "Monkey Tail",
        price: 2000,
        scale: 97,
        xOff: 25,
        desc: "Super speed but reduced damage",
        spdMult: 1.35,
        dmgMultO: 0.2
    }, {
        id: 17,
        name: "Apple Basket",
        price: 3000,
        scale: 80,
        xOff: 12,
        desc: "slowly regenerates health over time",
        healthRegen: 1
    }, {
        id: 6,
        name: "Winter Cape",
        price: 3000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 4,
        name: "Skull Cape",
        price: 4000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 5,
        name: "Dash Cape",
        price: 5000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 2,
        name: "Dragon Cape",
        price: 6000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 1,
        name: "Super Cape",
        price: 8000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 7,
        name: "Troll Cape",
        price: 8000,
        scale: 90,
        desc: "no effect"
    }, {
        id: 14,
        name: "Thorns",
        price: 10000,
        scale: 115,
        xOff: 20,
        desc: "no effect"
    }, {
        id: 15,
        name: "Blockades",
        price: 10000,
        scale: 95,
        xOff: 15,
        desc: "no effect"
    }, {
        id: 20,
        name: "Devils Tail",
        price: 10000,
        scale: 95,
        xOff: 20,
        desc: "no effect"
    }, {
        id: 16,
        name: "Sawblade",
        price: 12000,
        scale: 90,
        spin: true,
        xOff: 0,
        desc: "deal damage to players that damage you",
        dmg: 0.15
    }, {
        id: 13,
        name: "Angel Wings",
        price: 15000,
        scale: 138,
        xOff: 22,
        desc: "slowly regenerates health over time",
        healthRegen: 3
    }, {
        id: 19,
        name: "Shadow Wings",
        price: 15000,
        scale: 138,
        xOff: 22,
        desc: "increased movement speed",
        spdMult: 1.1
    }, {
        id: 18,
        name: "Blood Wings",
        price: 20000,
        scale: 178,
        xOff: 26,
        desc: "restores health when you deal damage",
        healD: 0.2
    }, {
        id: 21,
        name: "Corrupt X Wings",
        price: 20000,
        scale: 178,
        xOff: 26,
        desc: "deal damage to players that damage you",
        dmg: 0.25
    }];
    static Item = [{
        id: 0,
        name: "apple",
        desc: "restores 20 health when consumed",
        req: ["food", 10],
        healAmount: 20,
        scale: 22,
        holdOffset: 15
    }, {
        id: 1,
        age: 3,
        name: "cookie",
        desc: "restores 40 health when consumed",
        req: ["food", 15],
        healAmount: 40,
        scale: 27,
        holdOffset: 15
    }, {
        id: 2,
        age: 7,
        name: "cheese",
        desc: "restores 30 health and another 50 over 5 seconds",
        req: ["food", 25],
        healAmount: 25,
        scale: 27,
        holdOffset: 15
    }, {
        id: 3,
        name: "wood wall",
        desc: "provides protection for your village",
        req: ["wood", 10],
        projDmg: true,
        health: 380,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 4,
        age: 3,
        name: "stone wall",
        desc: "provides improved protection for your village",
        req: ["stone", 25],
        health: 900,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 5,
        age: 7,
        pre: 1,
        name: "castle wall",
        desc: "provides powerful protection for your village",
        req: ["stone", 35],
        health: 1500,
        scale: 52,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 6,
        name: "spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 20, "stone", 5],
        health: 400,
        dmg: 20,
        scale: 49,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5
    }, {
        id: 7,
        age: 5,
        name: "greater spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 30, "stone", 10],
        health: 500,
        dmg: 35,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5
    }, {
        id: 8,
        age: 9,
        pre: 1,
        name: "poison spikes",
        desc: "poisons enemies when they touch them",
        req: ["wood", 35, "stone", 15],
        health: 600,
        dmg: 30,
        pDmg: 5,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5
    }, {
        id: 9,
        age: 9,
        pre: 2,
        name: "spinning spikes",
        desc: "damages enemies when they touch them",
        req: ["wood", 30, "stone", 20],
        health: 500,
        dmg: 45,
        turnSpeed: 0.003,
        scale: 52,
        spritePadding: -23,
        holdOffset: 8,
        placeOffset: -5
    }, {
        id: 10,
        name: "windmill",
        desc: "generates gold over time",
        req: ["wood", 50, "stone", 10],
        health: 400,
        pps: 1,
        turnSpeed: 0.0016,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 45,
        holdOffset: 20,
        placeOffset: 5
    }, {
        id: 11,
        age: 5,
        pre: 1,
        name: "faster windmill",
        desc: "generates more gold over time",
        req: ["wood", 60, "stone", 20],
        health: 500,
        pps: 1.5,
        turnSpeed: 0.0025,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 47,
        holdOffset: 20,
        placeOffset: 5
    }, {
        id: 12,
        age: 8,
        pre: 1,
        name: "power mill",
        desc: "generates more gold over time",
        req: ["wood", 100, "stone", 50],
        health: 800,
        pps: 2,
        turnSpeed: 0.005,
        spritePadding: 25,
        iconLineMult: 12,
        scale: 47,
        holdOffset: 20,
        placeOffset: 5
    }, {
        id: 13,
        age: 5,
        type: 2,
        name: "mine",
        desc: "allows you to mine stone",
        req: ["wood", 20, "stone", 100],
        iconLineMult: 12,
        scale: 65,
        holdOffset: 20,
        placeOffset: 0
    }, {
        id: 14,
        age: 5,
        type: 0,
        name: "sapling",
        desc: "allows you to farm wood",
        req: ["wood", 150],
        iconLineMult: 12,
        colDiv: 0.5,
        scale: 110,
        holdOffset: 50,
        placeOffset: -15
    }, {
        id: 15,
        age: 4,
        name: "pit trap",
        desc: "pit that traps enemies if they walk over it",
        req: ["wood", 30, "stone", 30],
        trap: true,
        ignoreCollision: true,
        hideFromEnemy: true,
        health: 500,
        colDiv: 0.2,
        scale: 50,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 16,
        age: 4,
        name: "boost pad",
        desc: "provides boost when stepped on",
        req: ["stone", 20, "wood", 5],
        ignoreCollision: true,
        boostSpeed: 1.5,
        health: 150,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 17,
        age: 7,
        doUpdate: true,
        name: "turret",
        desc: "defensive structure that shoots at enemies",
        req: ["wood", 200, "stone", 150],
        health: 800,
        projectile: 1,
        shootRange: 700,
        shootRate: 2200,
        scale: 43,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 18,
        age: 7,
        name: "platform",
        desc: "platform to shoot over walls and cross over water",
        req: ["wood", 20],
        ignoreCollision: true,
        zIndex: 1,
        health: 300,
        scale: 43,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 19,
        age: 7,
        name: "healing pad",
        desc: "standing on it will slowly heal you",
        req: ["wood", 30, "food", 10],
        ignoreCollision: true,
        healCol: 15,
        health: 400,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 20,
        age: 9,
        name: "spawn pad",
        desc: "you will spawn here when you die but it will dissapear",
        req: ["wood", 100, "stone", 100],
        health: 400,
        ignoreCollision: true,
        spawnPoint: true,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 21,
        age: 7,
        name: "blocker",
        desc: "blocks building in radius",
        req: ["wood", 30, "stone", 25],
        ignoreCollision: true,
        blocker: 300,
        health: 400,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5
    }, {
        id: 22,
        age: 7,
        name: "teleporter",
        desc: "teleports you to a random point on the map",
        req: ["wood", 60, "stone", 60],
        ignoreCollision: true,
        teleport: true,
        health: 200,
        colDiv: 0.7,
        scale: 45,
        holdOffset: 20,
        placeOffset: -5
    }];
}

class BasicKeyValueMemory {
    #blueprint;
    #object;

    constructor(obj) {
        this.#blueprint = obj;
        this.clear();
    }
    clear() {
        this.#object = Object.assign({}, this.#blueprint);
    }
    get(key) {
        return this.#object[key];
    }
    set(key, object) {
        this.#object[key] = object;
    }
    isset(key) {
        return this.#object[key] != null;
    }
    remove(sid) {
        delete this.#object[sid];
    }
}
class BasicSidToObjectMemory extends Array {
    constructor() {
        super();
    }
    findBySid(sid) {
        for (let i = 0, length = this.length; i < length; i++) {
            const player = this[i];
            if (player.sid == sid) {
                return player;
            }
        }
        return null;
    }
    remove(item) {
        const index = this.indexOf(item);
        if (index > -1) {
            this.splice(index, 1);
        }
    }
    removeBySid(sid) {
        this.remove(this.findBySid(sid));
    }
}
const mainMemory = new BasicKeyValueMemory({
    my_sid: null,
    my_player: null
});
const inventory = new BasicKeyValueMemory({
    primary: Constant.Weapon.Primary.TOOL_HAMMER,
    secondary: null,
    food: Constant.Item.APPLE,
    wall: Constant.Item.WOODEN_WALL,
    spikes: Constant.Item.SPIKES,
    windmill: Constant.Item.WINDMILL,
    trap: null,
    sapling: null,
    utility: null,
    spawnpad: null
});
const playerMemory = new BasicSidToObjectMemory();
const animalMemory = new BasicSidToObjectMemory();
const buildingMemory = new BasicSidToObjectMemory();
const projectileMemory = new BasicSidToObjectMemory();

class Translator {
    constructor() {
        // transformation
        this.transformMatrix = new DOMMatrixReadOnly([1, 0, 0, 1, 0, 0]);
        this.defaultMatrix = new DOMMatrixReadOnly([1, 0, 0, 1, 0, 0]);
        this.screenWidth = 1920;
        this.screenHeight = 1080;

        // camera
        this.camX = 0;
        this.camY = 0;
    }

    interpolateEntities(delta) {
        const lastTime = Date.now() - (1000 / 9);

        for (let i = 0, length = playerMemory.length; i < length; i++) {
            const player = playerMemory[i];
            if (player.visible) {
                if (player.forcePos) {
                    player.posX = player.serverPosX;
                    player.posY = player.serverPosY;
                } else {
                    // lerp position
                    const rate = 170;
                    player.delta += delta;

                    const overTick = Math.min(1.7, player.delta / rate);
                    player.posX = MathHelper.lerp(player.clientPosX, player.serverPosX, overTick);
                    player.posY = MathHelper.lerp(player.clientPosY, player.serverPosY, overTick);

                    // lerp direction
                    const positionDelta = player.positionTimestamp - player.lastPositionTimestamp;
                    const tickDelta = lastTime - player.lastPositionTimestamp;
                    const ratio = tickDelta / positionDelta;
                    player.dir = MathHelper.lerpAngle(player.serverDir, player.lastDir, Math.min(1.2, ratio));
                }
            }
        }
    }

    updateEntities(delta) {
        for (let i = 0, length = playerMemory.length + animalMemory.length; i < length; i++) {
            const entity = i < playerMemory.length ? playerMemory[i] : animalMemory[i];
            entity.update(delta);
        }
    }

    setCameraPosition(x, y) {
        this.camX = x;
        this.camY = y;
    }

    updateCamera(player, delta) {
        if (player) {
            const distance = MathHelper.getDistance(this.camX, this.camY, player.posX, player.posY);
            const direction = MathHelper.getDirection(this.camX, this.camY, player.posX, player.posY);
            const speed = Math.min(distance * 0.01 * delta, distance);

            if (distance > 0.05) {
                this.camX += speed * Math.cos(direction);
                this.camY += speed * Math.sin(direction);
            } else {
                this.camX = player.posX;
                this.camY = player.posY;
            }
        }
    }

    updateScreenDimensions(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
    }

    refreshTransform() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const viewport = this.getViewport();
        let scale = Math.max(windowWidth / viewport.width, windowHeight / viewport.height);
        return this.transformMatrix = new DOMMatrixReadOnly([scale, 0, 0, scale, (windowWidth - viewport.width * scale) / 2, (windowHeight - viewport.height * scale) / 2]);
    }

    getViewport() {
        return {
            width: this.screenWidth,
            height: this.screenHeight,
        }
    }

    getRenderOffset() {
        const viewport = this.getViewport();
        return {
            x: this.camX - (viewport.width / 2),
            y: this.camY - (viewport.height / 2)
        }
    }

    getPosOnScreen(x, y) {
        const defaultOffset = this.getRenderOffset();
        return {
            x: x - defaultOffset.x,
            y: y - defaultOffset.y
        }
    }
}
const renderer = new (class Renderer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.style.pointerEvents = "none"; // make mouse events go throught our canvas
        this.canvas.style.position = "fixed";
        this.canvas.style.top = 0;
        this.canvas.style.left = 0;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener("DOMContentLoaded", () => {
            document.body.insertBefore(this.canvas, document.getElementById("gameCanvas"));
        });

        this.ctx = this.canvas.getContext("2d");
        this.translator = new Translator();

        const resizeHandler = function(event) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ctx.setTransform(this.translator.refreshTransform());
        }.bind(this);

        window.addEventListener("resize", resizeHandler);
        resizeHandler(); // emit resize so we can transform

        this.lastUpdate = Date.now();

        this.update = this.update.bind(this);
    }
    start() {
        requestAnimationFrame(this.update);
    }
    update() {
        const ms = Date.now();
        const delta = ms - this.lastUpdate;
        this.lastUpdate = ms;

        this.translator.updateCamera(mainMemory.get("my_player"), delta);
        this.translator.interpolateEntities(delta);
        this.translator.updateEntities(delta);

        if (this.ctx.getTransform() != this.defaultMatrix) {
            this.ctx.setTransform(this.defaultMatrix);
        }

        this.ctx.clearRect(0, 0, this.translator.screenWidth, this.translator.screenHeight);

        this.ctx.setTransform(this.translator.transformMatrix);
        this.render(delta);

        this.ctx.setTransform(this.translator.defaultMatrix);
        this.renderHud(delta);

        requestAnimationFrame(this.update);
    }
    renderHud(delta) {

    }
    render(delta) {

    }
    getContext() {
        return this.ctx;
    }
})();
renderer.start();

class Entity {
    constructor(id, sid) {
        this.id = id;
        this.sid = sid;

        this.visible = false;
        this.forcePos = false;
        this.dt = 0;
    }
    spawn() {
        this.alive = true;
        this.posX = 0;
        this.posY = 0;
    }
    update() {}
}

class Player extends Entity {
    constructor(id, sid) {
        super(id, sid);

        this.hat = ItemData.Hat[0];
        this.tail = ItemData.Tail[0];
        this.skinIndex = 0;
        this.tailIndex = 0;

        this.maxHealth = 100;

        this.lastDamaged = 0;
        this.clownPoints = 0;
        this.clownCountdown = 0;

        this.buildIndex = null;
        this.weaponIndex = null;
        this.weaponVariant = null;
        this.team = null;
        this.isLeader = null;
        this.skinIndex = null;
        this.tailIndex = null;
        this.isTopKiller = null;
        this.zIndex = null;

        this.projectiles = [];

        //position processing
        this.lastPositionTimestamp = null;
        this.positionTimestamp = null;
        this.clientPosX = null;
        this.clientPosY = null;
        this.lastDir = null;
        this.lastTickPosX = null;
        this.lastTickPosY = null;
        this.serverPosX = null;
        this.serverPosY = null;
        this.serverDir = null;
        this.delta = null;
    }
    spawn() {
        super.spawn();
        this.alive = true;
        this.health = this.maxHealth;

        this.weapons = {
            hand: ItemData.Weapons[0],
            primary: ItemData.Weapons[0],
            secondary: null
        }

        this.reloads = {
            primary: 300,
            primaryMax: 300,
            secondary: 0,
            secondaryMax: 0,
            turret: 3000,
            turretMax: 3000
        }
    }
    setData(data) {
        this.id = data[0];
        this.sid = data[1];
        this.name = data[2];
        this.posX = data[3];
        this.posY = data[4];
        this.dir = data[5];
        this.health = data[6];
        this.maxHealth = data[7];
        this.scale = data[8];
        this.skinColor = data[9];
    }
    packetTickUpdate() {
        if (this.weaponIndex != null && this.buildIndex == -1
            && ((this.weapons.primary != null && Constant.Weapon.isPrimary(this.weaponIndex) && this.weaponIndex != this.weapons.primary.id)
                || (this.weapons.secondary != null && !Constant.Weapon.isPrimary(this.weaponIndex) && this.weaponIndex != this.weapons.secondary.id))) {
            const tag = Constant.Weapon.isPrimary(this.weaponIndex) ? "primary" : "secondary";
            this.weapons[tag] = ItemData.Weapons[this.weaponIndex];
            this.reloads[tag] = this.reloads[tag + "Max"] = ItemData.Weapons[this.weaponIndex].speed;
            this.weapons.hand = ItemData.Weapons[this.weaponIndex];
        }

        if (this.skinIndex != this.hat.id) {
            this.hat = ItemData.Hat.find(hat => hat.id == this.skinIndex);
        }
        if (this.tailIndex != this.tail.id) {
            this.tail = ItemData.Tail.find(tail => tail.id == this.tailIndex);
        }
    }
    tickUpdate(delta) {
        // update reloads
        if (this.weapons.hand == this.weapons.primary) {
            this.reloads.primary = Math.min(this.reloads.primaryMax, this.reloads.primary + delta);
        } else if (this.weapons.hand == this.weapons.secondary) {
            this.reloads.secondary = Math.min(this.reloads.secondaryMax, this.reloads.secondary + delta);
        }
        this.reloads.turret = Math.min(this.reloads.turretMax, this.reloads.turret + delta);
    }
}

window.GameObject = class GameObject {
    constructor(sid, x, y, dir, scale, type, data, owner) {
        this.sid = sid;
        data = data || {};
        this.sentTo = {};
        this.gridLocations = [];
        this.active = true;
        this.doUpdate = data.doUpdate;
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.xWiggle = 0;
        this.yWiggle = 0;
        this.scale = scale;
        this.type = type;
        this.id = data.id;
        this.owner = owner;
        this.name = data.name;
        this.isItem = (this.id!=undefined);
        this.group = data.group;
        this.health = data.health;
        this.layer = 2;
        if (this.group != undefined) {
            this.layer = this.group.layer;
        } else if (this.type == 0) {
            this.layer = 3;
        } else if (this.type == 2) {
            this.layer = 0;
        } else if (this.type == 4) {
            this.layer = -1;
        }
        this.colDiv = data.colDiv||1;
        this.blocker = data.blocker;
        this.ignoreCollision = data.ignoreCollision;
        this.dontGather = data.dontGather;
        this.hideFromEnemy = data.hideFromEnemy;
        this.friction = data.friction;
        this.projDmg = data.projDmg;
        this.dmg = data.dmg;
        this.pDmg = data.pDmg;
        this.pps = data.pps;
        this.zIndex = data.zIndex||0;
        this.turnSpeed = data.turnSpeed;
        this.req = data.req;
        this.trap = data.trap;
        this.healCol = data.healCol;
        this.teleport = data.teleport;
        this.boostSpeed = data.boostSpeed;
        this.projectile = data.projectile;
        this.shootRange = data.shootRange;
        this.shootRate = data.shootRate;
        this.shootCount = this.shootRate;
        this.spawnPoint = data.spawnPoint;
    }
}

const packet_in_arr = [
    "socket_id",
    "set_clans",
    "disconnect",
    "setup_game",
    "player_add",
    "player_remove",
    "player_update",
    "leaderboard_update",
    "create_object",
    "animal_add",
    "animal_animate",
    "gather",
    "wiggle",
    ,
    ,
    "health_update",
    "death",
    "object_remove",
    ,
    ,
    "counts_update",
    "select_items",
    "inventory_update",
];

const packet_in_map = new Map();


// get receiving packet ids
const regexes = {
    packetHandlers: /\(\w*,\w*=>{.*URLSearchParams.*},{((?:'\w{3}':.*)*)}\)/g,
    packetIds: /'([0-9a-f]{3})':/g,
    packet_handler: (regex) => "'(\w{3})'\s*:\s*function\s*\w+\(.+\)\s*{" + regex + "},"
}
function processBundle(code) {
    const packetHandlers = code.match(regexes.packetHandlers)[0];
    const packetIds = packetHandlers.match(regexes.packetIds).map(id => id.substring(1, 4));
    for (let i = 0, length = packet_in_arr.length + 30; i < length; i++) {
        const name = packet_in_arr[i] || "unknown-" + i;
        const packet = packetIds[i];
        packet_in_map.set(packet, name);
        if (packet) {
            console.log("Mapping in: " + packet + " -> " + name);
        } else break;
    }
}

async function wsLoaded() {
    fetch(Array.from(document.getElementsByTagName("script")).filter(x => x.src.indexOf("bundle.js") != -1)[0].src).then(res => res.text()).then(res => processBundle(res));
}

function _hasValueInMap(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue) {
            return true;
        }
    }
    return false;
}
function _getByValueFromMap(map, searchValue) {
    for (let [key, value] of map.entries()) {
        if (value === searchValue) {
            return key;
        }
    }
}

const _packetCache = new Map();
function _cache(name, id) {
    if (!_isCached(name)) {
        console.log("[OUT] Caching " + name + " as [" + id + "]");
        _packetCache.set(name, id);
    }
}
function _isCached(name) {
    return _packetCache.has(name);
}
function _isCachedValue(id) {
    return _hasValueInMap(_packetCache, id);
}
function _getCachedByKey(name) {
    return _packetCache.get(name);
}
function _getCached(id) {
    return _getByValueFromMap(_packetCache, id);
}
function checkOutPacket(id, data) {
    if (data instanceof Array && data[0] === 10 && data[1] === false) {
        return _cache("item_switch", id);
    }
    if (data instanceof Array && data[0] == 1 && data[1] === null) {
        return _cache("attack", id);
    }
    if (!_isCached("store_action") && data instanceof Array && data[0] === 0 && data[1] === 51 && data[2] === 0) {
        return _cache("store_action", id);
    }
    if (data instanceof Array && data[0] === "chat_hook") {
        return _cache("chat", id);
    }
    if (!_isCached("dir") && data[0] >= -Math.PI && data[1] <= Math.PI) {
        return _cache("dir", id);
    }
}

let ws;
let pak = null;
const _dns = (e, ...d) => (ws && ws.readyState == 1 && (pak = new Uint8Array([...msgpack.encode([e, d])]),/*console.log([e, d]),*/ oldSend.call(ws, pak)));
const dns = (e, ...d) => (_isCached(e) && _dns(_getCachedByKey(e), ...d));
const place = (e) => (dns("item_switch", e, false), dns("attack", 1, 0), dns("attack", 0, 0), dns("item_switch", inventory.get("primary"), true));

const console = { ...window.console };

const oldApply = Function.prototype.apply;
Function.prototype.apply = function(...args) {
    //if (!args[0]) console.log(args[1]);
    if (ws && ws.readyState == 1) {
        //console.log(...args);
    }
    return oldApply.call(this, ...args);
}

const oldSetInterval = window.setInterval;
window.setInterval = function(callback, time) {
    const string = callback.toString();
    if (!/.*document.*!Worker.*/.test(string)) {
        return oldSetInterval.call(this, callback, time);
    } else {
        console.log("> Disabled client-side anticheat");
        return -1;
    }
}
// yeah skidded. and what? i dont wanna waste time coding this shit
function animate(chance) {
    let result = '';
    let characters = "Strat Cums 'anti hack' op :-) 🤡";

    characters = characters.padStart((30 - characters.length) / 2 + characters.length)
    characters = characters.padEnd(30);
    let count = 0;
    for (let i = 0; i < characters.length; i++ ) {
        if(Math.floor(Math.random() * chance) == 1 && characters.charAt(i) != "-" && count < 2 && characters.charAt(i) != " ") {
            result += "🥵";
            count++
        } else {
            result += characters.charAt(i);
        }
    }
    return result;
}
let lastChat = 0;

let lastUpdate = 0;
let lastHeal = 0;
const ticker = setInterval(() => {
    const now = Date.now();
    const delta = now - lastUpdate;
    lastUpdate = now;

    const myPlayer = mainMemory.get("my_player");

    // autochat
    if (now - lastChat > 300 && settings.autochat) {
        lastChat = now;
        dns("chat", animate(5));
    }

    // autoq sucks, make better heal
    const isEnemyNear = playerMemory.filter(x => x.sid != mainMemory.get("my_sid") && x.visible && dist(x, myPlayer) < 300).length > 0;
    if (myPlayer && (isEnemyNear || myPlayer.health < 95) && ingame && !instaing && now - lastHeal > 25 + (+isEnemyNear * 50)) {
        lastHeal = now;
        place(inventory.get("food"));
    }

    // doesnt work idk why lol debug it
    const trap = buildingMemory.filter(x => x.owner && x.type == 15).sort((a, b) => dist(a, myPlayer) - dist(b, myPlayer));
    if (trap && dist(trap, myPlayer <= 50)) {
        console.log("trapped!");
    }
})

let instaing = false;
let ingame = false;

const oldSend = window.WebSocket.prototype.send;
window.WebSocket = class extends WebSocket {
    constructor(...args) {
        super(...args);
        console.log("construct");
        ws = this;

        this.lastSwitch = 0;
        this.lastHat = 0;
        this.lastTail = 0;

        wsLoaded();
        this.send.toString = function() {
            return "function send() { [native code] }";
        }

        this.addEventListener("message", ({ data: buffer }) => {
            const [id, data] = msgpack.decode(new Uint8Array(buffer));
            const packet = packet_in_map.get(id);

            if (!packet) {
                return;
            }

            if (packet == "setup_game") {
                ingame = true;
            }

            if (packet == "player_add") {
                let player = playerMemory.findBySid(data[0][1]);
                if (!player) {
                    player = new Player(data[0][0], data[0][1]);
                    console.log("created player", player);
                    playerMemory.push(player);
                }
                player.spawn();
                player.setData(data[0]);

                if (data[1]) {
                    mainMemory.set("my_sid", data[0][1]);
                    mainMemory.set("my_player", player);
                    inventory.clear();
                    renderer.translator.setCameraPosition(player.posX, player.posY);
                } else {
                    dns("chat", "id={" + player.sid + "} name={" + player.name + "}");
                }
            }

            if (packet == "player_update") {
                for (let i = 0, length = playerMemory.length; i < length; i++) {
                    playerMemory[i].forcePos = !playerMemory[i].visible;
                    playerMemory[i].visible = false;
                }
                for (let i = 0, length = data[0].length / 13; i < length; i++) {
                    const info = data[0].slice(i * 13, i * 13 + 13);
                    const player = playerMemory.findBySid(info[0]);

                    // position and rotation
                    player.lastPositionTimestamp = player.positionTimestamp; // t1
                    player.positionTimestamp = Date.now(); // t2
                    player.clientPosX = player.posX; // x1
                    player.clientPosY = player.posY; // y1
                    player.lastDir = player.serverDir; // d1

                    player.lastTickPosX = player.serverPosX;
                    player.lastTickPosY = player.serverPosY;

                    player.serverPosX = info[1]; // x2
                    player.serverPosY = info[2]; // y2

                    player.serverDir = info[3]; // d2
                    player.delta = 0; // dt

                    // other data
                    player.buildIndex = info[4];
                    player.weaponIndex = info[5];
                    player.weaponVariant = info[6];
                    player.team = info[7];
                    player.isLeader = info[8];
                    player.skinIndex = info[9];
                    player.tailIndex = info[10];
                    player.isTopKiller = info[11];
                    player.zIndex = info[12];

                    player.visible = true;

                    player.packetTickUpdate();
                }
            }
            /*if (packet != "player_update" && packet != "leaderboard_update" && packet != "animal_add" && packet != "animal_update" && packet != "counts_update" && packet != "gather")
            console.log(packet + " -> " + id);*/


            if (packet == "health_update") {
                playerMemory.findBySid(data[0]).health = data[1];
            }

            if (packet == "inventory_update") {
                if (data[1]) {
                    inventory.set("primary", data[0][0]);
                    inventory.set("secondary", data[0][1]);
                } else {
                    inventory.set("food", data[0][0]);
                    inventory.set("wall", data[0][1]);
                    inventory.set("spikes", data[0][2]);
                    inventory.set("windmill", data[0][3]);
                    inventory.set("trap", data[0][4]);
                    inventory.set("sapling", data[0][5]);
                    inventory.set("utility", data[0][6]);
                    inventory.set("spawnpad", data[0][7]);
                }
            }

            if (packet == "death") {
                ingame = false;
                inventory.clear();
                mainMemory.get("my_player").health = 100;
            }

            if (packet == "create_object") {
                for (let i = 0, length = data[0].length / 8; i < length; i++) {
                    const info = data[0].slice(i * 8, i * 8 + 8);
                    let {x,y,sid, team} = mainMemory.get("my_player"), [Sid, X, Y] = info;
                    let aim = Math.atan2(X - x, Y - y)

                    if (sid != Sid && info[7] == 15) {
                        dns('chat', "trap??");
                        let i = 0, {PI} = Math;
                        let placer = setInterval(()=>{
                            if (i > 8) clearInterval(placer);
                            i++
                            place(inventory.get('trap'), i* PI/4)
                        }, i*69)
                    }
                    let tmpObj = buildingMemory.findBySid(info[0]);
                    if (tmpObj) buildingMemory.removeBySid(info[0]);

                    tmpObj = new GameObject(info[0], info[1], info[2], info[3], info[4], info[5], ItemData.Item[info[6]], info[7] >= 0 ? { sid: info[7] } : null);
                    buildingMemory.push(tmpObj);
                }
            }
            if (packet == "chat") {
                console.log(data)
                data[0].toLowerCase() == "chatcycle" && (settings.autochat = true)
            }
            if (packet == "object_remove") {
                buildingMemory.removeBySid(data[0]);
                if(isEnemyNear())return;
                let i = 0, {PI} = Math;
                let placer = setInterval(()=>{
                    if (i > 8) clearInterval(placer);
                    place(inventory.get('trap'), i * (PI/4))
                    i++
                }, i*69)
                }

            // finish insta (cuz it takes time until u actually start attacking serverside)
            if (packet == "gather") {
                if (data[0] == mainMemory.get("my_sid")) {
                    if (instaing) {
                        setTimeout(() => {
                            dns("item_switch", inventory.get("secondary"), true);
                            setTimeout(() => {
                                dns("store_action", 0, 53, 0);
                                setTimeout(() => {
                                    dns("store_action", 0, 12, 0);
                                    dns("store_action", 0, 11, 1);
                                    dns("attack", 0, null);
                                    dns("item_switch", inventory.get("primary"), true);
                                    instaing = false;
                                }, 250);
                            }, 100);
                        }, 0);
                    }
                }
            }
        });
    }
    send(message) {
        const [id, data] = msgpack.decode(new Uint8Array(message));
        checkOutPacket(id, data);

        //console.log(_getCachedByKey("store_action"));
        if (id == _getCachedByKey("store_action")) {
            console.log(data);
        }

        /*if (id == _getCachedByKey("item_switch")) {
            if (data[1]) {
                if (data[0] == this.lastSwitch) {
                    return;
                }
                this.lastSwitch = data[0];
            }
        }*/
        if (id == _getCachedByKey("store_action")) {
            if (data[2] == 0) {
                if (data[0] == 0) {
                    if (this.lastHat == data[1]) {
                        return;
                    }
                    this.lastHat = data[1];
                }
            } else {
                if (data[0] == 0) {
                    if (this.lastTail == data[1]) {
                        return;
                    }
                    this.lastTail = data[1];
                }
            }
        }


        //if (id != _getCached("dir")) {
        super.send(message);
        //}
    }
    toString() {
        return "function WebSocket() { [native code] }";
    }
    cum() {
        // omg cum plz mediafire anticheat
        return "yes daddy";
    }
}
function dist(a, b){
    return Math.sqrt( Math.pow((b.posY-a.posY), 2) + Math.pow((b.posX-a.posX), 2) );
}
// insta (u need all hats or ur gonna get anticheetoed (im lazy to make it bypass))
document.addEventListener("keydown", ({ key }) => {
    if (key == "r" && document.activeElement.tagName != "input") {
        instaing = true;
        const myPlayer = mainMemory.get("my_player");
        //const nearestPlayer = playerMemory.filter(x => x.sid != myPlayer.sid && x.visible).sort((a, b) => dist(myPlayer, a) - dist(myPlayer, b))[0];
        //let nearestDir = Math.atan2(nearestPlayer.posY - myPlayer.posY, nearestPlayer.posX - myPlayer.posX).toFixed(2);
        let nearestDir = 0;
        dns("item_switch", inventory.get("primary"), true);
        dns("store_action", 0, 7, 0);
        dns("store_action", 0, 0, 1);
        dns("attack", 1, null);
    }
});

// old crash LOL

/*window.crash = () => {
    function makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() *
                                                   charactersLength));
        }
        return result;
    }
    window.dns([ClanPacket, [makeid(1e3)]])
}*/
