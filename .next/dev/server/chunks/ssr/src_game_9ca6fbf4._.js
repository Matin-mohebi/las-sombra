module.exports = [
"[project]/src/game/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TAU",
    ()=>TAU,
    "angleDiff",
    ()=>angleDiff,
    "boxGeo",
    ()=>boxGeo,
    "circleVsBox",
    ()=>circleVsBox,
    "clamp",
    ()=>clamp,
    "damp",
    ()=>damp,
    "dist2",
    ()=>dist2,
    "faNum",
    ()=>faNum,
    "lerp",
    ()=>lerp,
    "lerpAngle",
    ()=>lerpAngle,
    "pick",
    ()=>pick,
    "rand",
    ()=>rand,
    "randi",
    ()=>randi,
    "resolveCollisions",
    ()=>resolveCollisions,
    "segmentVsBox",
    ()=>segmentVsBox,
    "segmentVsColliders",
    ()=>segmentVsColliders,
    "smoothstep",
    ()=>smoothstep,
    "texAsphalt",
    ()=>texAsphalt,
    "texBeam",
    ()=>texBeam,
    "texConcrete",
    ()=>texConcrete,
    "texDesert",
    ()=>texDesert,
    "texGlow",
    ()=>texGlow,
    "texSidewalk",
    ()=>texSidewalk,
    "texSign",
    ()=>texSign,
    "texSmoke",
    ()=>texSmoke,
    "texWood",
    ()=>texWood
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
;
const clamp = (v, a, b)=>Math.max(a, Math.min(b, v));
const lerp = (a, b, t)=>a + (b - a) * t;
const rand = (a = 1, b)=>b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b)=>Math.floor(rand(a, b + 1));
const pick = (arr)=>arr[Math.floor(Math.random() * arr.length)];
const TAU = Math.PI * 2;
function angleDiff(a, b) {
    let d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
}
function lerpAngle(a, b, t) {
    return a + angleDiff(a, b) * clamp(t, 0, 1);
}
function damp(a, b, lambda, dt) {
    return lerp(a, b, 1 - Math.exp(-lambda * dt));
}
function faNum(n, fractionDigits = 0) {
    try {
        return n.toLocaleString('fa-IR', {
            maximumFractionDigits: fractionDigits
        });
    } catch  {
        return String(Math.round(n));
    }
}
function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}
function dist2(ax, az, bx, bz) {
    const dx = ax - bx;
    const dz = az - bz;
    return dx * dx + dz * dz;
}
function circleVsBox(p, r, b) {
    const dx = p.x - clamp(p.x, b.x - b.hw, b.x + b.hw);
    const dz = p.z - clamp(p.z, b.z - b.hd, b.z + b.hd);
    const d2 = dx * dx + dz * dz;
    if (d2 > r * r) return null;
    if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        return {
            nx: dx / d,
            nz: dz / d,
            depth: r - d
        };
    }
    // center inside box: push along smallest penetration axis
    const px = b.hw - Math.abs(p.x - b.x);
    const pz = b.hd - Math.abs(p.z - b.z);
    if (px < pz) return {
        nx: Math.sign(p.x - b.x) || 1,
        nz: 0,
        depth: px + r
    };
    return {
        nx: 0,
        nz: Math.sign(p.z - b.z) || 1,
        depth: pz + r
    };
}
function resolveCollisions(p, r, colliders) {
    let hits = 0;
    for(let i = 0; i < colliders.length; i++){
        const b = colliders[i];
        // broad phase
        if (Math.abs(p.x - b.x) > b.hw + r + 0.2 || Math.abs(p.z - b.z) > b.hd + r + 0.2) continue;
        const hit = circleVsBox(p, r, b);
        if (hit) {
            p.x += hit.nx * hit.depth;
            p.z += hit.nz * hit.depth;
            hits++;
        }
    }
    return hits;
}
function segmentVsBox(ax, az, bx, bz, box) {
    const dx = bx - ax;
    const dz = bz - az;
    let tmin = 0;
    let tmax = 1;
    for(let axis = 0; axis < 2; axis++){
        const o = axis === 0 ? ax : az;
        const d = axis === 0 ? dx : dz;
        const lo = axis === 0 ? box.x - box.hw : box.z - box.hd;
        const hi = axis === 0 ? box.x + box.hw : box.z + box.hd;
        if (Math.abs(d) < 1e-8) {
            if (o < lo || o > hi) return null;
        } else {
            let t1 = (lo - o) / d;
            let t2 = (hi - o) / d;
            if (t1 > t2) {
                const t = t1;
                t1 = t2;
                t2 = t;
            }
            tmin = Math.max(tmin, t1);
            tmax = Math.min(tmax, t2);
            if (tmin > tmax) return null;
        }
    }
    return tmin;
}
function segmentVsColliders(ax, az, bx, bz, colliders) {
    let best = null;
    for (const b of colliders){
        const t = segmentVsBox(ax, az, bx, bz, b);
        if (t !== null && (best === null || t < best)) best = t;
    }
    return best;
}
/* ---------- canvas textures ---------- */ function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return {
        c,
        x: c.getContext('2d')
    };
}
function finishTex(c, rx = 1, ry = 1) {
    const t = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTexture"](c);
    t.wrapS = t.wrapT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RepeatWrapping"];
    t.repeat.set(rx, ry);
    t.colorSpace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SRGBColorSpace"];
    t.anisotropy = 4;
    return t;
}
function noiseOn(x, w, h, n, colors, sMin = 1, sMax = 4, alpha = 0.5) {
    for(let i = 0; i < n; i++){
        x.globalAlpha = rand(0.05, alpha);
        x.fillStyle = pick(colors);
        const s = rand(sMin, sMax);
        x.fillRect(rand(0, w), rand(0, h), s, s);
    }
    x.globalAlpha = 1;
}
const cache = {};
function texDesert() {
    if (cache.desert) return cache.desert;
    const { c, x } = mkCanvas(512, 512);
    x.fillStyle = '#c2a06b';
    x.fillRect(0, 0, 512, 512);
    for(let i = 0; i < 60; i++){
        x.globalAlpha = rand(0.04, 0.14);
        x.fillStyle = pick([
            '#b18c57',
            '#d0b078',
            '#a67f4e',
            '#c8a464'
        ]);
        x.beginPath();
        x.ellipse(rand(0, 512), rand(0, 512), rand(20, 90), rand(14, 60), rand(0, TAU), 0, TAU);
        x.fill();
    }
    noiseOn(x, 512, 512, 2600, [
        '#8a6a3e',
        '#e0c890',
        '#7a5c38'
    ], 1, 3, 0.4);
    const t = finishTex(c, 14, 14);
    cache.desert = t;
    return t;
}
function texAsphalt() {
    if (cache.asphalt) return cache.asphalt;
    const { c, x } = mkCanvas(128, 128);
    x.fillStyle = '#2e2f31';
    x.fillRect(0, 0, 128, 128);
    noiseOn(x, 128, 128, 700, [
        '#3a3b3e',
        '#242527',
        '#43454a'
    ], 1, 3, 0.5);
    // center dashed line along v (vertical in texture)
    x.fillStyle = '#d8c060';
    x.globalAlpha = 0.85;
    x.fillRect(61, 6, 6, 52);
    x.globalAlpha = 1;
    const t = finishTex(c);
    cache.asphalt = t;
    return t;
}
function texConcrete() {
    if (cache.concrete) return cache.concrete;
    const { c, x } = mkCanvas(256, 256);
    x.fillStyle = '#8f8a80';
    x.fillRect(0, 0, 256, 256);
    noiseOn(x, 256, 256, 1400, [
        '#9a958b',
        '#837e74',
        '#a09a8e'
    ], 1, 4, 0.5);
    x.strokeStyle = 'rgba(60,58,52,0.25)';
    x.lineWidth = 2;
    x.strokeRect(0, 0, 256, 256);
    const t = finishTex(c, 2, 2);
    cache.concrete = t;
    return t;
}
function texSidewalk() {
    if (cache.sidewalk) return cache.sidewalk;
    const { c, x } = mkCanvas(128, 128);
    x.fillStyle = '#9b968c';
    x.fillRect(0, 0, 128, 128);
    noiseOn(x, 128, 128, 500, [
        '#a8a398',
        '#8c877d'
    ], 1, 3, 0.4);
    x.strokeStyle = 'rgba(70,68,62,0.5)';
    x.lineWidth = 2;
    x.strokeRect(0, 0, 64, 64);
    x.strokeRect(64, 64, 64, 64);
    const t = finishTex(c, 4, 4);
    cache.sidewalk = t;
    return t;
}
function texWood() {
    if (cache.wood) return cache.wood;
    const { c, x } = mkCanvas(128, 128);
    x.fillStyle = '#b08a55';
    x.fillRect(0, 0, 128, 128);
    for(let i = 0; i < 8; i++){
        x.fillStyle = i % 2 ? '#a0763f' : '#bd9660';
        x.fillRect(i * 16, 0, 15, 128);
        x.fillStyle = 'rgba(70,45,20,0.5)';
        x.fillRect(i * 16, 0, 1.5, 128);
    }
    noiseOn(x, 128, 128, 400, [
        '#8a6238',
        '#caa070'
    ], 1, 2, 0.35);
    const t = finishTex(c, 2, 2);
    cache.wood = t;
    return t;
}
function texGlow() {
    if (cache.glow) return cache.glow;
    const { c, x } = mkCanvas(64, 64);
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    const t = finishTex(c);
    cache.glow = t;
    return t;
}
function texSmoke() {
    if (cache.smoke) return cache.smoke;
    const { c, x } = mkCanvas(64, 64);
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    const t = finishTex(c);
    cache.smoke = t;
    return t;
}
function texBeam() {
    if (cache.beam) return cache.beam;
    const { c, x } = mkCanvas(64, 128);
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,240,190,0.55)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(26, 0);
    x.lineTo(38, 0);
    x.lineTo(62, 128);
    x.lineTo(2, 128);
    x.closePath();
    x.fill();
    const t = finishTex(c);
    cache.beam = t;
    return t;
}
function texSign(text, w = 256, h = 64, bg = '#3a2c1c', fg = '#f0d8a0', font = 'bold 40px Vazirmatn, Tahoma, sans-serif') {
    const { c, x } = mkCanvas(w, h);
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = fg;
    x.lineWidth = 4;
    x.strokeRect(4, 4, w - 8, h - 8);
    x.fillStyle = fg;
    x.font = font;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.direction = 'rtl';
    x.fillText(text, w / 2, h / 2 + 2);
    return finishTex(c);
}
function boxGeo(w, h, d, x, y, z, ry = 0, tint) {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    if (tint) {
        const n = g.attributes.position.count;
        const col = new Float32Array(n * 3);
        for(let i = 0; i < n; i++){
            col[i * 3] = tint.r;
            col[i * 3 + 1] = tint.g;
            col[i * 3 + 2] = tint.b;
        }
        g.setAttribute('color', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](col, 3));
    }
    return g;
}
}),
"[project]/src/game/world.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TOWN",
    ()=>TOWN,
    "WORLD_HALF",
    ()=>WORLD_HALF,
    "World",
    ()=>World
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$utils$2f$BufferGeometryUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
const V_ROADS = [
    -240,
    -120,
    0,
    120,
    240
];
const H_ROADS = [
    -840,
    -660,
    -480,
    -300
];
const ROAD_W = 14;
const COLS = [
    {
        x: -270,
        hw: 23
    },
    {
        x: -180,
        hw: 53
    },
    {
        x: -60,
        hw: 53
    },
    {
        x: 60,
        hw: 53
    },
    {
        x: 180,
        hw: 53
    },
    {
        x: 270,
        hw: 23
    }
];
const ROWS = [
    {
        z: -870,
        hd: 23
    },
    {
        z: -750,
        hd: 83
    },
    {
        z: -570,
        hd: 83
    },
    {
        z: -390,
        hd: 83
    }
];
const TOWN = {
    x0: -220,
    x1: 220,
    z0: 500,
    z1: 700,
    streetZ: 600
};
const WORLD_HALF = 1600;
class World {
    quality;
    group;
    colliders;
    graph;
    lamps;
    firePoints;
    camps;
    minimap;
    parkedSpots;
    horseSpots;
    spots;
    // animated materials
    lampHeadMat;
    windowMat;
    lampGlowMat;
    poolMat;
    fireLights;
    fireFlick;
    radioBeacon;
    blink;
    constructor(quality){
        this.quality = quality;
        this.group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
        this.colliders = [];
        this.graph = {
            nodes: [],
            adj: []
        };
        this.lamps = [];
        this.firePoints = [];
        this.camps = [];
        this.minimap = {
            roads: [],
            rects: [],
            camps: []
        };
        this.parkedSpots = [];
        this.horseSpots = [];
        this.spots = {
            start: {
                x: 4,
                z: 505
            },
            starterHorse: {
                x: 16,
                z: 512
            },
            starterCar: {
                x: -100,
                z: 596.5,
                h: Math.PI / 2
            },
            extraCar: {
                x: 9,
                z: 190,
                h: 0
            },
            hospital: {
                x: -60,
                z: -372
            },
            gunShops: [
                {
                    x: 30,
                    z: 612
                },
                {
                    x: 60,
                    z: -372
                }
            ],
            givers: {
                delivery: {
                    x: 165,
                    z: -712
                },
                bounty: {
                    x: -40,
                    z: 592
                },
                race: {
                    x: 60,
                    z: -748
                },
                duel: {
                    x: -5,
                    z: 596
                },
                escape: {
                    x: -95,
                    z: -568
                },
                farmraid: {
                    x: 584,
                    z: -474
                },
                convoy: {
                    x: 616,
                    z: -524
                },
                treasure: {
                    x: -118,
                    z: 612
                }
            },
            farm: {
                x: 600,
                z: -500
            },
            cityDepot: {
                x: -180,
                z: -460
            },
            treasureSpot: {
                x: 462,
                z: 342
            },
            gasStations: [
                {
                    x: 22,
                    z: -60
                },
                {
                    x: -22,
                    z: 380
                }
            ],
            farmRaiders: [
                {
                    x: 588,
                    z: -512
                },
                {
                    x: 612,
                    z: -530
                },
                {
                    x: 632,
                    z: -494
                },
                {
                    x: 574,
                    z: -486
                },
                {
                    x: 604,
                    z: -476
                },
                {
                    x: 640,
                    z: -520
                }
            ],
            deliveryDrop: {
                x: -8,
                z: 590
            },
            bountyCamp: 1,
            raceCp: [
                {
                    x: -180,
                    z: -840
                },
                {
                    x: 60,
                    z: -840
                },
                {
                    x: 240,
                    z: -660
                },
                {
                    x: 180,
                    z: -480
                },
                {
                    x: 0,
                    z: -390
                },
                {
                    x: -180,
                    z: -480
                },
                {
                    x: -240,
                    z: -660
                },
                {
                    x: -120,
                    z: -840
                }
            ],
            duelSpot: {
                x: 60,
                z: 725
            }
        };
        this.fireLights = [];
        this.fireFlick = [];
        this.blink = 0;
        /* ================= city ================= */ this.buildingTints = [
            '#8d8578',
            '#7a6f63',
            '#9a8f7a',
            '#6f6a63',
            '#857066',
            '#5d5a55',
            '#7d8489',
            '#8a7a5f'
        ];
        this.buildingDefs = [];
        this.windowsData = [];
        /* ================= per-frame ================= */ this.tmpV = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.buildGround();
        this.buildRoads();
        this.buildCity();
        this.buildTown();
        this.buildDesert();
        this.buildGasStations();
        this.buildFarm();
        this.buildLake();
        this.buildRadioTower();
        this.buildGraph();
    }
    /** merge geometries with normalized attributes (index + color) */ mergeAll(geos, defaultColor = '#ffffff') {
        const out = geos.map((g)=>{
            const gg = g.index ? g.toNonIndexed() : g;
            if (!gg.attributes.color) {
                const n = gg.attributes.position.count;
                const c = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](defaultColor);
                const col = new Float32Array(n * 3);
                for(let i = 0; i < n; i++){
                    col[i * 3] = c.r;
                    col[i * 3 + 1] = c.g;
                    col[i * 3 + 2] = c.b;
                }
                gg.setAttribute('color', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](col, 3));
            }
            return gg;
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$examples$2f$jsm$2f$utils$2f$BufferGeometryUtils$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mergeGeometries"])(out, false);
    }
    inCity(x, z, m = 0) {
        return x > -300 - m && x < 300 + m && z > -900 - m && z < -300 + m;
    }
    inTown(x, z, m = 0) {
        return x > TOWN.x0 - m && x < TOWN.x1 + m && z > TOWN.z0 - m && z < TOWN.z1 + m;
    }
    nearRoad(x, z, m = 12) {
        if (Math.abs(x) < m && z > -900 && z < 620) return true // highway
        ;
        if (Math.abs(z - TOWN.streetZ) < m && x > TOWN.x0 && x < TOWN.x1) return true;
        return false;
    }
    /* ================= ground ================= */ buildGround() {
        const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](WORLD_HALF * 2 + 400, WORLD_HALF * 2 + 400);
        g.rotateX(-Math.PI / 2);
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texDesert"])()
        });
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](g, m);
        mesh.receiveShadow = this.quality !== 'low';
        this.group.add(mesh);
    }
    /* ================= roads ================= */ roadGeo(x, z, len, vert, w = ROAD_W) {
        const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, len);
        const uv = g.attributes.uv;
        for(let i = 0; i < uv.count; i++)uv.setY(i, uv.getY(i) * (len / 16));
        g.rotateX(-Math.PI / 2);
        if (!vert) g.rotateY(Math.PI / 2);
        g.translate(x, 0.06, z);
        return g;
    }
    buildRoads() {
        const geos = [];
        const addMini = (x, z, len, vert)=>this.minimap.roads.push({
                x,
                z,
                len,
                vert
            });
        // city vertical roads (extend to city border)
        for (const rx of V_ROADS){
            geos.push(this.roadGeo(rx, -600, 600, true));
            addMini(rx, -600, 600, true);
        }
        // city horizontal roads
        for (const rz of H_ROADS){
            geos.push(this.roadGeo(0, rz, 600, false));
            addMini(0, rz, 600, false);
        }
        // highway: city south edge to town
        geos.push(this.roadGeo(0, 150, 900, true));
        addMini(0, 150, 900, true);
        // town street
        geos.push(this.roadGeo(0, TOWN.streetZ, 440, false));
        addMini(0, TOWN.streetZ, 440, false);
        const merged = this.mergeAll(geos);
        const mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texAsphalt"])()
        });
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](merged, mat);
        mesh.receiveShadow = this.quality !== 'low';
        this.group.add(mesh);
        // highway signs
        this.addSign(8, -268, 0, '← لاس سومبرا');
        this.addSign(8, 438, 0, '→ سنگ‌سرخ');
        // world border colliders
        const B = WORLD_HALF + 10;
        this.colliders.push({
            x: 0,
            z: B,
            hw: B + 200,
            hd: 12
        }, {
            x: 0,
            z: -B,
            hw: B + 200,
            hd: 12
        }, {
            x: B,
            z: 0,
            hw: 12,
            hd: B + 200
        }, {
            x: -B,
            z: 0,
            hw: 12,
            hd: B + 200
        });
    }
    addSign(x, z, ry, text, w = 7, h = 2.2, bg = '#2a4a2c', fg = '#e8e0c0') {
        const post = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.12, 0.12, h + 1.6, 6), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x4a4a4a
        }));
        post.position.set(x, (h + 1.6) / 2, z);
        this.group.add(post);
        const sign = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](w, h), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texSign"])(text, 512, 128, bg, fg, 'bold 72px Vazirmatn, Tahoma'),
            side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DoubleSide"]
        }));
        sign.position.set(x, h + 0.6, z);
        sign.rotation.y = ry;
        this.group.add(sign);
    }
    buildingTints;
    buildingDefs;
    windowsData;
    buildCity() {
        const q = this.quality;
        // base slab
        const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](620, 620), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texConcrete"])(),
            color: 0x77726a
        }));
        base.rotation.x = -Math.PI / 2;
        base.position.set(0, 0.02, -600);
        base.receiveShadow = q !== 'low';
        this.group.add(base);
        const bGeos = [];
        const special = new Map() // "col,row" -> type
        ;
        special.set('1,2', 'park');
        special.set('3,1', 'parking');
        special.set('4,2', 'parking');
        special.set('2,3', 'police');
        for(let ci = 0; ci < COLS.length; ci++){
            for(let ri = 0; ri < ROWS.length; ri++){
                const col = COLS[ci];
                const row = ROWS[ri];
                const key = `${ci},${ri}`;
                const type = special.get(key);
                const uw = col.hw * 2 - 8;
                const ud = row.hd * 2 - 8;
                // sidewalk slab
                const sw = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](uw + 10, ud + 10), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
                    map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texSidewalk"])()
                }));
                sw.rotation.x = -Math.PI / 2;
                sw.position.set(col.x, 0.04, row.z);
                sw.receiveShadow = q !== 'low';
                this.group.add(sw);
                if (type === 'park') {
                    this.buildPark(col.x, row.z, uw, ud);
                    continue;
                }
                if (type === 'parking') {
                    const lot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](uw, ud), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
                        color: 0x3a3b3e
                    }));
                    lot.rotation.x = -Math.PI / 2;
                    lot.position.set(col.x, 0.05, row.z);
                    this.group.add(lot);
                    for(let i = 0; i < 4; i++){
                        this.parkedSpots.push({
                            x: col.x - uw / 2 + 10,
                            z: row.z - ud / 2 + 8 + i * (ud - 14) / 3,
                            h: 0
                        });
                        this.parkedSpots.push({
                            x: col.x + uw / 2 - 10,
                            z: row.z - ud / 2 + 8 + i * (ud - 14) / 3,
                            h: Math.PI
                        });
                    }
                    if (key === '3,1') this.parkedSpots.push({
                        x: col.x,
                        z: row.z,
                        h: Math.PI / 2
                    });
                    continue;
                }
                // buildings
                const downtown = Math.abs(col.x) <= 60 && row.z === -570;
                const placed = [];
                const n = col.hw > 40 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(4, 6) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(2, 3);
                for(let i = 0; i < n; i++){
                    for(let t = 0; t < 10; t++){
                        const w = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(18, Math.min(42, uw * 0.55));
                        const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(16, Math.min(40, ud * 0.55));
                        const x = col.x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-uw / 2 + w / 2, uw / 2 - w / 2);
                        const z = row.z + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-ud / 2 + d / 2, ud / 2 - d / 2);
                        if (placed.some((p)=>Math.abs(p.x - x) < (p.w + w) / 2 + 4 && Math.abs(p.z - z) < (p.d + d) / 2 + 4)) continue;
                        placed.push({
                            x,
                            z,
                            w,
                            d
                        });
                        const h = downtown ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(26, 60) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(9, 26);
                        const tint = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(this.buildingTints));
                        bGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(w, h, d, x, h / 2, z, 0, tint));
                        this.colliders.push({
                            x,
                            z,
                            hw: w / 2,
                            hd: d / 2,
                            h
                        });
                        this.buildingDefs.push({
                            x,
                            z,
                            w,
                            d,
                            h
                        });
                        this.addWindows(x, z, w, d, h);
                        if (type === 'police' && placed.length === 1) {
                            this.addSign(x, z + d / 2 + 0.3, 0, 'کلانتری — پلیس لاس سومبرا', 10, 1.6);
                        }
                        if (key === '3,2' && placed.length === 1) this.addSign(x, z + d / 2 + 0.3, 0, 'درمانگاه', 8, 1.6);
                        if (key === '4,0' && placed.length === 1) this.addSign(x, z + d / 2 + 0.3, 0, 'اداره پست', 8, 1.6);
                        if (key === '2,3' && placed.length === 2) this.addSign(x, z + d / 2 + 0.3, 0, 'مغازه اسلحه قبیله', 9, 1.6);
                        break;
                    }
                }
            }
        }
        // merge buildings
        const bMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texConcrete"])(),
            vertexColors: true
        });
        const bMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(bGeos), bMat);
        bMesh.castShadow = q === 'high';
        bMesh.receiveShadow = q !== 'low';
        this.group.add(bMesh);
        this.minimap.rects.push(...this.buildingDefs.map((b)=>({
                x: b.x,
                z: b.z,
                hw: b.w / 2,
                hd: b.d / 2,
                t: 'b'
            })));
        this.buildWindows();
        this.buildLamps();
    }
    addWindows(x, z, w, d, h) {
        const floors = Math.floor((h - 4) / 3.1);
        if (floors < 1) return;
        const faces = [
            {
                ry: 0,
                len: w
            },
            {
                ry: Math.PI,
                len: w
            },
            {
                ry: Math.PI / 2,
                len: d
            },
            {
                ry: -Math.PI / 2,
                len: d
            }
        ];
        for (const f of faces){
            const cols = Math.floor((f.len - 3) / 2.9);
            for(let fl = 0; fl < floors; fl++){
                for(let c = 0; c < cols; c++){
                    if (Math.random() < 0.18) continue;
                    const y = 2.4 + fl * 3.1;
                    const off = -f.len / 2 + 2.2 + c * 2.9;
                    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix4"]();
                    const pos = f.ry === 0 ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x + off, y, z + d / 2 + 0.07) : f.ry === Math.PI ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x + off, y, z - d / 2 - 0.07) : f.ry === Math.PI / 2 ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x + w / 2 + 0.07, y, z + off) : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x - w / 2 - 0.07, y, z + off);
                    m.compose(pos, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Euler"](0, f.ry, 0)), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](1, 1, 1));
                    this.windowsData.push({
                        m
                    });
                }
            }
        }
    }
    buildWindows() {
        const n = Math.min(this.windowsData.length, 2400);
        const geo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](1.5, 1.9);
        this.windowMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: 0x1c222b
        });
        const inst = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InstancedMesh"](geo, this.windowMat, n);
        const c = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]();
        for(let i = 0; i < n; i++){
            inst.setMatrixAt(i, this.windowsData[i].m);
            const v = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.75, 1.1);
            inst.setColorAt(i, c.setRGB(v, v * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.85, 1), v * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.7, 0.95)));
        }
        inst.instanceMatrix.needsUpdate = true;
        this.group.add(inst);
    }
    buildPark(cx, cz, uw, ud) {
        // plaza with trees + fountain
        const slab = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](uw, ud), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x6f7a58,
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texConcrete"])()
        }));
        slab.rotation.x = -Math.PI / 2;
        slab.position.set(cx, 0.05, cz);
        this.group.add(slab);
        const geos = [];
        // fountain
        geos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](3.2, 3.6, 1, 12).translate(cx, 0.5, cz));
        geos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.5, 0.7, 2.4, 8).translate(cx, 1.7, cz));
        this.colliders.push({
            x: cx,
            z: cz,
            hw: 3.4,
            hd: 3.4,
            h: 1
        });
        // trees
        const treeTrunk = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.22, 0.3, 3, 6);
        const treeTop = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IcosahedronGeometry"](1.9, 0);
        for(let i = 0; i < 8; i++){
            const a = i / 8 * Math.PI * 2 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 0.5);
            const r = Math.min(uw, ud) / 2 - 6;
            const tx = cx + Math.cos(a) * r;
            const tz = cz + Math.sin(a) * r;
            geos.push(treeTrunk.clone().translate(tx, 1.5, tz));
            const top = treeTop.clone().translate(tx, 4, tz);
            this.tintGeo(top, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4d6b35').offsetHSL(0, 0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.05, 0.06)));
            geos.push(top);
            this.colliders.push({
                x: tx,
                z: tz,
                hw: 0.5,
                hd: 0.5,
                h: 3
            });
        }
        const merged = this.mergeAll(geos, '#5a4632');
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        });
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](merged, m));
    }
    tintGeo(g, c) {
        const n = g.attributes.position.count;
        const col = new Float32Array(n * 3);
        for(let i = 0; i < n; i++){
            col[i * 3] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        g.setAttribute('color', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](col, 3));
    }
    /* ================= street lamps ================= */ buildLamps() {
        const lampPts = [];
        for (const rx of V_ROADS){
            for(let z = -860; z <= -340; z += 105){
                if (H_ROADS.some((h)=>Math.abs(h - z) < 12)) continue;
                const side = Math.round(z / 105) % 2 === 0 ? 1 : -1;
                lampPts.push({
                    x: rx + side * 8.6,
                    z,
                    ry: side > 0 ? Math.PI : 0
                });
            }
        }
        for (const rz of H_ROADS){
            for(let x = -260; x <= 260; x += 104){
                if (V_ROADS.some((v)=>Math.abs(v - x) < 12)) continue;
                const side = Math.round(x / 104) % 2 === 0 ? 1 : -1;
                lampPts.push({
                    x,
                    z: rz + side * 8.6,
                    ry: side > 0 ? -Math.PI / 2 : Math.PI / 2
                });
            }
        }
        // highway lamps
        for(let z = -240; z <= 560; z += 100){
            const side = Math.round(z / 100) % 2 === 0 ? 1 : -1;
            lampPts.push({
                x: side * 8.6,
                z,
                ry: side > 0 ? Math.PI : 0
            });
        }
        // town lamps
        for(let x = -180; x <= 180; x += 72){
            lampPts.push({
                x,
                z: TOWN.streetZ + (x % 144 === 0 ? 9 : -9),
                ry: x % 144 === 0 ? Math.PI : 0
            });
        }
        const poleGeos = [];
        const headGeos = [];
        for (const p of lampPts){
            poleGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.09, 0.13, 7, 6).translate(p.x, 3.5, p.z));
            const armLen = 1.7;
            // arm points toward road center (opposite of side offset)
            const dx = Math.sin(p.ry + Math.PI);
            const dz = Math.cos(p.ry + Math.PI);
            const hx = p.x + dx * armLen;
            const hz = p.z + dz * armLen;
            poleGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.1, 0.1, armLen).rotateY(Math.atan2(dx, dz)).translate(p.x + dx * armLen / 2, 6.9, p.z + dz * armLen / 2));
            headGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.55, 0.22, 0.9).rotateY(Math.atan2(dx, dz) + Math.PI / 2).translate(hx, 6.8, hz));
            this.lamps.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](hx, 6.6, hz));
        }
        const poleMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x2c2e33
        });
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(poleGeos.filter(Boolean)), poleMat));
        this.lampHeadMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x554d3a,
            emissive: 0xffd88a,
            emissiveIntensity: 0
        });
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(headGeos), this.lampHeadMat));
        // glow points
        const gGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferGeometry"]();
        gGeo.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](this.lamps.flatMap((v)=>[
                v.x,
                v.y,
                v.z
            ]), 3));
        this.lampGlowMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PointsMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])(),
            color: 0xffd88a,
            size: 5,
            transparent: true,
            opacity: 0,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false,
            sizeAttenuation: true
        });
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Points"](gGeo, this.lampGlowMat));
        // light pools on ground
        const poolGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](11, 11);
        poolGeo.rotateX(-Math.PI / 2);
        const poolInst = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InstancedMesh"](poolGeo, this.poolMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])(),
            color: 0x5a4a28,
            transparent: true,
            opacity: 0,
            blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"],
            depthWrite: false
        }), this.lamps.length);
        const mm = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix4"]();
        this.lamps.forEach((v, i)=>{
            mm.makeTranslation(v.x, 0.08, v.z);
            poolInst.setMatrixAt(i, mm);
        });
        this.group.add(poolInst);
    }
    /* ================= western town ================= */ buildTown() {
        const q = this.quality;
        // dirt slab
        const slab = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](480, 260), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0xa8835a,
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texDesert"])()
        }));
        slab.rotation.x = -Math.PI / 2;
        slab.position.set(0, 0.02, 600);
        slab.receiveShadow = q !== 'low';
        this.group.add(slab);
        const wGeos = [] // wood colored
        ;
        const aGeos = [] // adobe/plaster
        ;
        const addBuilding = (x, z, w, d, h, wood = true, tint = '#936b3e')=>{
            const g = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(w, h, d, x, h / 2, z, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](tint));
            (wood ? wGeos : aGeos).push(g);
            this.colliders.push({
                x,
                z,
                hw: w / 2,
                hd: d / 2,
                h
            });
            this.minimap.rects.push({
                x,
                z,
                hw: w / 2,
                hd: d / 2,
                t: 'b'
            });
        };
        // flat roof lip
        const roofG = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0, 0, 0, 0, 0, 0);
        // north row (front faces street at z=600)
        addBuilding(-5, 572, 46, 26, 9, true, '#c09058'); // saloon
        addBuilding(55, 574, 40, 22, 8, true, '#b0824c'); // hotel
        addBuilding(100, 576, 30, 18, 5.5, true, '#a87c4c');
        addBuilding(-110, 576, 30, 18, 5.5, true, '#a87c4c');
        addBuilding(-65, 574, 40, 22, 6, true, '#b8885a'); // general store
        // south row
        addBuilding(-40, 627, 40, 24, 7, true, '#8a94a4'); // sheriff
        addBuilding(30, 625, 30, 20, 6, true, '#b8884c'); // gunsmith
        addBuilding(145, 627, 30, 18, 5.5, true, '#a87c4c');
        // church (adobe)
        addBuilding(-130, 629, 34, 26, 9, false, '#9a7a50');
        aGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(4, 14, 4, -130, 7, 619, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#9a7a50')));
        aGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1, 3.4, 0.6, -130, 15.5, 619, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#d8c8a0')));
        aGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(2.6, 1, 0.6, -130, 14.4, 619, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#d8c8a0')));
        this.colliders.push({
            x: -130,
            z: 619,
            hw: 2.2,
            hd: 2.2,
            h: 14
        });
        // stable (open front): back + sides
        wGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(50, 6, 1, 95, 3, 638, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#96703e')));
        wGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1, 6, 24, 71, 3, 626.5, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#96703e')));
        wGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1, 6, 24, 119, 3, 626.5, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#96703e')));
        wGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(52, 0.8, 26, 95, 6.2, 626, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#6b4a28')));
        this.colliders.push({
            x: 95,
            z: 638,
            hw: 25,
            hd: 0.6,
            h: 6
        });
        this.colliders.push({
            x: 71,
            z: 626.5,
            hw: 0.6,
            hd: 12,
            h: 6
        });
        this.colliders.push({
            x: 119,
            z: 626.5,
            hw: 0.6,
            hd: 12,
            h: 6
        });
        this.minimap.rects.push({
            x: 95,
            z: 627,
            hw: 25,
            hd: 12,
            t: 'b'
        });
        void roofG;
        const wMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texWood"])(),
            vertexColors: true
        });
        const wMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(wGeos), wMat);
        wMesh.castShadow = q === 'high';
        wMesh.receiveShadow = q !== 'low';
        this.group.add(wMesh);
        const aMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texConcrete"])(),
            vertexColors: true
        });
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(aGeos), aMat));
        // signs
        this.addSign(-5, 586.2, 0, 'سالون سنگ‌سرخ', 12, 2.4, '#4a2418', '#ffd88a');
        this.addSign(55, 586.2, 0, 'هتل');
        this.addSign(-65, 586.2, 0, 'بازار عمومی', 9, 1.8);
        this.addSign(-40, 614, Math.PI, 'کلانتری', 9, 1.8, '#2c3444', '#d8e0f0');
        this.addSign(30, 614.2, Math.PI, 'مغازه اسلحه', 9, 1.8, '#33241a', '#e8c880');
        this.addSign(95, 613.5, Math.PI, 'اصطبل', 8, 1.6);
        this.addSign(-130, 615.5, Math.PI, 'کلیسا', 7, 1.5, '#4a3c28', '#f0e8d0');
        // boardwalks
        const bw1 = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](250, 8), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texWood"])(),
            color: 0xb09068
        }));
        bw1.rotation.x = -Math.PI / 2;
        bw1.position.set(-2, 0.07, 589);
        this.group.add(bw1);
        const bw2 = bw1.clone();
        bw2.position.set(-2, 0.07, 611);
        this.group.add(bw2);
        // props: barrels, crates, hitching posts, wagon
        const pGeos = [];
        for(let i = 0; i < 8; i++){
            const bx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-30, 70), bz = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                589,
                611
            ]);
            pGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.42, 0.42, 1, 8).translate(bx, 0.5, bz));
        }
        // barrel tint ring is applied by wrapping cylinders below via unified default tint
        const barrelStart = pGeos.length - 8;
        for(let i = 0; i < 6; i++){
            const bx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-120, 120), bz = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                588,
                612
            ]);
            pGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1.1, 1.1, 1.1, bx, 0.55, bz, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 1), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#8a6a3c')));
        }
        // hitching rails
        for (const hx of [
            -20,
            40,
            -75
        ]){
            pGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.14, 1.1, 0.14, hx - 2.4, 0.55, 596, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4a3520')));
            pGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.14, 1.1, 0.14, hx + 2.4, 0.55, 596, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4a3520')));
            pGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(5.2, 0.12, 0.12, hx, 1.05, 596, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4a3520')));
        }
        // wagon
        pGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(2.6, 1, 4.4, -85, 1.2, 604, 0.3, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#6b4a28')));
        for (const [wx, wz] of [
            [
                -86.4,
                602.4
            ],
            [
                -83.6,
                602.4
            ],
            [
                -86.4,
                605.6
            ],
            [
                -83.6,
                605.6
            ]
        ]){
            pGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.55, 0.55, 0.18, 10).rotateZ(Math.PI / 2).translate(wx, 0.55, wz));
        }
        this.colliders.push({
            x: -85,
            z: 604,
            hw: 1.8,
            hd: 2.4,
            h: 2
        });
        // water tower
        for (const [lx, lz] of [
            [
                166,
                650
            ],
            [
                174,
                650
            ],
            [
                166,
                658
            ],
            [
                174,
                658
            ]
        ]){
            pGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.22, 0.28, 9, 6).translate(lx, 4.5, lz));
        }
        pGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](3.4, 3.1, 4.4, 10).translate(170, 11, 654));
        pGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConeGeometry"](3.7, 1.8, 10).translate(170, 14.1, 654));
        // tint the un-tinted cylinders (barrels + tower) so they are not white
        for(let i = barrelStart; i < pGeos.length; i++){
            if (!pGeos[i].attributes.color) {
                const isTower = i >= pGeos.length - 6;
                this.tintGeo(pGeos[i], new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](isTower ? '#8a6a4a' : '#7a4526'));
            }
        }
        this.colliders.push({
            x: 170,
            z: 654,
            hw: 3.4,
            hd: 3.4,
            h: 9
        });
        this.minimap.rects.push({
            x: 170,
            z: 654,
            hw: 3.4,
            hd: 3.4,
            t: 'w'
        });
        const pMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(pGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        pMesh.castShadow = q === 'high';
        this.group.add(pMesh);
        this.horseSpots.push({
            x: 95,
            z: 610
        }, {
            x: 110,
            z: 610
        });
    }
    /* ================= desert ================= */ buildDesert() {
        const q = this.quality;
        const nMul = q === 'low' ? 0.5 : q === 'med' ? 0.75 : 1;
        /* rocks (instanced) */ const rockGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IcosahedronGeometry"](1, 0);
        const rockMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        });
        const bigN = Math.floor(70 * nMul), smallN = Math.floor(170 * nMul);
        const rocks = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InstancedMesh"](rockGeo, rockMat, bigN + smallN);
        const m4 = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix4"]();
        const col = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]();
        let placed = 0;
        const scatter = (count, big)=>{
            for(let i = 0; i < count; i++){
                let x = 0, z = 0, ok = false;
                for(let t = 0; t < 20 && !ok; t++){
                    x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                    z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                    ok = !this.inCity(x, z, 30) && !this.inTown(x, z, 30) && !this.nearRoad(x, z, 14);
                }
                if (!ok) continue;
                const s = big ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1.6, 4.2) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.4, 1.3);
                m4.compose(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, s * 0.35, z), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Euler"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 3), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 3))), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](s * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1, 1.6), s, s * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1, 1.6)));
                rocks.setMatrixAt(placed, m4);
                rocks.setColorAt(placed, col.setHSL(0.08, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.15, 0.3), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.32, 0.5)));
                if (big) this.colliders.push({
                    x,
                    z,
                    hw: s * 1.1,
                    hd: s * 1.1,
                    h: s
                });
                if (big) this.minimap.rects.push({
                    x,
                    z,
                    hw: s,
                    hd: s,
                    t: 'r'
                });
                placed++;
            }
        };
        scatter(bigN, true);
        scatter(smallN, false);
        rocks.count = placed;
        rocks.castShadow = q === 'high';
        rocks.receiveShadow = q !== 'low';
        this.group.add(rocks);
        /* cacti */ const cacGeos = [];
        cacGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.26, 0.34, 2.8, 7).translate(0, 1.4, 0));
        cacGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.15, 0.18, 1.1, 6).rotateZ(Math.PI / 2).translate(0.55, 1.5, 0));
        cacGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.15, 0.15, 0.9, 6).translate(1.0, 2.1, 0));
        cacGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.14, 0.17, 0.9, 6).rotateZ(-Math.PI / 2).translate(-0.5, 1.1, 0));
        cacGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.13, 0.13, 0.7, 6).translate(-0.9, 1.65, 0));
        const cacGeo = this.mergeAll(cacGeos);
        this.tintGeo(cacGeo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#ffffff')); // tint via instance color
        const cacti = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InstancedMesh"](cacGeo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0xffffff
        }), Math.floor(260 * nMul));
        let cp = 0;
        for(let i = 0; i < cacti.count; i++){
            let x = 0, z = 0, ok = false;
            for(let t = 0; t < 15 && !ok; t++){
                x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                ok = !this.inCity(x, z, 20) && !this.inTown(x, z, 25) && !this.nearRoad(x, z, 11);
            }
            if (!ok) continue;
            const s = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.7, 1.5);
            m4.compose(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0, z), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Euler"](0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6), 0)), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](s, s * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.85, 1.25), s));
            cacti.setMatrixAt(cp, m4);
            cacti.setColorAt(cp, col.setHSL(0.29, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.3, 0.45), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.22, 0.34)));
            cp++;
        }
        cacti.count = cp;
        cacti.castShadow = q === 'high';
        this.group.add(cacti);
        /* bushes */ const bushGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["IcosahedronGeometry"](0.55, 0);
        bushGeo.scale(1.3, 0.7, 1.3);
        const bushes = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["InstancedMesh"](bushGeo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0xffffff
        }), Math.floor(360 * nMul));
        let bp = 0;
        for(let i = 0; i < bushes.count; i++){
            let x = 0, z = 0, ok = false;
            for(let t = 0; t < 10 && !ok; t++){
                x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-WORLD_HALF, WORLD_HALF);
                ok = !this.inCity(x, z, 10) && !this.inTown(x, z, 15) && !this.nearRoad(x, z, 9);
            }
            if (!ok) continue;
            const s = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.6, 1.6);
            m4.compose(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0.25 * s, z), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Quaternion"]().setFromEuler(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Euler"](0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6), 0)), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](s, s, s));
            bushes.setMatrixAt(bp, m4);
            bushes.setColorAt(bp, col.setHSL((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.12, 0.2), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.25, 0.4), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.22, 0.32)));
            bp++;
        }
        bushes.count = bp;
        this.group.add(bushes);
        /* skyline mesas */ const mesaGeos = [];
        for(let i = 0; i < 18; i++){
            const a = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, Math.PI * 2);
            const r = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(980, 1540);
            const x = Math.cos(a) * r, z = Math.sin(a) * r;
            const w = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(70, 200), h = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(30, 95), d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(70, 200);
            mesaGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(w, h, d, x, h / 2 - 4, z, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#8a6a4a').offsetHSL(0, 0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.06, 0.06))));
            if (i % 3 === 0) this.minimap.rects.push({
                x,
                z,
                hw: w / 2,
                hd: d / 2,
                t: 'r'
            });
        }
        this.group.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(mesaGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        })));
        /* bandit camps */ const campDefs = [
            {
                x: -700,
                z: 180
            },
            {
                x: 650,
                z: 820
            },
            {
                x: 760,
                z: -80
            },
            {
                x: -350,
                z: -1050
            }
        ];
        const campGeos = [];
        for (const cd of campDefs){
            const spawns = [];
            for(let i = 0; i < 4; i++){
                const a = i / 4 * Math.PI * 2 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 1);
                spawns.push({
                    x: cd.x + Math.cos(a) * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(6, 12),
                    z: cd.z + Math.sin(a) * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(6, 12)
                });
            }
            this.camps.push({
                x: cd.x,
                z: cd.z,
                spawns
            });
            this.minimap.camps.push({
                x: cd.x,
                z: cd.z
            });
            // tents
            for(let i = 0; i < 3; i++){
                const a = i / 3 * Math.PI * 2;
                const tx = cd.x + Math.cos(a) * 7, tz = cd.z + Math.sin(a) * 7;
                campGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConeGeometry"](2.4, 2.8, 7).translate(tx, 1.4, tz));
                this.colliders.push({
                    x: tx,
                    z: tz,
                    hw: 1.8,
                    hd: 1.8,
                    h: 2.4
                });
                this.minimap.rects.push({
                    x: tx,
                    z: tz,
                    hw: 2,
                    hd: 2,
                    t: 't'
                });
            }
            // campfire logs
            for(let i = 0; i < 3; i++){
                campGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.09, 0.11, 1.3, 5).rotateZ(Math.PI / 2.3).rotateY(i * 2.1).translate(cd.x, 0.25, cd.z));
            }
            // crates
            campGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1, 1, 1, cd.x + 2.5, 0.5, cd.z + 1.5, 0.4, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#7a5a30')));
            this.firePoints.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](cd.x, 0.55, cd.z));
        }
        const campMesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(campGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        this.group.add(campMesh);
        /* campfire lights */ if (q !== 'low') {
            for (const fp of this.firePoints){
                const l = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PointLight"](0xff7a2a, 2.2, 26, 1.6);
                l.position.copy(fp).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.2, 0));
                this.group.add(l);
                this.fireLights.push(l);
                this.fireFlick.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 10));
            }
        }
        /* wild horses & parked cars */ this.horseSpots.push(this.spots.starterHorse, {
            x: 350,
            z: 260
        }, {
            x: -480,
            z: -60
        }, {
            x: 520,
            z: -560
        }, {
            x: -560,
            z: 690
        });
        this.parkedSpots.push(this.spots.starterCar, this.spots.extraCar, {
            x: -114,
            z: -700,
            h: Math.PI / 2
        }, {
            x: 126,
            z: -520,
            h: -Math.PI / 2
        }, {
            x: -6,
            z: -350,
            h: 0
        }, {
            x: -240 - 6,
            z: -800,
            h: Math.PI / 2
        }, {
            x: 186,
            z: -440,
            h: 0
        }, {
            x: -186,
            z: -620,
            h: Math.PI
        }, {
            x: 66,
            z: -800,
            h: 0
        }, {
            x: -66,
            z: -420,
            h: Math.PI
        }, {
            x: 10,
            z: -80,
            h: 0
        }, {
            x: -34,
            z: 372,
            h: Math.PI
        }, {
            x: 560,
            z: -490,
            h: Math.PI / 2
        }, {
            x: -160,
            z: -478,
            h: 0
        }, {
            x: -640,
            z: 640,
            h: Math.PI / 2
        }, {
            x: 420,
            z: 330,
            h: -Math.PI / 2
        });
        // police cars at station
        this.parkedSpots.push({
            x: 60 + 14,
            z: -570 + 22,
            h: Math.PI / 2,
            police: true
        }, {
            x: 60 + 14,
            z: -570 + 32,
            h: Math.PI / 2,
            police: true
        });
    }
    /* ================= gas stations (repair & rest stop) ================= */ buildGasStations() {
        for (const gs of this.spots.gasStations){
            const side = gs.x >= 0 ? 1 : -1;
            const gGeos = [];
            // shop building
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(12, 4.5, 8, gs.x + side * 26, 2.25, gs.z, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#c8c2b4')));
            this.colliders.push({
                x: gs.x + side * 26,
                z: gs.z,
                hw: 6,
                hd: 4,
                h: 4.5
            });
            this.minimap.rects.push({
                x: gs.x + side * 26,
                z: gs.z,
                hw: 6,
                hd: 4,
                t: 'b'
            });
            // canopy pillars + roof
            for (const [px, pz] of [
                [
                    -5,
                    -4
                ],
                [
                    5,
                    -4
                ],
                [
                    -5,
                    4
                ],
                [
                    5,
                    4
                ]
            ]){
                const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.28, 0.28, 5, 8).translate(gs.x + px, 2.5, gs.z + pz);
                this.tintGeo(g, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#9a9a9a'));
                gGeos.push(g);
            }
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(16, 0.7, 14, gs.x, 5.3, gs.z, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#b03a2a')));
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(16, 0.5, 2.2, gs.x, 4.6, gs.z + 7.6, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#b03a2a')));
            // pumps
            for (const px of [
                -2.5,
                2.5
            ]){
                gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1.1, 1.6, 0.8, gs.x + px, 0.8, gs.z, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#8a2f22')));
                this.colliders.push({
                    x: gs.x + px,
                    z: gs.z,
                    hw: 0.7,
                    hd: 0.55,
                    h: 1.6
                });
            }
            const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(gGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
                vertexColors: true
            }));
            mesh.castShadow = this.quality === 'high';
            this.group.add(mesh);
            this.addSign(gs.x + side * 8, gs.z + 12.5, side > 0 ? Math.PI : 0, 'گازولین — تعمیرگاه', 10, 1.9, '#7a1f14', '#ffd88a');
        }
    }
    /* ================= farm ================= */ buildFarm() {
        const f = this.spots.farm;
        const gGeos = [];
        // barn
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(18, 8, 12, f.x, 4, f.z - 18, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#8a3a2a')));
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(19, 1, 13, f.x, 8.4, f.z - 18, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#5a2418')));
        this.colliders.push({
            x: f.x,
            z: f.z - 18,
            hw: 9,
            hd: 6,
            h: 8
        });
        this.minimap.rects.push({
            x: f.x,
            z: f.z - 18,
            hw: 9,
            hd: 6,
            t: 'b'
        });
        // silo
        const silo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](3, 3.2, 13, 10).translate(f.x + 16, 6.5, f.z - 24);
        this.tintGeo(silo, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#b0aa9e'));
        gGeos.push(silo);
        const siloTop = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConeGeometry"](3.5, 2.6, 10).translate(f.x + 16, 14.2, f.z - 24);
        this.tintGeo(siloTop, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#7a6a50'));
        gGeos.push(siloTop);
        this.colliders.push({
            x: f.x + 16,
            z: f.z - 24,
            hw: 3.2,
            hd: 3.2,
            h: 13
        });
        this.minimap.rects.push({
            x: f.x + 16,
            z: f.z - 24,
            hw: 3.2,
            hd: 3.2,
            t: 'w'
        });
        // windmill
        const mast = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.25, 0.5, 12, 6).translate(f.x - 18, 6, f.z + 8);
        this.tintGeo(mast, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#8a8478'));
        gGeos.push(mast);
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(4.4, 0.5, 0.15, f.x - 18, 11.6, f.z + 8, 0.5, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#7a7468')));
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(4.4, 0.5, 0.15, f.x - 18, 11.6, f.z + 8, -0.5, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#7a7468')));
        this.colliders.push({
            x: f.x - 18,
            z: f.z + 8,
            hw: 0.6,
            hd: 0.6,
            h: 12
        });
        // hay bales
        for(let i = 0; i < 5; i++){
            const hay = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.8, 0.8, 1.4, 9).rotateZ(Math.PI / 2).translate(f.x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-10, 10), 0.8, f.z + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(2, 12));
            this.tintGeo(hay, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#c8a850'));
            gGeos.push(hay);
        }
        // trough + fence posts around yard
        for(let i = 0; i < 14; i++){
            const a = i / 14 * Math.PI * 2;
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.16, 1.1, 0.16, f.x + Math.cos(a) * 30, 0.55, f.z + Math.sin(a) * 30, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#5a4028')));
        }
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(gGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        mesh.castShadow = this.quality === 'high';
        this.group.add(mesh);
        // plowed field
        const field = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](34, 22), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x5a4632,
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texDesert"])()
        }));
        field.rotation.x = -Math.PI / 2;
        field.position.set(f.x + 4, 0.04, f.z + 26);
        this.group.add(field);
        this.addSign(f.x - 6, f.z - 6, 0, 'مزرعه دلگون', 9, 1.8, '#4a3a20', '#e8d8a0');
        this.firePoints.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](f.x - 4, 0.55, f.z - 4));
        if (this.quality !== 'low') {
            const l = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PointLight"](0xff7a2a, 2.2, 26, 1.6);
            l.position.set(f.x - 4, 1.6, f.z - 4);
            this.group.add(l);
            this.fireLights.push(l);
            this.fireFlick.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 10));
        }
    }
    /* ================= lake & pier ================= */ buildLake() {
        const cx = -650, cz = 750;
        const water = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CircleGeometry"](130, 26), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x2e6a8a,
            transparent: true,
            opacity: 0.85
        }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(cx, 0.05, cz);
        this.group.add(water);
        // pier
        const gGeos = [];
        for(let i = 0; i < 8; i++){
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(3.4, 0.25, 2.2, cx + 62, 0.7, 690 + i * 8.6, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#6b4a28')));
        }
        for(let i = 0; i < 8; i += 2){
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.22, 2, 0.22, cx + 60.6, 0.5, 690 + i * 8.6 + 4, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4a3520')));
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.22, 2, 0.22, cx + 63.4, 0.5, 690 + i * 8.6 + 4, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#4a3520')));
        }
        // rowboat
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1.8, 0.7, 5, cx - 40, 0.55, cz - 20, 0.4, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#7a5a34')));
        gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(1.4, 0.5, 4.2, cx - 40, 0.85, cz - 20, 0.4, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#5a4024')));
        // reeds
        for(let i = 0; i < 26; i++){
            const a = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, Math.PI * 2);
            const r = 128 + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-4, 4);
            const reed = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ConeGeometry"](0.14, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1.2, 2.2), 5).translate(cx + Math.cos(a) * r, 0.7, cz + Math.sin(a) * r);
            this.tintGeo(reed, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#5a7a3a'));
            gGeos.push(reed);
        }
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(gGeos), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        mesh.castShadow = this.quality === 'high';
        this.group.add(mesh);
        this.addSign(cx + 66, 682, Math.PI, 'دریاچه آبی', 8, 1.7, '#1e3a4a', '#c8e8f0');
    }
    /* ================= radio tower ================= */ buildRadioTower() {
        const t = this.spots.treasureSpot;
        const gGeos = [];
        for(let i = 0; i < 3; i++){
            const h = 14, y = i * h + h / 2;
            const r0 = 2.2 - i * 0.55, r1 = 2.2 - (i + 1) * 0.55;
            gGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](r1, r0, h, 4, 1, true).translate(t.x, y, t.z));
            gGeos.push((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(0.14, 0.14, 0.14, t.x, y, t.z));
        }
        gGeos.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.1, 0.1, 4, 5).translate(t.x, 43, t.z));
        const mesh = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](this.mergeAll(gGeos, '#8a8f96'), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        mesh.castShadow = this.quality === 'high';
        this.group.add(mesh);
        this.colliders.push({
            x: t.x,
            z: t.z,
            hw: 2.4,
            hd: 2.4,
            h: 42
        });
        this.minimap.rects.push({
            x: t.x,
            z: t.z,
            hw: 2.4,
            hd: 2.4,
            t: 'w'
        });
        // blinking beacon
        this.radioBeacon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])(),
            color: 0xff3030,
            transparent: true,
            opacity: 0.9,
            depthWrite: false
        }));
        this.radioBeacon.scale.setScalar(6);
        this.radioBeacon.position.set(t.x, 45.5, t.z);
        this.group.add(this.radioBeacon);
        // small hut at base
        const hut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["boxGeo"])(6, 3, 5, t.x + 8, 1.5, t.z + 6, 0, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]('#9a948a'));
        const hm = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](hut, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            vertexColors: true
        }));
        this.group.add(hm);
        this.colliders.push({
            x: t.x + 8,
            z: t.z + 6,
            hw: 3,
            hd: 2.5,
            h: 3
        });
    }
    /* ================= traffic graph ================= */ buildGraph() {
        const nodes = [];
        const idx = (x, z)=>{
            const i = nodes.findIndex((n)=>n.x === x && n.z === z);
            if (i >= 0) return i;
            nodes.push({
                x,
                z
            });
            return nodes.length - 1;
        };
        const edges = [];
        const link = (a, b)=>{
            edges.push([
                a,
                b
            ]);
        };
        // grid
        const gridIdx = [];
        for(let ri = 0; ri < H_ROADS.length; ri++){
            gridIdx[ri] = [];
            for(let ci = 0; ci < V_ROADS.length; ci++){
                gridIdx[ri][ci] = idx(V_ROADS[ci], H_ROADS[ri]);
            }
        }
        for(let ri = 0; ri < H_ROADS.length; ri++){
            for(let ci = 0; ci < V_ROADS.length; ci++){
                if (ci < V_ROADS.length - 1) link(gridIdx[ri][ci], gridIdx[ri][ci + 1]);
                if (ri < H_ROADS.length - 1) link(gridIdx[ri][ci], gridIdx[ri + 1][ci]);
            }
        }
        // highway chain south of city
        const hwyZ = [
            -300,
            -160,
            0,
            160,
            320,
            480,
            600
        ];
        let prev = idx(0, -300);
        for(let i = 1; i < hwyZ.length; i++){
            const n = idx(0, hwyZ[i]);
            link(prev, n);
            prev = n;
        }
        // town street
        const t1 = idx(-200, 600), t2 = idx(0, 600), t3 = idx(200, 600);
        link(t1, t2);
        link(t2, t3);
        // adjacency
        const adj = nodes.map(()=>[]);
        for (const [a, b] of edges){
            adj[a].push(b);
            adj[b].push(a);
        }
        this.graph = {
            nodes,
            adj
        };
    }
    tmpV;
    update(night, dt) {
        // windows: dark by day, warm glow by night
        this.windowMat.color.setRGB(0.11 + night * 1.15, 0.13 + night * 0.85, 0.17 + night * 0.38);
        this.lampHeadMat.emissiveIntensity = night * 2.4;
        this.lampGlowMat.opacity = night * 0.85;
        this.poolMat.opacity = night * 0.5;
        // radio beacon blink
        this.blink += dt;
        this.radioBeacon.material.opacity = Math.sin(this.blink * 2.2) > 0 ? 0.9 : 0.12;
        // fire flicker
        for(let i = 0; i < this.fireLights.length; i++){
            this.fireFlick[i] += dt * (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(6, 12);
            this.fireLights[i].intensity = 1.8 + Math.sin(this.fireFlick[i]) * 0.5 + Math.sin(this.fireFlick[i] * 2.7) * 0.3;
        }
        void this.tmpV;
        void __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"];
    }
}
}),
"[project]/src/game/audio.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Procedural sound kit — all sounds are synthesized with WebAudio (no asset files).
 */ __turbopack_context__.s([
    "Sfx",
    ()=>Sfx
]);
class Sfx {
    ctx = null;
    master = null;
    noiseBuf = null;
    engineNodes = null;
    sirenTimer = null;
    sirenOsc = null;
    sirenGain = null;
    windGain = null;
    windFilter = null;
    ambientTimer = null;
    ambientOn = false;
    muted = false;
    /** must be called from a user gesture */ init() {
        if (this.ctx) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.muted ? 0 : 0.55;
            this.master.connect(this.ctx.destination);
            const len = this.ctx.sampleRate * 1.2;
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = this.noiseBuf.getChannelData(0);
            for(let i = 0; i < len; i++)d[i] = Math.random() * 2 - 1;
        } catch  {
            this.ctx = null;
        }
    }
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
    }
    setMuted(m) {
        this.muted = m;
        if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05);
    }
    noise(dur, freq, q, vol, type = 'lowpass', delay = 0) {
        if (!this.ctx || !this.master || !this.noiseBuf) return;
        const t = this.ctx.currentTime + delay;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        src.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(f).connect(g).connect(this.master);
        src.start(t);
        src.stop(t + dur + 0.05);
    }
    tone(freq, dur, vol, type = 'sine', delay = 0, slideTo) {
        if (!this.ctx || !this.master) return;
        const t = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + dur + 0.05);
    }
    shot(kind) {
        if (kind === 'revolver') {
            this.noise(0.22, 1400, 0.6, 0.9);
            this.noise(0.5, 500, 1, 0.22, 'lowpass', 0.03); // echo
            this.tone(140, 0.12, 0.5, 'triangle', 0, 60);
        } else if (kind === 'pistol') {
            this.noise(0.14, 2200, 0.7, 0.65);
            this.tone(200, 0.08, 0.35, 'triangle', 0, 90);
        } else {
            this.noise(0.3, 900, 0.5, 1.0);
            this.noise(0.7, 320, 1, 0.3, 'lowpass', 0.05);
            this.tone(90, 0.18, 0.6, 'triangle', 0, 40);
        }
    }
    enemyShot(far) {
        const v = Math.max(0.05, 0.5 - far * 0.01);
        this.noise(0.15, 1200, 0.7, v);
    }
    dryFire() {
        this.tone(900, 0.04, 0.15, 'square');
    }
    reload() {
        this.tone(500, 0.05, 0.2, 'square');
        this.tone(700, 0.05, 0.2, 'square', 0.18);
    }
    hit() {
        this.tone(1600, 0.05, 0.25, 'square');
    }
    kill() {
        this.tone(220, 0.25, 0.4, 'triangle', 0, 80);
        this.noise(0.2, 400, 1, 0.3);
    }
    hurt() {
        this.noise(0.2, 600, 1, 0.4);
        this.tone(160, 0.2, 0.3, 'sawtooth', 0, 70);
    }
    pickup() {
        this.tone(660, 0.09, 0.25);
        this.tone(990, 0.12, 0.25, 'sine', 0.09);
    }
    cash() {
        this.tone(1320, 0.07, 0.2, 'sine');
        this.tone(1760, 0.1, 0.2, 'sine', 0.07);
    }
    buy() {
        this.noise(0.1, 5000, 2, 0.2, 'highpass');
        this.tone(880, 0.08, 0.25, 'sine', 0.02);
        this.tone(1320, 0.12, 0.25, 'sine', 0.1);
    }
    jingleWin() {
        const notes = [
            523,
            659,
            784,
            1046
        ];
        notes.forEach((n, i)=>this.tone(n, 0.28, 0.22, 'triangle', i * 0.13));
    }
    jingleFail() {
        this.tone(330, 0.3, 0.25, 'triangle');
        this.tone(233, 0.5, 0.25, 'triangle', 0.28);
    }
    horn() {
        this.tone(340, 0.35, 0.3, 'square');
        this.tone(425, 0.35, 0.25, 'square');
    }
    neigh() {
        this.tone(700, 0.4, 0.18, 'sawtooth', 0, 380);
        this.noise(0.3, 1800, 2, 0.12, 'bandpass', 0.05);
    }
    explosion() {
        this.noise(1.2, 300, 0.5, 1.2);
        this.tone(60, 0.9, 0.8, 'triangle', 0, 30);
        this.noise(0.6, 120, 1, 0.5, 'lowpass', 0.15);
    }
    crash(v) {
        this.noise(0.25, 900, 0.8, Math.min(0.8, 0.15 + v * 0.04));
        this.tone(120, 0.15, 0.3, 'square', 0, 60);
    }
    door() {
        this.noise(0.08, 700, 1, 0.25);
    }
    hoof() {
        this.noise(0.06, 260, 2.5, 0.18, 'bandpass');
    }
    step() {
        this.noise(0.05, 320, 2, 0.07, 'bandpass');
    }
    checkpoint() {
        this.tone(880, 0.1, 0.25, 'sine');
        this.tone(1174, 0.14, 0.25, 'sine', 0.1);
    }
    star() {
        this.tone(392, 0.12, 0.3, 'square');
        this.tone(523, 0.12, 0.3, 'square', 0.12);
    }
    click() {
        this.tone(600, 0.04, 0.15, 'square');
    }
    /* ---- engine loop ---- */ engineStart() {
        if (!this.ctx || !this.master || this.engineNodes) return;
        const o = this.ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = 55;
        const o2 = this.ctx.createOscillator();
        o2.type = 'square';
        o2.frequency.value = 28;
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 420;
        const g = this.ctx.createGain();
        g.gain.value = 0;
        o.connect(f);
        o2.connect(f);
        f.connect(g);
        g.connect(this.master);
        o.start();
        o2.start();
        this.engineNodes = {
            osc: o,
            osc2: o2,
            gain: g,
            filter: f
        };
    }
    engineUpdate(speed, throttle, active) {
        if (!this.engineNodes || !this.ctx) return;
        const t = this.ctx.currentTime;
        const rpm = 55 + Math.abs(speed) * 4.2;
        this.engineNodes.osc.frequency.setTargetAtTime(rpm, t, 0.06);
        this.engineNodes.osc2.frequency.setTargetAtTime(rpm * 0.5, t, 0.06);
        this.engineNodes.filter.frequency.setTargetAtTime(360 + Math.abs(speed) * 26, t, 0.1);
        this.engineNodes.gain.gain.setTargetAtTime(active ? 0.05 + Math.abs(throttle) * 0.06 + Math.abs(speed) * 0.0012 : 0, t, 0.1);
    }
    engineStop() {
        if (this.engineNodes && this.ctx) {
            this.engineNodes.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
            const n = this.engineNodes;
            setTimeout(()=>{
                try {
                    n.osc.stop();
                    n.osc2.stop();
                } catch  {}
            }, 400);
            this.engineNodes = null;
        }
    }
    /* ---- siren ---- */ sirenOn() {
        if (!this.ctx || !this.master || this.sirenOsc) return;
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 660;
        const g = this.ctx.createGain();
        g.gain.value = 0.045;
        o.connect(g).connect(this.master);
        o.start();
        this.sirenOsc = o;
        this.sirenGain = g;
        let hi = false;
        this.sirenTimer = setInterval(()=>{
            hi = !hi;
            if (this.sirenOsc && this.ctx) this.sirenOsc.frequency.setTargetAtTime(hi ? 880 : 620, this.ctx.currentTime, 0.08);
        }, 480);
    }
    sirenVol(v) {
        if (this.sirenGain && this.ctx) this.sirenGain.gain.setTargetAtTime(0.05 * v, this.ctx.currentTime, 0.2);
    }
    sirenOff() {
        if (this.sirenTimer) {
            clearInterval(this.sirenTimer);
            this.sirenTimer = null;
        }
        if (this.sirenOsc && this.ctx) {
            this.sirenGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.15);
            const o = this.sirenOsc;
            setTimeout(()=>{
                try {
                    o.stop();
                } catch  {}
            }, 500);
            this.sirenOsc = null;
        }
    }
    /* ---- wind ambience ---- */ windStart() {
        if (!this.ctx || !this.master || !this.noiseBuf || this.windGain) return;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        src.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 280;
        f.Q.value = 0.4;
        const g = this.ctx.createGain();
        g.gain.value = 0.018;
        src.connect(f).connect(g).connect(this.master);
        src.start();
        this.windGain = g;
        this.windFilter = f;
    }
    windUpdate(speed, night) {
        if (!this.windGain || !this.windFilter || !this.ctx) return;
        const t = this.ctx.currentTime;
        this.windGain.gain.setTargetAtTime(0.012 + Math.min(0.05, speed * 0.0025) + (night ? -0.004 : 0), t, 0.4);
        this.windFilter.frequency.setTargetAtTime(240 + speed * 8, t, 0.4);
    }
    /** lonely western plucks, occasionally */ ambientStart() {
        this.ambientOn = true;
        this.scheduleAmbient();
    }
    scheduleAmbient() {
        if (!this.ambientOn) return;
        this.ambientTimer = setTimeout(()=>{
            const scale = [
                220,
                261.6,
                293.7,
                329.6,
                392,
                440
            ];
            let t = 0;
            const n = 2 + Math.floor(Math.random() * 3);
            for(let i = 0; i < n; i++){
                const f = scale[Math.floor(Math.random() * scale.length)];
                this.pluck(f, t);
                t += 0.35 + Math.random() * 0.5;
            }
            this.scheduleAmbient();
        }, 7000 + Math.random() * 9000);
    }
    ambientStop() {
        this.ambientOn = false;
        if (this.ambientTimer) {
            clearTimeout(this.ambientTimer);
            this.ambientTimer = null;
        }
    }
    pluck(freq, delay) {
        if (!this.ctx || !this.master) return;
        const t = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = freq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        o.connect(g).connect(this.master);
        o.start(t);
        o.stop(t + 1.2);
    }
    dispose() {
        this.ambientStop();
        this.sirenOff();
        this.engineStop();
        if (this.ctx) this.ctx.close().catch(()=>{});
        this.ctx = null;
    }
}
}),
"[project]/src/game/input.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Unified input: keyboard + mouse (pointer lock or drag-look) + touch controls.
 * Touch UI widgets are rendered by hud.ts and call into this class.
 */ __turbopack_context__.s([
    "Input",
    ()=>Input
]);
class Input {
    keys = {};
    move = {
        x: 0,
        y: 0
    } // -1..1 (y forward)
    ;
    look = {
        x: 0,
        y: 0
    } // consumed each frame (radians delta applied by camera)
    ;
    fireHeld = false;
    aimHeld = false;
    isTouch = false;
    pointerLocked = false;
    enabled = false // game playing
    ;
    // one-shot actions (cleared by consume)
    queue = [];
    el;
    onEsc;
    dragLook = false;
    lookTouchId = null;
    stickTouchId = null;
    stickCenter = {
        x: 0,
        y: 0
    };
    constructor(el, onEsc){
        this.el = el;
        this.onEsc = onEsc;
        this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
        window.addEventListener('keydown', this.kd);
        window.addEventListener('keyup', this.ku);
        window.addEventListener('blur', this.blur);
        document.addEventListener('pointerlockchange', this.plc);
        document.addEventListener('mousemove', this.mm);
        el.addEventListener('mousedown', this.md);
        window.addEventListener('mouseup', this.mu);
        el.addEventListener('contextmenu', this.cm);
        window.addEventListener('touchstart', this.ts, {
            passive: false
        });
        window.addEventListener('touchmove', this.tm, {
            passive: false
        });
        window.addEventListener('touchend', this.te);
        window.addEventListener('touchcancel', this.te);
    }
    requestLock() {
        if (this.isTouch) return;
        try {
            const p = this.el.requestPointerLock();
            if (p && typeof p.catch === 'function') p.catch(()=>{
                this.dragLook = true;
            });
        } catch  {
            this.dragLook = true;
        }
        // if lock doesn't engage within 300ms, fall back to drag-look
        setTimeout(()=>{
            if (!this.pointerLocked) this.dragLook = true;
        }, 350);
    }
    releaseLock() {
        try {
            document.exitPointerLock();
        } catch  {}
    }
    plc = ()=>{
        this.pointerLocked = document.pointerLockElement === this.el;
        if (!this.pointerLocked && this.enabled && !this.isTouch) {
            // unlocking mid-game (Esc) → pause
            this.onEsc();
        }
    };
    kd = (e)=>{
        if (!this.enabled) return;
        const k = e.code;
        if (k === 'Escape') {
            this.onEsc();
            return;
        }
        if (this.keys[k]) return;
        this.keys[k] = true;
        if (k === 'KeyF' || k === 'KeyE') this.queue.push('enter');
        if (k === 'KeyR') this.queue.push('reload');
        if (k === 'Digit1') this.queue.push('w1');
        if (k === 'Digit2') this.queue.push('w2');
        if (k === 'Digit3') this.queue.push('w3');
        if (k === 'KeyQ') this.queue.push('wcycle');
        if (k === 'KeyH') this.queue.push('horn');
        if (k === 'Space') {
            this.queue.push('jump');
            e.preventDefault();
        }
    };
    ku = (e)=>{
        this.keys[e.code] = false;
    };
    blur = ()=>{
        this.keys = {};
        this.fireHeld = false;
        this.aimHeld = false;
    };
    cm = (e)=>{
        e.preventDefault();
    };
    md = (e)=>{
        if (!this.enabled || this.isTouch) return;
        if (e.button === 0) this.fireHeld = true;
        if (e.button === 2) this.aimHeld = true;
    };
    mu = (e)=>{
        if (e.button === 0) this.fireHeld = false;
        if (e.button === 2) this.aimHeld = false;
    };
    mm = (e)=>{
        if (!this.enabled || this.isTouch) return;
        if (this.pointerLocked) {
            this.look.x += e.movementX * 0.0023;
            this.look.y += e.movementY * 0.0023;
        } else if (this.dragLook && e.buttons & 3) {
            this.look.x += e.movementX * 0.0032;
            this.look.y += e.movementY * 0.0032;
        }
    };
    /* ---------- touch ---------- */ ts = (e)=>{
        if (!this.enabled || !this.isTouch) return;
        for (const t of Array.from(e.changedTouches)){
            const target = t.target;
            if (target && target.dataset && target.dataset.btn) continue; // handled by button listeners
            if (t.clientX < window.innerWidth * 0.42 && this.stickTouchId === null) {
                this.stickTouchId = t.identifier;
                this.stickCenter = {
                    x: t.clientX,
                    y: t.clientY
                };
                window.dispatchEvent(new CustomEvent('stick-show', {
                    detail: {
                        x: t.clientX,
                        y: t.clientY
                    }
                }));
            } else if (this.lookTouchId === null) {
                this.lookTouchId = t.identifier;
            }
        }
    };
    tm = (e)=>{
        if (!this.enabled || !this.isTouch) return;
        for (const t of Array.from(e.changedTouches)){
            if (t.identifier === this.stickTouchId) {
                const dx = (t.clientX - this.stickCenter.x) / 52;
                const dy = (t.clientY - this.stickCenter.y) / 52;
                const len = Math.hypot(dx, dy);
                const s = len > 1 ? 1 / len : 1;
                this.move.x = dx * s;
                this.move.y = -dy * s;
                window.dispatchEvent(new CustomEvent('stick-move', {
                    detail: {
                        x: dx * s,
                        y: dy * s
                    }
                }));
                e.preventDefault();
            } else if (t.identifier === this.lookTouchId) {
                this.look.x += (t.clientX - (this.lastLookX ?? t.clientX)) * 0.0045;
                this.look.y += (t.clientY - (this.lastLookY ?? t.clientY)) * 0.0045;
                this.lastLookX = t.clientX;
                this.lastLookY = t.clientY;
                e.preventDefault();
            }
        }
    };
    lastLookX = null;
    lastLookY = null;
    te = (e)=>{
        for (const t of Array.from(e.changedTouches)){
            if (t.identifier === this.stickTouchId) {
                this.stickTouchId = null;
                this.move.x = 0;
                this.move.y = 0;
                window.dispatchEvent(new CustomEvent('stick-hide'));
            } else if (t.identifier === this.lookTouchId) {
                this.lookTouchId = null;
                this.lastLookX = null;
                this.lastLookY = null;
            }
        }
    };
    /** called by touch buttons */ btnDown(name) {
        if (!this.enabled) return;
        if (name === 'fire') this.fireHeld = true;
        if (name === 'aim') this.aimHeld = !this.aimHeld;
        if (name === 'jump') this.queue.push('jump');
        if (name === 'sprint') this.queue.push('sprint-toggle');
        if (name === 'horn') this.queue.push('horn');
        if (name === 'pause') this.onEsc();
    }
    btnUp(name) {
        if (name === 'fire') this.fireHeld = false;
    }
    btnTap(name) {
        if (!this.enabled) return;
        if (name === 'enter') this.queue.push('enter');
        if (name === 'reload') this.queue.push('reload');
        if (name === 'wcycle') this.queue.push('wcycle');
    }
    /** read keyboard into move vector (desktop) */ pollKeyboard() {
        if (this.isTouch || this.stickTouchId !== null) return;
        let x = 0, y = 0;
        if (this.keys.KeyW || this.keys.ArrowUp) y += 1;
        if (this.keys.KeyS || this.keys.ArrowDown) y -= 1;
        if (this.keys.KeyA || this.keys.ArrowLeft) x -= 1;
        if (this.keys.KeyD || this.keys.ArrowRight) x += 1;
        const len = Math.hypot(x, y);
        this.move.x = len > 1 ? x / len : x;
        this.move.y = len > 1 ? y / len : y;
    }
    consume(action) {
        const i = this.queue.indexOf(action);
        if (i >= 0) {
            this.queue.splice(i, 1);
            return true;
        }
        return false;
    }
    clearQueue() {
        this.queue.length = 0;
    }
    consumeLook() {
        const r = {
            x: this.look.x,
            y: this.look.y
        };
        this.look.x = 0;
        this.look.y = 0;
        return r;
    }
    sprintHeld() {
        return !!(this.keys.ShiftLeft || this.keys.ShiftRight);
    }
    jumpHeld() {
        return !!this.keys.Space;
    }
    dispose() {
        window.removeEventListener('keydown', this.kd);
        window.removeEventListener('keyup', this.ku);
        window.removeEventListener('blur', this.blur);
        document.removeEventListener('pointerlockchange', this.plc);
        document.removeEventListener('mousemove', this.mm);
        this.el.removeEventListener('mousedown', this.md);
        window.removeEventListener('mouseup', this.mu);
        this.el.removeEventListener('contextmenu', this.cm);
        window.removeEventListener('touchstart', this.ts);
        window.removeEventListener('touchmove', this.tm);
        window.removeEventListener('touchend', this.te);
        window.removeEventListener('touchcancel', this.te);
    }
}
}),
"[project]/src/game/particles.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Particles",
    ()=>Particles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
class Particles {
    scene;
    sysAdd;
    sysAlpha;
    constructor(scene){
        this.scene = scene;
        this.sysAdd = new ParticleSystem(scene, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"], 220);
        this.sysAlpha = new ParticleSystem(scene, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texSmoke"])(), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NormalBlending"], 220);
    }
    spawn(pos, opts = {}) {
        const sys = opts.additive ? this.sysAdd : this.sysAlpha;
        sys.spawn(pos, opts);
    }
    burst(pos, n, opts = {}) {
        const spread = opts.spread ?? 0.4;
        const speed = opts.speed ?? 4;
        for(let i = 0; i < n; i++){
            const v = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-spread, spread), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.2, 1) * (opts.up ?? 1), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-spread, spread)).normalize().multiplyScalar((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(speed * 0.4, speed));
            this.spawn(pos, {
                ...opts,
                vel: v
            });
        }
    }
    update(dt) {
        this.sysAdd.update(dt);
        this.sysAlpha.update(dt);
    }
    dispose() {
        this.sysAdd.dispose();
        this.sysAlpha.dispose();
        this.scene.remove(this.sysAdd.points, this.sysAlpha.points);
    }
}
class ParticleSystem {
    capacity;
    points;
    pool;
    active;
    posAttr;
    sizeAttr;
    alphaAttr;
    colAttr;
    mat;
    constructor(scene, map, blending, capacity){
        this.capacity = capacity;
        this.pool = [];
        this.active = 0;
        const geo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferGeometry"]();
        this.posAttr = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](new Float32Array(capacity * 3), 3);
        this.sizeAttr = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](new Float32Array(capacity), 1);
        this.alphaAttr = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](new Float32Array(capacity), 1);
        this.colAttr = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](new Float32Array(capacity * 3), 3);
        geo.setAttribute('position', this.posAttr);
        geo.setAttribute('aSize', this.sizeAttr);
        geo.setAttribute('aAlpha', this.alphaAttr);
        geo.setAttribute('aColor', this.colAttr);
        geo.setDrawRange(0, 0);
        this.mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
            uniforms: {
                map: {
                    value: map
                }
            },
            vertexShader: `
        attribute float aSize;
        attribute float aAlpha;
        attribute vec3 aColor;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vAlpha = aAlpha;
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (240.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }`,
            fragmentShader: `
        uniform sampler2D map;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(vColor, vAlpha) * tex;
        }`,
            transparent: true,
            depthWrite: false,
            blending
        });
        this.points = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Points"](geo, this.mat);
        this.points.frustumCulled = false;
        scene.add(this.points);
    }
    spawn(pos, opts = {}) {
        if (this.active >= this.capacity) return;
        const c = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](opts.color ?? 0xffffff);
        this.pool[this.active] = {
            pos: pos.clone(),
            vel: (opts.vel ?? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]()).clone(),
            life: 0,
            maxLife: opts.life ?? 1,
            size: opts.size ?? 1,
            sizeEnd: opts.sizeEnd ?? (opts.size ?? 1) * 1.6,
            r: c.r,
            g: c.g,
            b: c.b,
            gravity: opts.gravity ?? 0,
            drag: opts.drag ?? 0.6
        };
        this.active++;
    }
    update(dt) {
        const geo = this.points.geometry;
        for(let i = 0; i < this.active; i++){
            const p = this.pool[i];
            p.life += dt;
            if (p.life >= p.maxLife) {
                // swap with last
                this.active--;
                if (i < this.active) {
                    this.pool[i] = this.pool[this.active];
                    i--;
                }
                continue;
            }
            p.vel.y -= p.gravity * dt;
            p.vel.multiplyScalar(1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(p.drag * dt, 0, 0.95));
            p.pos.addScaledVector(p.vel, dt);
            const t = p.life / p.maxLife;
            this.posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
            this.sizeAttr.setX(i, p.size + (p.sizeEnd - p.size) * t);
            this.alphaAttr.setX(i, 1 - t);
            this.colAttr.setXYZ(i, p.r, p.g, p.b);
        }
        geo.setDrawRange(0, this.active);
        this.posAttr.needsUpdate = true;
        this.sizeAttr.needsUpdate = true;
        this.alphaAttr.needsUpdate = true;
        this.colAttr.needsUpdate = true;
    }
    dispose() {
        this.points.geometry.dispose();
        this.mat.dispose();
    }
}
}),
"[project]/src/game/entities.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "animateHorse",
    ()=>animateHorse,
    "animateHuman",
    ()=>animateHuman,
    "makeBeacon",
    ()=>makeBeacon,
    "makeCar",
    ()=>makeCar,
    "makeHorse",
    ()=>makeHorse,
    "makeHuman",
    ()=>makeHuman,
    "makePickupMesh",
    ()=>makePickupMesh
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
const SKIN = [
    '#c89468',
    '#a8764e',
    '#8a5c3a',
    '#d8a878',
    '#6b4526'
];
function limb(w, h, d, color, pivotY) {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](w, h, d), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color
    }));
    m.position.y = -h / 2;
    m.castShadow = false;
    g.add(m);
    g.position.y = pivotY;
    return g;
}
function makeHuman(opts = {}) {
    const shirt = opts.shirt ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
        '#7a3a2a',
        '#3a5a4a',
        '#5a4a6b',
        '#8a6a2a',
        '#4a4a52',
        '#6b2a2a'
    ]);
    const pants = opts.pants ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
        '#3a3630',
        '#2c2c30',
        '#4a3a28',
        '#26221e'
    ]);
    const skin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(SKIN);
    const group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    const body = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    group.add(body);
    const torso = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.52, 0.62, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: shirt
    }));
    torso.position.y = 1.24;
    body.add(torso);
    const hips = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.46, 0.22, 0.28), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: pants
    }));
    hips.position.y = 0.88;
    body.add(hips);
    const head = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.32, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: skin
    }));
    head.position.y = 1.73;
    body.add(head);
    if (opts.bandana) {
        const b = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.32, 0.12, 0.32), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#a03028'
        }));
        b.position.y = 1.66;
        body.add(b);
    }
    const lLeg = limb(0.2, 0.82, 0.24, pants, 0.86);
    lLeg.children[0].position.y = -0.41;
    lLeg.position.y = 0.82;
    const rLeg = limb(0.2, 0.82, 0.24, pants, 0.86);
    rLeg.children[0].position.y = -0.41;
    rLeg.position.y = 0.82;
    lLeg.position.x = -0.14;
    rLeg.position.x = 0.14;
    body.add(lLeg, rLeg);
    const lArm = limb(0.15, 0.58, 0.18, shirt, 1.48);
    const rArm = limb(0.15, 0.58, 0.18, shirt, 1.48);
    lArm.position.x = -0.34;
    rArm.position.x = 0.34;
    body.add(lArm, rArm);
    // hat
    if (opts.hat === 'cowboy' || !opts.hat) {
        const brim = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.3, 0.32, 0.05, 10), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#5a4028'
        }));
        brim.position.y = 1.92;
        const crown = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.15, 0.17, 0.18, 8), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#5a4028'
        }));
        crown.position.y = 2.02;
        body.add(brim, crown);
    } else if (opts.hat === 'cap') {
        const cap = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.32, 0.1, 0.32), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#223a5a'
        }));
        cap.position.y = 1.94;
        const peak = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.28, 0.04, 0.16), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#1a2c44'
        }));
        peak.position.set(0, 1.9, 0.22);
        body.add(cap, peak);
    }
    // gun in right hand
    const gun = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.07, 0.16, 0.34), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: '#22242a'
    }));
    gun.position.set(0, -0.62, 0.14);
    gun.visible = false;
    rArm.add(gun);
    if (opts.scale) group.scale.setScalar(opts.scale);
    return {
        group,
        lLeg,
        rLeg,
        lArm,
        rArm,
        head,
        gun,
        body
    };
}
function animateHuman(h, phase, speed, aiming, pitch = 0) {
    const amp = Math.min(1, speed / 6) * 0.75;
    const s = Math.sin(phase);
    h.lLeg.rotation.x = s * amp;
    h.rLeg.rotation.x = -s * amp;
    if (aiming) {
        h.rArm.rotation.x = -Math.PI / 2 + pitch;
        h.rArm.rotation.z = 0;
        h.lArm.rotation.x = -Math.PI / 2 + pitch + 0.12;
        h.lArm.rotation.z = -0.5;
        if (h.gun) h.gun.visible = true;
    } else {
        h.rArm.rotation.x = -s * amp * 0.8;
        h.lArm.rotation.x = s * amp * 0.8;
        h.rArm.rotation.z = 0;
        h.lArm.rotation.z = 0;
        if (h.gun) h.gun.visible = speed > 0.1;
    }
}
const CAR_COLORS = [
    '#8a2a2a',
    '#2a4a6b',
    '#6b6b70',
    '#2a2c30',
    '#7a6a2a',
    '#3a5a3a',
    '#7a4a2a',
    '#9a9a9a',
    '#5a3a6b'
];
function makeCar(type = 'sedan', color) {
    const group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    const c = color ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(CAR_COLORS);
    const bodyMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshPhongMaterial"]({
        color: c,
        shininess: 90,
        specular: 0x555555
    });
    const glassMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshPhongMaterial"]({
        color: 0x18222c,
        shininess: 120,
        specular: 0x88aacc
    });
    const darkMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: 0x1a1b1e
    });
    const lightMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        color: 0xfff2c0
    });
    const tailMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        color: 0xaa2018
    });
    let lightbar;
    const dims = type === 'truck' ? {
        w: 2.2,
        l: 5.2,
        cab: 1.9
    } : type === 'sports' ? {
        w: 1.9,
        l: 4.2,
        cab: 1.6
    } : type === 'van' ? {
        w: 2.0,
        l: 4.8,
        cab: 2.6
    } : {
        w: 1.9,
        l: 4.4,
        cab: 1.8
    };
    const bodyH = type === 'sports' ? 0.45 : type === 'truck' ? 0.7 : 0.55;
    const body = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](dims.w, bodyH, dims.l), bodyMat);
    body.position.y = 0.42 + bodyH / 2;
    group.add(body);
    // cabin
    const cabL = type === 'truck' ? dims.cab : dims.cab;
    const cab = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](dims.w * 0.88, 0.52, cabL), glassMat);
    cab.position.set(0, 0.42 + bodyH + 0.24, type === 'truck' ? 0.7 : type === 'van' ? 0.4 : -0.15);
    group.add(cab);
    if (type === 'truck') {
        const cargo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](dims.w, 1.5, 2.6), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x9a9a94
        }));
        cargo.position.set(0, 1.45, -1.15);
        group.add(cargo);
    }
    if (type === 'taxi') {
        bodyMat.color.set('#d8b02a');
        const sign = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.7, 0.22, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texSign"])('تاکسی', 128, 40, '#202020', '#ffd84a', 'bold 28px Tahoma')
        }));
        sign.position.set(0, 0.42 + bodyH + 0.62, cab.position.z);
        group.add(sign);
    }
    if (type === 'police') {
        bodyMat.color.set('#e8e8e8');
        // black doors band
        const band = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](dims.w + 0.02, 0.26, 2.2), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: 0x181c24
        }));
        band.position.set(0, 0.42 + bodyH * 0.55, 0);
        group.add(band);
        const red = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.5, 0.16, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: 0xff2222
        }));
        red.position.set(-0.3, 0.42 + bodyH + 0.62, cab.position.z);
        const blue = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.5, 0.16, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: 0x2255ff
        }));
        blue.position.set(0.3, 0.42 + bodyH + 0.62, cab.position.z);
        group.add(red, blue);
        lightbar = {
            red,
            blue
        };
        const side = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](1.8, 0.4), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texSign"])('پلیس لاس سومبرا', 256, 48, '#181c24', '#e8e8f0', 'bold 30px Tahoma'),
            side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DoubleSide"]
        }));
        side.rotation.y = Math.PI / 2;
        side.position.set(0, 0.42 + bodyH * 0.5, 0.3);
        group.add(side);
    }
    // wheels
    const wheelGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](0.34, 0.34, 0.24, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheels = [];
    const frontWheels = [];
    const wx = dims.w / 2 - 0.05;
    const wz = dims.l / 2 - 0.85;
    for (const [x, z, front] of [
        [
            -wx,
            wz,
            true
        ],
        [
            wx,
            wz,
            true
        ],
        [
            -wx,
            -wz,
            false
        ],
        [
            wx,
            -wz,
            false
        ]
    ]){
        const w = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](wheelGeo, darkMat);
        w.position.set(x, 0.34, z);
        group.add(w);
        wheels.push(w);
        if (front) frontWheels.push(w);
    }
    // lights
    const headlights = [];
    const taillights = [];
    for (const s of [
        -1,
        1
    ]){
        const hl = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.16, 0.06), lightMat);
        hl.position.set(s * (dims.w / 2 - 0.35), 0.42 + bodyH * 0.6, dims.l / 2 + 0.01);
        group.add(hl);
        headlights.push(hl);
        const tl = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.14, 0.06), tailMat);
        tl.position.set(s * (dims.w / 2 - 0.35), 0.42 + bodyH * 0.6, -dims.l / 2 - 0.01);
        group.add(tl);
        taillights.push(tl);
    }
    // headlight beam quad
    const beam = makeBeamMesh();
    group.add(beam);
    return {
        group,
        wheels,
        frontWheels,
        headlights,
        taillights,
        beam,
        lightbar,
        driverSeat: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0.42, 0.95, 0.15)
    };
}
let beamTexCache = null;
function beamTexture() {
    if (beamTexCache) return beamTexCache;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, 'rgba(255,240,190,0.5)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(24, 0);
    x.lineTo(40, 0);
    x.lineTo(64, 128);
    x.lineTo(0, 128);
    x.closePath();
    x.fill();
    const t = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasTexture"](c);
    beamTexCache = t;
    return t;
}
function makeBeamMesh() {
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PlaneGeometry"](5.4, 9), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        map: beamTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"]
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 0.12, 4.5 + 4.5);
    return m;
}
function makeHorse(color) {
    const c = color ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
        '#6b4526',
        '#3a2c1c',
        '#8a6a4a',
        '#d8d0c0',
        '#4a3a2a'
    ]);
    const group = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    const mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: c
    });
    const dark = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
        color: '#221a10'
    });
    const body = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.72, 0.78, 1.85), mat);
    body.position.y = 1.28;
    group.add(body);
    const rump = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.68, 0.6, 0.5), mat);
    rump.position.set(0, 1.32, -0.95);
    group.add(rump);
    const neck = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.34, 0.85, 0.4), mat);
    neck.position.set(0, 1.75, 0.78);
    neck.rotation.x = 0.5;
    group.add(neck);
    const head = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    const skull = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.36, 0.62), mat);
    skull.position.set(0, 0.1, 0.1);
    head.add(skull);
    const ear1 = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.07, 0.16, 0.05), dark);
    ear1.position.set(-0.09, 0.32, -0.08);
    const ear2 = ear1.clone();
    ear2.position.x = 0.09;
    head.add(ear1, ear2);
    head.position.set(0, 2.12, 1.12);
    head.rotation.x = 0.35;
    group.add(head);
    // mane
    const mane = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.12, 0.7, 0.16), dark);
    mane.position.set(0, 1.95, 0.62);
    mane.rotation.x = 0.45;
    group.add(mane);
    const tail = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.16, 0.85, 0.2), dark);
    tail.position.set(0, 1.15, -1.18);
    tail.rotation.x = 0.35;
    group.add(tail);
    const legs = [];
    const legGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.16, 1.0, 0.18);
    for (const [x, z] of [
        [
            -0.26,
            0.68
        ],
        [
            0.26,
            0.68
        ],
        [
            -0.26,
            -0.72
        ],
        [
            0.26,
            -0.72
        ]
    ]){
        const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](legGeo, mat);
        m.position.y = -0.5;
        const hoof = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.18, 0.12, 0.22), dark);
        hoof.position.y = -1.0;
        g.add(m, hoof);
        g.position.set(x, 1.05, z);
        group.add(g);
        legs.push(g);
    }
    return {
        group,
        legs,
        head,
        tail,
        seat: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.68, -0.15)
    };
}
function animateHorse(h, phase, speed) {
    const amp = Math.min(1, speed / 14) * 0.9;
    const s = Math.sin(phase), s2 = Math.sin(phase + Math.PI);
    const s3 = Math.sin(phase + Math.PI * 0.5), s4 = Math.sin(phase + Math.PI * 1.5);
    h.legs[0].rotation.x = s * amp;
    h.legs[1].rotation.x = s3 * amp * 0.8;
    h.legs[2].rotation.x = s2 * amp;
    h.legs[3].rotation.x = s4 * amp * 0.8;
    h.group.position.y = Math.abs(Math.sin(phase)) * amp * 0.14;
    h.head.rotation.x = 0.35 + Math.sin(phase) * 0.06;
    h.tail.rotation.x = 0.35 + Math.sin(phase * 0.5) * 0.2;
}
function makePickupMesh(kind) {
    const g = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Group"]();
    if (kind === 'cash') {
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.5, 0.3, 0.3), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#3f7a44'
        }));
        const b = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.52, 0.1, 0.32), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#d8c88a'
        }));
        b.position.y = 0.02;
        g.add(m, b);
    } else if (kind === 'ammo') {
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.5, 0.35, 0.4), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#6b5a2a'
        }));
        g.add(m);
        const lid = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.54, 0.08, 0.44), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#4a3e1c'
        }));
        lid.position.y = 0.2;
        g.add(lid);
    } else {
        const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.45, 0.45, 0.45), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshLambertMaterial"]({
            color: '#e8e8e8'
        }));
        const c1 = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.3, 0.09, 0.09), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: '#c02828'
        }));
        c1.position.z = 0.23;
        const c2 = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.09, 0.3, 0.09), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
            color: '#c02828'
        }));
        c2.position.z = 0.23;
        g.add(m, c1, c2);
    }
    return g;
}
function makeBeacon(color, radius = 1.4, height = 50) {
    const geo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CylinderGeometry"](radius, radius, height, 12, 1, true);
    const mat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
        color,
        transparent: true,
        opacity: 0.28,
        side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DoubleSide"],
        blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"],
        depthWrite: false
    });
    const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](geo, mat);
    m.position.y = height / 2;
    return m;
}
}),
"[project]/src/game/vehicles.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Vehicles",
    ()=>Vehicles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/entities.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$world$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/world.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
let VID = 1;
class Vehicles {
    scene;
    world;
    sfx;
    particles;
    input;
    quality;
    list;
    playerVehicle;
    hooks;
    night;
    constructor(scene, world, sfx, particles, input, quality){
        this.scene = scene;
        this.world = world;
        this.sfx = sfx;
        this.particles = particles;
        this.input = input;
        this.quality = quality;
        this.list = [];
        this.playerVehicle = null;
        this.night = 0;
        this.playerPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.hooks = {
            onJack: ()=>{},
            onPedHit: ()=>{},
            onExplosion: ()=>{},
            deployCops: ()=>{},
            crash: ()=>{}
        };
    }
    spawnAll() {
        // parked cars
        for (const s of this.world.parkedSpots){
            const type = s.police ? 'police' : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                'sedan',
                'sedan',
                'sports',
                'taxi',
                'truck',
                'van'
            ]);
            this.addCar(type, s.x, s.z, s.h, !!s.police);
        }
        // traffic
        const n = this.quality === 'low' ? 8 : this.quality === 'med' ? 12 : 16;
        for(let i = 0; i < n; i++)this.spawnTraffic();
        // horses
        for (const h of this.world.horseSpots){
            const tame = h.z > 460 || Math.hypot(h.x - 16, h.z - 512) < 40;
            this.addHorse(h.x, h.z, tame);
        }
    }
    addCar(type, x, z, h, police = false, traffic = false) {
        const parts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeCar"])(type);
        const group = parts.group;
        group.position.set(x, 0, z);
        group.rotation.y = h;
        this.scene.add(group);
        const v = {
            id: VID++,
            kind: 'car',
            type,
            parts,
            group,
            pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0, z),
            heading: h,
            speed: 0,
            steerV: 0,
            health: 100,
            maxSpeed: type === 'sports' ? 34 : type === 'truck' ? 20 : type === 'police' ? 30 : 26,
            accel: type === 'sports' ? 14 : type === 'truck' ? 7 : 10,
            turnRate: type === 'sports' ? 2.1 : 1.7,
            isPolice: police,
            occupied: false,
            ai: traffic ? this.pickEdge() : null,
            chase: false,
            lightsOn: false,
            smokeT: 0,
            dead: false,
            deadT: 0,
            stamina: 0,
            gallop: false,
            phase: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6),
            radius: 1.7,
            color: '#888',
            wanderT: 0,
            wanderTarget: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](),
            deployT: 0
        };
        this.list.push(v);
        return v;
    }
    addHorse(x, z, tame = false) {
        const parts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeHorse"])();
        parts.group.position.set(x, 0, z);
        this.scene.add(parts.group);
        const v = {
            id: VID++,
            kind: 'horse',
            type: 'horse',
            parts,
            group: parts.group,
            pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0, z),
            heading: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6),
            speed: 0,
            steerV: 0,
            health: 100,
            maxSpeed: 19,
            accel: 9,
            turnRate: 2.4,
            isPolice: false,
            occupied: false,
            ai: null,
            chase: false,
            lightsOn: false,
            smokeT: 0,
            dead: false,
            deadT: 0,
            stamina: 100,
            gallop: false,
            phase: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6),
            radius: 0.9,
            color: '#6b4526',
            wanderT: 0,
            wanderTarget: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0, z),
            deployT: 0,
            tame
        };
        this.list.push(v);
        return v;
    }
    pickEdge() {
        const { nodes, adj } = this.world.graph;
        const from = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(0, nodes.length - 1);
        if (adj[from].length === 0) return {
            from,
            to: from
        };
        const to = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(adj[from]);
        return {
            from,
            to
        };
    }
    spawnTraffic() {
        const { nodes } = this.world.graph;
        for(let t = 0; t < 10; t++){
            const e = this.pickEdge();
            const a = nodes[e.from];
            if (!a) continue;
            const type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                'sedan',
                'sedan',
                'taxi',
                'van',
                'truck',
                'sports'
            ]);
            const dir = this.edgeDir(e.from, e.to);
            const tAlong = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.15, 0.85);
            const px = a.x + (nodes[e.to].x - a.x) * tAlong;
            const pz = a.z + (nodes[e.to].z - a.z) * tAlong;
            const h = Math.atan2(dir.x, dir.z);
            this.addCar(type, px, pz, h, false, true);
            return;
        }
    }
    edgeDir(from, to) {
        const { nodes } = this.world.graph;
        const a = nodes[from], b = nodes[to];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 1;
        return {
            x: dx / len,
            z: dz / len
        };
    }
    /* ================= enter/exit helpers ================= */ nearest(pos, maxDist = 4.5, kind) {
        let best = null;
        let bd = maxDist * maxDist;
        for (const v of this.list){
            if (v.occupied || v.dead || v.deadT > 0) continue;
            if (kind && v.kind !== kind) continue;
            const d = v.pos.distanceToSquared(pos);
            if (d < bd) {
                bd = d;
                best = v;
            }
        }
        return best;
    }
    enter(v) {
        v.occupied = true;
        this.playerVehicle = v;
        if (v.ai) {
            v.ai = null;
            this.hooks.onJack();
        }
        if (v.isPolice && !v.wasJacked) {
            v.wasJacked = true;
        }
        if (v.kind === 'car') this.sfx.engineStart();
    }
    exit() {
        const v = this.playerVehicle;
        if (!v) return null;
        v.occupied = false;
        this.playerVehicle = null;
        this.sfx.engineStop();
        // place player beside
        const side = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(v.kind === 'horse' ? 1.2 : 2.2);
        return {
            pos: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]().copy(v.pos).add(side),
            v
        };
    }
    placeForExit(v) {
        const side = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](Math.cos(v.heading), 0, -Math.sin(v.heading)).multiplyScalar(v.kind === 'horse' ? 1.2 : 2.2);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]().copy(v.pos).add(side);
    }
    copsNear(pos, radius) {
        let n = 0;
        for (const v of this.list){
            if (v.isPolice && !v.dead && v.pos.distanceToSquared(pos) < radius * radius) n++;
        }
        return n;
    }
    spawnPolice(playerPos) {
        const { nodes, adj } = this.world.graph;
        // find node 90-160 from player
        const cands = nodes.filter((n)=>{
            const d = Math.hypot(n.x - playerPos.x, n.z - playerPos.z);
            return d > 80 && d < 170;
        });
        if (cands.length === 0) return null;
        const n = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(cands);
        const ni = nodes.indexOf(n);
        const to = adj[ni][0] ?? ni;
        const dir = this.edgeDir(ni, to);
        const v = this.addCar('police', n.x, n.z, Math.atan2(dir.x, dir.z), true, false);
        v.chase = true;
        v.ai = {
            from: ni,
            to
        };
        return v;
    }
    clearPolice() {
        for (const v of this.list){
            if (v.isPolice && !v.occupied) {
                v.chase = false;
            }
        }
    }
    damage(v, amount, byPlayer) {
        if (v.dead) return;
        v.health -= amount;
        if (v.health <= 0) this.explode(v, byPlayer);
    }
    explode(v, byPlayer) {
        if (v.dead) return;
        v.dead = true;
        v.speed = 0;
        v.chase = false;
        v.ai = null;
        v.deadT = 0;
        this.sfx.explosion();
        this.particles.burst(v.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0)), 26, {
            additive: true,
            color: 0xff8830,
            life: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.5, 0.9),
            size: 3,
            sizeEnd: 7,
            speed: 9,
            up: 1.4,
            drag: 1.2,
            gravity: 2
        });
        this.particles.burst(v.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.5, 0)), 18, {
            color: 0x333330,
            life: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1.2, 2.2),
            size: 3.5,
            sizeEnd: 9,
            speed: 5,
            up: 1,
            drag: 0.8
        });
        // darken
        v.group.traverse((o)=>{
            const mesh = o;
            if (mesh.isMesh && mesh.material && !Array.isArray(mesh.material)) {
                const mat = mesh.material;
                if (mat.color) mat.color.multiplyScalar(0.28);
            }
        });
        this.hooks.onExplosion(v.pos);
        void byPlayer;
    }
    /* ================= update ================= */ update(dt, playerPos, night, inVehicle) {
        this.night = night;
        this.playerPos = playerPos;
        for (const v of this.list){
            if (v.dead) {
                v.deadT += dt;
                if (v.deadT < 4) {
                    if (Math.random() < 0.3) {
                        this.particles.spawn(v.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.8, 0.8), 1, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.8, 0.8))), {
                            color: 0x222220,
                            life: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1, 2),
                            size: 2.5,
                            sizeEnd: 6,
                            vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.5, 0.5), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1.5, 2.5), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.5, 0.5))
                        });
                        this.particles.spawn(v.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.5, 0.5), 0.8, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.5, 0.5))), {
                            additive: true,
                            color: 0xff6a20,
                            life: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.3, 0.6),
                            size: 1.6,
                            sizeEnd: 3,
                            vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1, 2), 0)
                        });
                    }
                }
                // wreck fade after 25s
                if (v.deadT > 25 && !v.occupied) {
                    this.removeVehicle(v);
                }
                this.sync(v);
                continue;
            }
            if (v === this.playerVehicle && inVehicle) {
                if (v.kind === 'car') this.drivePlayerCar(v, dt);
                else this.drivePlayerHorse(v, dt);
            } else if (v.kind === 'car' && v.isPolice && v.chase) {
                this.policeChase(v, dt, playerPos);
            } else if (v.kind === 'car' && v.ai) {
                this.trafficCar(v, dt);
            } else if (v.kind === 'horse') {
                this.wildHorse(v, dt, playerPos);
            } else {
                // parked / abandoned: idle physics
                v.speed *= 1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(2 * dt, 0, 1);
                if (Math.abs(v.speed) > 0.05) this.integrate(v, dt);
            }
            // damage smoke
            if (v.kind === 'car' && v.health < 45 && Math.random() < 0.25) {
                const fwd = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](Math.sin(v.heading), 0, Math.cos(v.heading)).multiplyScalar(1.4);
                this.particles.spawn(v.pos.clone().add(fwd).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 0.9, 0)), {
                    color: 0x555550,
                    life: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.8, 1.5),
                    size: 1.2,
                    sizeEnd: 3.5,
                    vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.4, 0.4), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1, 2), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-0.4, 0.4))
                });
            }
            // ped run-over
            const abs = Math.abs(v.speed);
            if (abs > 6) {
                const fwd = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](Math.sin(v.heading), 0, Math.cos(v.heading)).multiplyScalar(1.6);
                const front = v.pos.clone().add(fwd);
                this.hooks.onPedHit(front, abs, v === this.playerVehicle);
                // dust
                if (v.kind === 'horse' && Math.random() < 0.5) {
                    this.particles.spawn(v.pos.clone().setY(0.2), {
                        color: 0xb09a70,
                        life: 0.7,
                        size: 1.2,
                        sizeEnd: 2.6,
                        vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-1, 1), 0.6, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-1, 1))
                    });
                }
            }
            this.sync(v);
        }
    }
    removeVehicle(v) {
        this.scene.remove(v.group);
        const i = this.list.indexOf(v);
        if (i >= 0) this.list.splice(i, 1);
        if (this.playerVehicle === v) this.playerVehicle = null;
    }
    sync(v) {
        v.group.position.set(v.pos.x, v.kind === 'horse' ? v.group.position.y : 0, v.pos.z);
        v.group.rotation.y = v.heading;
        if (v.kind === 'car') {
            const parts = v.parts;
            // wheels
            const spin = v.speed * 0.026;
            for (const w of parts.wheels)w.rotation.x += spin;
            const steerTarget = v.steerV * 0.45;
            for (const w of parts.frontWheels)w.rotation.y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(w.rotation.y, steerTarget, 0.2);
            // lights
            const on = (this.night > 0.25 || v.lightsOn) && !v.dead;
            for (const hl of parts.headlights)hl.material.color.setHex(on ? 0xfff2c0 : 0x555044);
            if (parts.beam) parts.beam.material.opacity = on ? 0.5 * this.night : 0;
            // police flash
            if (parts.lightbar && (v.chase || v.isPolice && v.lightsOn)) {
                const t = performance.now() * 0.008;
                const red = Math.sin(t) > 0;
                parts.lightbar.red.material.color.setHex(red ? 0xff2222 : 0x440808);
                parts.lightbar.blue.material.color.setHex(red ? 0x080844 : 0x2255ff);
            } else if (parts.lightbar) {
                ;
                parts.lightbar.red.material.color.setHex(0x550a0a);
                parts.lightbar.blue.material.color.setHex(0x0a0a55);
            }
        } else {
            const parts = v.parts;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["animateHorse"])(parts, v.phase, Math.abs(v.speed));
        }
    }
    /* ---------- player driving ---------- */ drivePlayerCar(v, dt) {
        const inp = this.input;
        const throttle = inp.move.y;
        const steerIn = inp.move.x;
        const handbrake = inp.keys.Space || false;
        if (throttle > 0.05) {
            v.speed += v.accel * throttle * dt * (v.speed < 0 ? 2.2 : 1);
        } else if (throttle < -0.05) {
            v.speed += v.accel * throttle * dt * (v.speed > 0 ? 2.2 : 0.6);
        } else {
            v.speed *= 1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(0.9 * dt, 0, 1);
        }
        if (handbrake) v.speed *= 1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(2.4 * dt, 0, 1);
        v.speed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(v.speed, -v.maxSpeed * 0.4, v.maxSpeed);
        v.speed *= 1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(0.12 * dt, 0, 1);
        v.steerV = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(v.steerV, steerIn, 1 - Math.exp(-8 * dt));
        const sf = Math.min(1, Math.abs(v.speed) / 7) * (1 - 0.42 * Math.min(1, Math.abs(v.speed) / v.maxSpeed));
        const hb = handbrake ? 1.55 : 1;
        v.heading += v.steerV * v.turnRate * sf * hb * dt * (v.speed < -0.5 ? -1 : 1);
        this.integrate(v, dt);
        this.sfx.engineUpdate(v.speed, throttle, true);
    }
    drivePlayerHorse(v, dt) {
        const inp = this.input;
        const throttle = inp.move.y;
        const steerIn = inp.move.x;
        v.gallop = inp.sprintHeld() || !!v.gallopToggle;
        const wantMax = v.gallop && v.stamina > 1 ? v.maxSpeed : 8.5;
        if (throttle > 0.05) {
            v.speed += v.accel * dt * throttle;
            v.speed = Math.min(v.speed, wantMax);
        } else if (throttle < -0.05) {
            v.speed -= v.accel * 0.8 * dt * -throttle;
            v.speed = Math.max(v.speed, -3);
        } else {
            v.speed *= 1 - (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(1.6 * dt, 0, 1);
        }
        if (v.gallop && Math.abs(v.speed) > 10) {
            v.stamina = Math.max(0, v.stamina - 7.5 * dt);
        } else {
            v.stamina = Math.min(100, v.stamina + 9 * dt);
        }
        const sf = 0.35 + Math.min(1, Math.abs(v.speed) / 6) * 0.65;
        v.heading -= steerIn * v.turnRate * sf * dt;
        v.phase += Math.abs(v.speed) * dt * 1.05;
        // hoof sound at step
        if (Math.abs(v.speed) > 2) {
            const c = Math.sin(v.phase * 2);
            if (c > 0.9 && v.lastHoof !== Math.floor(v.phase * 2 / Math.PI)) {
                v.lastHoof = Math.floor(v.phase * 2 / Math.PI);
                this.sfx.hoof();
            }
        }
        this.integrate(v, dt);
    }
    /* ---------- AI ---------- */ trafficCar(v, dt) {
        const { nodes } = this.world.graph;
        const ai = v.ai;
        if (!ai) return;
        const a = nodes[ai.from], b = nodes[ai.to];
        if (!a || !b) {
            v.ai = this.pickEdge();
            return;
        }
        const dir = this.edgeDir(ai.from, ai.to);
        const rx = dir.z, rz = -dir.x // right side
        ;
        const tx = b.x + rx * 3.6;
        const tz = b.z + rz * 3.6;
        const desired = Math.atan2(tx - v.pos.x, tz - v.pos.z);
        v.heading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(v.heading, desired, 1 - Math.exp(-2.6 * dt));
        v.steerV = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angleDiff"])(v.heading, desired) * -2, -1, 1);
        // obstacle check
        const fx = v.pos.x + Math.sin(v.heading) * 8;
        const fz = v.pos.z + Math.cos(v.heading) * 8;
        let blocked = false;
        const pd = Math.hypot(fx - this.playerPos.x, fz - this.playerPos.z);
        if (pd < 3.4) blocked = true;
        for (const o of this.list){
            if (o === v || o.dead) continue;
            if (Math.hypot(fx - o.pos.x, fz - o.pos.z) < 3.6) {
                blocked = true;
                break;
            }
        }
        const target = blocked ? 0 : 11;
        v.speed += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(target - v.speed, -14 * dt, 6 * dt);
        this.integrate(v, dt);
        // arrival → next edge
        const distB = Math.hypot(b.x - v.pos.x, b.z - v.pos.z);
        if (distB < 6) {
            const { adj } = this.world.graph;
            const opts = adj[ai.to].filter((n)=>n !== ai.from);
            const next = opts.length ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(opts) : ai.from;
            v.ai = {
                from: ai.to,
                to: next
            };
        }
    }
    playerPos;
    policeChase(v, dt, playerPos) {
        const dx = playerPos.x - v.pos.x;
        const dz = playerPos.z - v.pos.z;
        const dist = Math.hypot(dx, dz);
        const desired = Math.atan2(dx, dz);
        v.heading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(v.heading, desired, 1 - Math.exp(-2.2 * dt));
        v.steerV = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["angleDiff"])(v.heading, desired) * -2, -1, 1);
        const playerOnFoot = !this.playerVehicle || this.playerVehicle === v;
        const target = dist > 9 || !playerOnFoot ? 24 : 0;
        v.speed += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(target - v.speed, -20 * dt, 8 * dt);
        this.integrate(v, dt);
        // deploy cops when close & stopped
        if (dist < 14 && playerOnFoot) {
            v.deployT -= dt;
            if (v.deployT <= 0 && Math.abs(v.speed) < 3) {
                v.deployT = 7;
                this.hooks.deployCops(v.pos);
            }
        }
        // siren volume by distance
        this.sfx.sirenVol((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(1 - dist / 90, 0, 1));
    }
    wildHorse(v, dt, playerPos) {
        if (v.tame && !v.occupied) {
            // tame horses stay near their spot
            v.speed += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(0 - v.speed, -4 * dt, 2 * dt);
            v.wanderT -= dt;
            if (v.wanderT <= 0) {
                v.wanderT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(8, 16);
                v.wanderTarget.set(v.pos.x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-6, 6), 0, v.pos.z + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-6, 6));
            }
            const desired = Math.atan2(v.wanderTarget.x - v.pos.x, v.wanderTarget.z - v.pos.z);
            v.heading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(v.heading, desired, 1 - Math.exp(-0.6 * dt));
            v.phase += Math.abs(v.speed) * dt * 1.05;
            this.integrate(v, dt);
            return;
        }
        v.wanderT -= dt;
        const pd = Math.hypot(playerPos.x - v.pos.x, playerPos.z - v.pos.z);
        if (v.wanderT <= 0) {
            v.wanderT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(5, 11);
            v.wanderTarget.set(v.pos.x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-45, 45), 0, v.pos.z + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-45, 45));
        }
        const fleeing = pd < 14 && !v.occupied;
        const target = fleeing ? new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](v.pos.x + (v.pos.x - playerPos.x), 0, v.pos.z + (v.pos.z - playerPos.z)) : v.wanderTarget;
        const desired = Math.atan2(target.x - v.pos.x, target.z - v.pos.z);
        v.heading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(v.heading, desired, 1 - Math.exp(-1.8 * dt));
        const ts = fleeing ? 12 : 3.2;
        v.speed += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(ts - v.speed, -6 * dt, 3.5 * dt);
        v.phase += Math.abs(v.speed) * dt * 1.05;
        this.integrate(v, dt);
    }
    /* ---------- shared physics ---------- */ integrate(v, dt) {
        const fx = Math.sin(v.heading);
        const fz = Math.cos(v.heading);
        const nx = v.pos.x + fx * v.speed * dt;
        const nz = v.pos.z + fz * v.speed * dt;
        v.pos.x = nx;
        v.pos.z = nz;
        // colliders
        const before = {
            x: v.pos.x,
            z: v.pos.z
        };
        const hits = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveCollisions"])(v.pos, v.radius, this.world.colliders);
        if (hits > 0) {
            const impact = Math.abs(v.speed);
            v.pos.x = (v.pos.x + before.x) / 2;
            v.pos.z = (v.pos.z + before.z) / 2;
            if (impact > 7) {
                if (v === this.playerVehicle) {
                    this.sfx.crash(impact);
                    this.hooks.crash(impact);
                    this.particles.burst(v.pos.clone().setY(0.8), 6, {
                        color: 0xd8c890,
                        life: 0.5,
                        size: 1,
                        sizeEnd: 2.4,
                        speed: 3
                    });
                }
                this.damage(v, impact * 1.1, v === this.playerVehicle);
            }
            v.speed *= -0.25;
        }
        // world bounds
        const B = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$world$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_HALF"];
        v.pos.x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(v.pos.x, -B, B);
        v.pos.z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(v.pos.z, -B, B);
        // vehicle-vehicle separation
        for (const o of this.list){
            if (o === v || o.dead) continue;
            const dx = v.pos.x - o.pos.x;
            const dz = v.pos.z - o.pos.z;
            const rr = v.radius + o.radius;
            const d2 = dx * dx + dz * dz;
            if (d2 < rr * rr && d2 > 0.001) {
                const d = Math.sqrt(d2);
                const push = (rr - d) / 2;
                v.pos.x += dx / d * push;
                v.pos.z += dz / d * push;
                const rel = Math.abs(v.speed - o.speed);
                if (rel > 12 && v === this.playerVehicle) {
                    this.damage(o, rel * 0.8, true);
                    this.damage(v, rel * 0.3, false);
                    this.sfx.crash(rel);
                    this.hooks.crash(rel);
                    v.speed *= 0.4;
                }
            }
        }
    }
    dispose() {
        for (const v of this.list)this.scene.remove(v.group);
        this.list = [];
    }
}
}),
"[project]/src/game/player.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Player",
    ()=>Player
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/entities.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
class Player {
    scene;
    world;
    vehicles;
    sfx;
    parts;
    pos;
    vy;
    yaw;
    health;
    stamina;
    money;
    aiming;
    dead;
    sprintToggle;
    camYaw;
    camPitch;
    camDist;
    phase;
    lastStep;
    lastDamage;
    lastCamInput;
    time;
    onDamage;
    constructor(scene, world, vehicles, sfx, start){
        this.scene = scene;
        this.world = world;
        this.vehicles = vehicles;
        this.sfx = sfx;
        this.pos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 0, 0);
        this.vy = 0;
        this.yaw = 0;
        this.health = 100;
        this.stamina = 100;
        this.money = 250;
        this.aiming = false;
        this.dead = false;
        this.sprintToggle = false;
        this.camYaw = Math.PI;
        this.camPitch = 0.18;
        this.camDist = 5.4;
        this.phase = 0;
        this.lastStep = 0;
        this.lastDamage = -99;
        this.lastCamInput = -99;
        this.time = 0;
        this.onDamage = null;
        this.horizontalSpeed = 0;
        this.camPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.lookTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.tmpDir = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.parts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeHuman"])({
            hat: 'cowboy',
            shirt: '#6b3a24',
            pants: '#33291e'
        });
        this.parts.gun.visible = true;
        this.pos.set(start.x, 0, start.z);
        this.parts.group.position.copy(this.pos);
        scene.add(this.parts.group);
    }
    get speed() {
        return this.horizontalSpeed;
    }
    horizontalSpeed;
    damage(d, time) {
        if (this.dead) return;
        this.health = Math.max(0, this.health - d);
        this.lastDamage = time;
        this.sfx.hurt();
        this.onDamage?.(d);
        if (this.health <= 0) this.dead = true;
    }
    respawn(at, time) {
        this.dead = false;
        this.health = 100;
        this.stamina = 100;
        this.pos.set(at.x, 0, at.z);
        this.vy = 0;
        this.lastDamage = time;
        this.parts.group.rotation.x = 0;
        this.parts.group.visible = true;
    }
    update(dt, input, camera, time, inVehicle) {
        this.time = time;
        input.pollKeyboard();
        const look = input.consumeLook();
        if (Math.abs(look.x) > 0.0001 || Math.abs(look.y) > 0.0001) this.lastCamInput = time;
        this.camYaw -= look.x;
        this.camPitch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.camPitch + look.y, -0.85, 1.3);
        // stamina / sprint
        const sprint = input.sprintHeld() || this.sprintToggle;
        this.aiming = input.aimHeld && !inVehicle;
        if (inVehicle) {
            // ride pose on horse
            if (inVehicle.kind === 'horse') {
                const v = inVehicle;
                this.parts.group.visible = true;
                const seat = v.parts.seat;
                const off = seat.clone().applyAxisAngle(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0), v.heading);
                this.parts.group.position.set(v.pos.x + off.x, seat.y + v.group.position.y, v.pos.z + off.z);
                this.parts.group.rotation.y = v.heading;
                this.parts.lLeg.rotation.x = 0.15;
                this.parts.rLeg.rotation.x = 0.15;
                this.parts.lLeg.rotation.z = 0.5;
                this.parts.rLeg.rotation.z = -0.5;
                this.parts.lArm.rotation.x = -0.7;
                this.parts.rArm.rotation.x = -0.7;
                this.pos.set(v.pos.x, 0, v.pos.z);
            } else {
                this.parts.group.visible = false;
                this.pos.set(inVehicle.pos.x, 0, inVehicle.pos.z);
            }
            this.horizontalSpeed = Math.abs(inVehicle.speed);
            this.stamina = Math.min(100, this.stamina + 14 * dt);
            this.updateCamera(dt, camera, inVehicle, time);
            return;
        }
        this.parts.group.visible = !this.dead;
        this.parts.lLeg.rotation.z = 0;
        this.parts.rLeg.rotation.z = 0;
        // movement (camera looks toward -(sin,cos) of camYaw, so forward is the negation)
        const mv = input.move;
        if (this.dead) {
            this.horizontalSpeed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(this.horizontalSpeed, 0, 10, dt);
            this.parts.group.rotation.x = Math.min(Math.PI / 2, this.parts.group.rotation.x + dt * 4);
            this.updateCamera(dt, camera, null, time);
            return;
        }
        const fx = -Math.sin(this.camYaw);
        const fz = -Math.cos(this.camYaw);
        const wx = fx * mv.y + -fz * mv.x;
        const wz = fz * mv.y + fx * mv.x;
        const moving = Math.hypot(wx, wz) > 0.05;
        let maxSpeed = this.aiming ? 2.9 : 4.6;
        const running = sprint && moving && this.stamina > 1 && !this.aiming;
        if (running) maxSpeed = 7.6;
        if (running) this.stamina = Math.max(0, this.stamina - 11 * dt);
        else this.stamina = Math.min(100, this.stamina + 9 * dt);
        const targetSpeed = moving ? maxSpeed * Math.min(1, Math.hypot(mv.x, mv.y)) : 0;
        this.horizontalSpeed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(this.horizontalSpeed, targetSpeed, 10, dt);
        if (moving) {
            const dirYaw = Math.atan2(wx, wz);
            if (this.aiming) {
                this.yaw = this.camYaw;
            } else {
                this.yaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(this.yaw, dirYaw, 1 - Math.exp(-10 * dt));
            }
            const nx = this.pos.x + Math.sin(dirYaw) * this.horizontalSpeed * dt;
            const nz = this.pos.z + Math.cos(dirYaw) * this.horizontalSpeed * dt;
            this.pos.x = nx;
            this.pos.z = nz;
        } else {
            this.horizontalSpeed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(this.horizontalSpeed, 0, 14, dt);
            if (this.aiming) this.yaw = this.camYaw;
        }
        // jump & gravity
        const jumpPressed = input.consume('jump');
        if (jumpPressed && this.pos.y <= 0.02 && !this.dead) this.vy = 6.4;
        if (this.pos.y > 0 || this.vy > 0) {
            this.vy -= 20 * dt;
            this.pos.y += this.vy * dt;
            if (this.pos.y <= 0) {
                this.pos.y = 0;
                this.vy = 0;
            }
        }
        // collisions
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["resolveCollisions"])(this.pos, 0.42, this.world.colliders);
        // vs vehicles
        for (const v of this.vehicles.list){
            if (v.dead && v.deadT > 3) continue;
            const dx = this.pos.x - v.pos.x;
            const dz = this.pos.z - v.pos.z;
            const rr = v.radius + 0.4;
            const d2 = dx * dx + dz * dz;
            if (d2 < rr * rr && d2 > 0.0001) {
                const d = Math.sqrt(d2);
                this.pos.x += dx / d * (rr - d);
                this.pos.z += dz / d * (rr - d);
            }
        }
        const B = 1150;
        this.pos.x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.pos.x, -B, B);
        this.pos.z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.pos.z, -B, B);
        // health regen
        if (time - this.lastDamage > 8 && this.health > 0 && !this.dead) {
            this.health = Math.min(100, this.health + 2.5 * dt);
        }
        // animation
        this.phase += this.horizontalSpeed * dt * 2.1;
        if (this.horizontalSpeed > 1.2) {
            const c = Math.sin(this.phase);
            if (Math.abs(c) > 0.92 && time - this.lastStep > 0.22) {
                this.lastStep = time;
                this.sfx.step();
            }
        }
        if (!this.dead) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["animateHuman"])(this.parts, this.phase, this.horizontalSpeed, this.aiming, this.camPitch);
            this.parts.group.position.copy(this.pos);
            this.parts.group.rotation.y = this.yaw;
        }
        this.updateCamera(dt, camera, null, time);
    }
    camPos;
    lookTarget;
    tmpDir;
    updateCamera(dt, camera, vehicle, time) {
        let dist;
        if (vehicle) {
            // auto-align behind vehicle when camera idle
            if (time - this.lastCamInput > 1.4) {
                this.camYaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(this.camYaw, vehicle.heading + Math.PI, 1 - Math.exp(-1.6 * dt));
                this.camPitch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(this.camPitch, 0.22, 2, dt);
            }
            dist = vehicle.kind === 'car' ? 9 + Math.abs(vehicle.speed) * 0.07 : 7.2;
        } else {
            dist = this.aiming ? 2.5 : 5.4;
        }
        this.camDist = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(this.camDist, dist, 6, dt);
        if (vehicle) {
            this.lookTarget.set(vehicle.pos.x, 2.1, vehicle.pos.z);
        } else {
            this.lookTarget.copy(this.pos);
            this.lookTarget.y += 1.55;
            if (this.aiming) {
                const rx = Math.cos(this.camYaw) * 0.62;
                const rz = -Math.sin(this.camYaw) * 0.62;
                this.lookTarget.x += rx;
                this.lookTarget.z += rz;
            }
        }
        const cp = Math.cos(this.camPitch);
        this.tmpDir.set(Math.sin(this.camYaw) * cp, Math.sin(this.camPitch), Math.cos(this.camYaw) * cp);
        this.camPos.copy(this.lookTarget).addScaledVector(this.tmpDir, this.camDist);
        // pull in on walls
        const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["segmentVsColliders"])(this.lookTarget.x, this.lookTarget.z, this.camPos.x, this.camPos.z, this.world.colliders);
        if (t !== null && t < 1) {
            this.camPos.copy(this.lookTarget).addScaledVector(this.tmpDir, Math.max(0.8, this.camDist * t * 0.85));
        }
        if (this.camPos.y < 0.4) this.camPos.y = 0.4;
        camera.position.copy(this.camPos);
        camera.lookAt(this.lookTarget);
        // fov
        const inCar = vehicle?.kind === 'car';
        const targetFov = this.aiming ? 46 : inCar ? Math.min(96, 70 + Math.abs(vehicle.speed) * 0.5) : 70;
        if (Math.abs(camera.fov - targetFov) > 0.1) {
            camera.fov = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["damp"])(camera.fov, targetFov, 5, dt);
            camera.updateProjectionMatrix();
        }
    }
    /** camera-space forward for shooting */ aimRay(camera) {
        return camera.getWorldDirection(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]());
    }
    /** muzzle world position */ muzzle() {
        const p = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.parts.rArm.children[0]?.getWorldPosition(p);
        return p;
    }
    turnToward(yaw, dt) {
        this.yaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(this.yaw, yaw, 1 - Math.exp(-8 * dt));
    }
}
}),
"[project]/src/game/combat.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Combat",
    ()=>Combat,
    "WEAPONS",
    ()=>WEAPONS
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/entities.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
const WEAPONS = [
    {
        id: 'revolver',
        name: 'شش‌لول',
        dmg: 34,
        rate: 0.38,
        mag: 6,
        reload: 2.1,
        range: 70,
        spreadHip: 0.035,
        spreadAim: 0.008,
        price: 0,
        ammoPack: 12,
        ammoCost: 30,
        sfx: 'revolver'
    },
    {
        id: 'pistol',
        name: 'کلت برنی',
        dmg: 24,
        rate: 0.17,
        mag: 14,
        reload: 1.5,
        range: 80,
        spreadHip: 0.04,
        spreadAim: 0.014,
        price: 250,
        ammoPack: 24,
        ammoCost: 40,
        sfx: 'pistol'
    },
    {
        id: 'rifle',
        name: 'شاهین ۷۰۸',
        dmg: 65,
        rate: 0.95,
        mag: 5,
        reload: 2.6,
        range: 170,
        spreadHip: 0.05,
        spreadAim: 0.004,
        price: 600,
        ammoPack: 10,
        ammoCost: 55,
        sfx: 'rifle'
    },
    {
        id: 'shotgun',
        name: 'تفنگ شکاری',
        dmg: 74,
        rate: 1.05,
        mag: 2,
        reload: 2.5,
        range: 42,
        spreadHip: 0.09,
        spreadAim: 0.055,
        price: 450,
        ammoPack: 10,
        ammoCost: 45,
        sfx: 'rifle'
    },
    {
        id: 'smg',
        name: 'مسلسل «رگبار»',
        dmg: 17,
        rate: 0.095,
        mag: 30,
        reload: 2,
        range: 60,
        spreadHip: 0.055,
        spreadAim: 0.03,
        price: 850,
        ammoPack: 60,
        ammoCost: 70,
        sfx: 'pistol'
    }
];
class Combat {
    scene;
    world;
    sfx;
    particles;
    vehicles;
    player;
    quality;
    weapons;
    current;
    reloadT;
    fireCd;
    humans;
    pickups;
    heat;
    stars;
    lastCrime;
    hooks;
    // tracers
    tracers;
    tracerPool;
    muzzleLight;
    muzzleT;
    playerPos;
    playerSpeed;
    copSpawnT;
    shotsNearT;
    constructor(scene, world, sfx, particles, vehicles, player, quality){
        this.scene = scene;
        this.world = world;
        this.sfx = sfx;
        this.particles = particles;
        this.vehicles = vehicles;
        this.player = player;
        this.quality = quality;
        this.weapons = WEAPONS.map((d)=>({
                def: d,
                mag: d.id === 'revolver' ? 6 : 0,
                reserve: d.id === 'revolver' ? 24 : 0,
                owned: d.id === 'revolver'
            }));
        this.current = 0;
        this.reloadT = 0;
        this.fireCd = 0;
        this.humans = [];
        this.pickups = [];
        this.heat = 0;
        this.stars = 0;
        this.lastCrime = -99;
        this.tracers = [];
        this.tracerPool = [];
        this.muzzleT = 0;
        this.playerPos = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.playerSpeed = 0;
        this.copSpawnT = 0;
        this.shotsNearT = 0;
        this.timeNow = 0;
        this.hooks = {
            onKill: ()=>{},
            onStarsChange: ()=>{},
            onPlayerDeath: ()=>{}
        };
        // muzzle light
        this.muzzleLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PointLight"](0xffc060, 0, 16, 1.8);
        scene.add(this.muzzleLight);
        // tracer pool
        const tg = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoxGeometry"](0.035, 0.035, 1);
        tg.translate(0, 0, -0.5);
        for(let i = 0; i < 24; i++){
            const m = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](tg, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
                color: 0xffe8a0,
                transparent: true,
                opacity: 0.9,
                blending: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AdditiveBlending"],
                depthWrite: false
            }));
            m.visible = false;
            scene.add(m);
            this.tracerPool.push(m);
        }
    }
    get weapon() {
        return this.weapons[this.current];
    }
    /* ================= world population ================= */ spawnBandits() {
        this.world.camps.forEach((camp, ci)=>{
            camp.spawns.forEach((s, si)=>{
                if (si === 0 && this.quality === 'low') return;
                this.spawnHuman('bandit', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](s.x, 0, s.z), ci);
            });
        });
    }
    spawnCivilians() {
        const n = this.quality === 'low' ? 12 : this.quality === 'med' ? 19 : 26;
        for(let i = 0; i < n; i++){
            let x, z;
            if (i % 3 === 0) {
                // town
                x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-180, 180);
                z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                    590,
                    594,
                    606,
                    610
                ]);
            } else {
                // city sidewalks
                const road = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                    -240,
                    -120,
                    0,
                    120,
                    240
                ]);
                x = road + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                    -9.5,
                    9.5
                ]);
                z = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-860, -320);
                if (Math.random() < 0.4) {
                    const h = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                        -840,
                        -660,
                        -480,
                        -300
                    ]);
                    z = h + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                        -9.5,
                        9.5
                    ]);
                    x = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-260, 260);
                }
            }
            this.spawnHuman('civ', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](x, 0, z));
        }
    }
    /** raiders camped around the farm (virtual camp index 4) */ spawnFarmRaiders() {
        for (const s of this.world.spots.farmRaiders){
            if (this.quality === 'low' && Math.random() < 0.35) continue;
            this.spawnHuman('bandit', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](s.x, 0, s.z), 4);
        }
    }
    spawnHuman(team, pos, camp) {
        const opts = team === 'civ' ? {
            shirt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                '#7a7a6a',
                '#5a6a7a',
                '#8a7a5a',
                '#6a5a4a',
                '#4a5a3a'
            ]),
            hat: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                'none',
                'cap'
            ])
        } : team === 'cop' ? {
            shirt: '#2c3444',
            pants: '#22262e',
            hat: 'cap'
        } : {
            shirt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])([
                '#5a3a2a',
                '#3a3a2a',
                '#6b4a2a'
            ]),
            bandana: true,
            hat: 'cowboy'
        };
        const parts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeHuman"])(opts);
        parts.group.position.copy(pos);
        parts.gun.visible = team !== 'civ';
        this.scene.add(parts.group);
        const h = {
            parts,
            pos: pos.clone(),
            yaw: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6),
            health: team === 'cop' ? 60 : team === 'civ' ? 40 : team === 'duelist' ? 90 : 70,
            team,
            state: team === 'civ' ? 'idle' : 'idle',
            fireT: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.5, 2),
            losT: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 0.4),
            hasLOS: false,
            phase: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6),
            speed: 0,
            home: pos.clone(),
            wander: pos.clone(),
            wanderT: 0,
            deadT: 0,
            strafe: Math.random() < 0.5 ? 1 : -1,
            camp
        };
        this.humans.push(h);
        return h;
    }
    /* ================= wanted ================= */ addCrime(pts, time) {
        const before = this.stars;
        this.heat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.heat + pts, 0, 500);
        this.stars = Math.min(5, Math.max(1, Math.ceil(this.heat / 100)));
        this.lastCrime = time;
        if (this.stars > before) {
            this.sfx.star();
            this.hooks.onStarsChange(this.stars);
        }
    }
    clearWanted() {
        this.heat = 0;
        if (this.stars > 0) {
            this.stars = 0;
            this.hooks.onStarsChange(0);
        }
        this.vehicles.clearPolice();
        for (const h of this.humans){
            if (h.team === 'cop' && h.state !== 'dead') h.state = 'flee';
        }
    }
    starsDecay(dt, time) {
        if (this.heat <= 0) return;
        const copCars = this.vehicles.copsNear(this.playerPos, 70);
        const copFoot = this.humans.some((h)=>h.team === 'cop' && h.state === 'engage' && h.pos.distanceToSquared(this.playerPos) < 60 * 60);
        if (time - this.lastCrime > 9 && copCars === 0 && !copFoot) {
            this.heat = Math.max(0, this.heat - 15 * dt);
            const s = Math.ceil(this.heat / 100);
            if (s !== this.stars) {
                this.stars = Math.min(5, Math.max(0, s));
                this.hooks.onStarsChange(this.stars);
                if (this.stars === 0) this.clearWanted();
            }
        }
    }
    /* ================= shooting ================= */ tryFire(camera, playerPos, time, isTouch) {
        if (this.reloadT > 0 || this.fireCd > 0) return false;
        const w = this.weapon;
        if (w.mag <= 0) {
            if (w.reserve > 0) this.reload();
            else this.sfx.dryFire();
            return false;
        }
        this.fireCd = w.def.rate;
        w.mag--;
        this.sfx.shot(w.def.sfx);
        this.shotsNearT = time;
        // direction with spread
        const dir = camera.getWorldDirection(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]());
        const spread = this.player.aiming ? w.def.spreadAim : w.def.spreadHip;
        // touch aim assist
        if (isTouch) {
            const assist = this.findAssist(camera, playerPos, dir);
            if (assist) dir.copy(assist);
        }
        dir.x += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-spread, spread);
        dir.y += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-spread, spread) * 0.6;
        dir.z += (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-spread, spread);
        dir.normalize();
        const origin = camera.position.clone();
        const range = w.def.range;
        const end = origin.clone().addScaledVector(dir, range);
        // find nearest hit: enemies then walls (all distances normalized 0..1 over range)
        let hitHuman = null;
        let hitT = 1;
        let head = false;
        for (const h of this.humans){
            if (h.state === 'dead') continue;
            const bodyC = h.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.05, 0));
            const headC = h.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.72, 0));
            const tbRaw = raySphere(origin, dir, bodyC, 0.55);
            const thRaw = raySphere(origin, dir, headC, 0.3);
            const tb = tbRaw !== null ? tbRaw / range : null;
            const th = thRaw !== null ? thRaw / range : null;
            const t = th !== null && (tb === null || th < tb) ? th : tb;
            if (t !== null && t < hitT) {
                hitT = t;
                hitHuman = h;
                head = th !== null && (tb === null || th <= tb);
            }
        }
        // walls (2D XZ)
        const wallT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["segmentVsColliders"])(origin.x, origin.z, end.x, end.z, this.world.colliders);
        if (wallT !== null && wallT < hitT) {
            hitT = wallT;
            hitHuman = null;
        }
        const hitPoint = origin.clone().addScaledVector(dir, hitT * range);
        // muzzle from gun
        const muzzle = this.player.muzzle();
        this.muzzleLight.position.copy(muzzle);
        this.muzzleLight.intensity = 4;
        this.muzzleT = 0.06;
        this.particles.spawn(muzzle, {
            additive: true,
            color: 0xffd070,
            life: 0.08,
            size: 1.4,
            sizeEnd: 0.6
        });
        this.spawnTracer(muzzle, hitPoint);
        if (hitHuman) {
            const dmg = w.def.dmg * (head ? 2 : 1);
            this.damageHuman(hitHuman, dmg, hitPoint, time);
            this.particles.burst(hitPoint, 5, {
                color: 0x8a1a10,
                life: 0.4,
                size: 0.5,
                sizeEnd: 1.4,
                speed: 3,
                gravity: 6
            });
            this.sfx.hit();
        } else {
            // dust/spark on wall or ground
            this.particles.burst(hitPoint, 4, {
                additive: true,
                color: 0xd8c090,
                life: 0.3,
                size: 0.4,
                sizeEnd: 1.2,
                speed: 2.5,
                gravity: 4
            });
        }
        // recoil
        this.player.camPitch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(this.player.camPitch + 0.012, -0.85, 1.3);
        // firing near people = crime
        if (this.stars < 5) {
            for (const h of this.humans){
                if (h.state === 'dead') continue;
                const d = h.pos.distanceToSquared(playerPos);
                if (d < 26 * 26 && (h.team === 'civ' || h.team === 'cop')) {
                    this.addCrime(h.team === 'cop' ? 22 : 12, time);
                    break;
                }
            }
        }
        return true;
    }
    findAssist(camera, playerPos, dir) {
        let best = null;
        let bestDot = 0.992 // ~7.2deg
        ;
        for (const h of this.humans){
            if (h.state === 'dead') continue;
            const to = h.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.2, 0)).sub(camera.position);
            const d = to.length();
            if (d > 90) continue;
            to.normalize();
            const dot = to.dot(dir);
            if (dot > bestDot && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["segmentVsColliders"])(playerPos.x, playerPos.z, h.pos.x, h.pos.z, this.world.colliders) === null) {
                bestDot = dot;
                best = to;
            }
        }
        return best;
    }
    reload() {
        const w = this.weapon;
        if (this.reloadT > 0 || w.mag >= w.def.mag || w.reserve <= 0) return;
        this.reloadT = w.def.reload;
        this.sfx.reload();
    }
    switchWeapon(i) {
        if (i >= 0 && i < this.weapons.length && this.weapons[i].owned && i !== this.current) {
            this.current = i;
            this.reloadT = 0;
            this.sfx.click();
        }
    }
    cycleWeapon() {
        for(let k = 1; k <= this.weapons.length; k++){
            const i = (this.current + k) % this.weapons.length;
            if (this.weapons[i].owned) {
                this.switchWeapon(i);
                return;
            }
        }
    }
    /* ================= damage & death ================= */ damageHuman(h, dmg, at, time) {
        if (h.state === 'dead') return;
        h.health -= dmg;
        // alert
        if (h.team === 'civ') {
            h.state = 'flee';
            this.panicNearby(h.pos, time);
        } else {
            h.state = 'engage';
        }
        if (h.health <= 0) this.killHuman(h, time, true);
        void at;
    }
    killHuman(h, time, byPlayer) {
        h.state = 'dead';
        h.deadT = 0;
        this.sfx.kill();
        this.hooks.onKill(h.team, h.pos.clone(), h.camp);
        if (byPlayer) {
            if (h.team === 'civ') this.addCrime(85, time);
            else if (h.team === 'cop') this.addCrime(100, time);
            // drops
            if (h.team === 'bandit' || h.team === 'duelist') {
                this.spawnPickup('cash', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(15, 60), h.pos);
            } else if (h.team === 'cop' && Math.random() < 0.5) {
                this.spawnPickup('cash', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(20, 40), h.pos);
            } else if (h.team === 'civ' && Math.random() < 0.6) {
                this.spawnPickup('cash', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["randi"])(5, 25), h.pos);
            }
            if ((h.team === 'bandit' || h.team === 'cop') && Math.random() < 0.35) {
                this.spawnPickup('ammo', this.weapon.def.id === 'rifle' || this.weapon.def.id === 'shotgun' ? 6 : 12, h.pos);
            }
        }
    }
    panicNearby(pos, time) {
        for (const h of this.humans){
            if (h.team === 'civ' && h.state !== 'dead' && h.pos.distanceToSquared(pos) < 30 * 30) {
                h.state = 'flee';
                h.wanderT = 0;
            }
        }
        void time;
    }
    /* vehicle run-over check */ onVehicleHitPed(front, speed) {
        if (speed < 6) return;
        for (const h of this.humans){
            if (h.state === 'dead') continue;
            if (h.pos.distanceToSquared(front) < 1.8 * 1.8) {
                const time = this.timeNow;
                this.particles.burst(h.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0)), 8, {
                    color: 0x8a1a10,
                    life: 0.5,
                    size: 0.6,
                    sizeEnd: 1.6,
                    speed: 4,
                    gravity: 7
                });
                this.killHuman(h, time, true);
                if (h.team === 'civ') this.addCrime(70, time);
                else if (h.team === 'cop') this.addCrime(90, time);
            }
        }
    }
    timeNow;
    /* explosion damage */ onExplosion(pos) {
        const time = this.timeNow;
        // player
        const pd = this.player.pos.distanceTo(pos);
        if (pd < 10 && !this.player.dead) {
            this.player.damage(60 - pd * 4.5, time);
            if (this.player.dead) this.hooks.onPlayerDeath();
        }
        for (const h of this.humans){
            if (h.state === 'dead') continue;
            const d = h.pos.distanceTo(pos);
            if (d < 10) {
                this.damageHuman(h, 90 - d * 7, h.pos, time);
            }
        }
    }
    /* ================= pickups ================= */ spawnPickup(kind, amount, pos) {
        const mesh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makePickupMesh"])(kind);
        mesh.position.copy(pos).setY(0.35);
        this.scene.add(mesh);
        this.pickups.push({
            kind,
            amount,
            mesh,
            pos: mesh.position.clone(),
            t: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0, 6)
        });
    }
    /* ================= buy ================= */ buyWeapon(idx) {
        const w = this.weapons[idx];
        if (w.owned) return 'قبلاً خریده‌اید';
        if (this.player.money < w.def.price) return 'پول کافی ندارید';
        this.player.money -= w.def.price;
        w.owned = true;
        w.mag = w.def.mag;
        w.reserve = w.def.ammoPack;
        this.current = idx;
        this.sfx.buy();
        return null;
    }
    buyAmmo() {
        const w = this.weapon;
        if (this.player.money < w.def.ammoCost) return 'پول کافی ندارید';
        this.player.money -= w.def.ammoCost;
        w.reserve += w.def.ammoPack;
        this.sfx.buy();
        return null;
    }
    buyHealth() {
        if (this.player.health >= 100) return 'سلامتی کامل است';
        if (this.player.money < 30) return 'پول کافی ندارید';
        this.player.money -= 30;
        this.player.health = 100;
        this.sfx.buy();
        return null;
    }
    /* ================= cops spawn ================= */ spawnCop(pos) {
        const n = this.countTeam('cop', true);
        const want = Math.min(7, this.stars * 2);
        if (n >= want) return;
        // find road point 35-65 away
        const { nodes } = this.world.graph;
        const cands = nodes.filter((nn)=>{
            const d = Math.hypot(nn.x - pos.x, nn.z - pos.z);
            return d > 30 && d < 70;
        });
        const at = cands.length ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pick"])(cands) : {
            x: pos.x + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-40, 40),
            z: pos.z + (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-40, 40)
        };
        this.spawnHuman('cop', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](at.x, 0, at.z));
    }
    countTeam(team, alive) {
        return this.humans.filter((h)=>h.team === team && (!alive || h.state !== 'dead')).length;
    }
    /* ================= tracers ================= */ spawnTracer(a, b) {
        const m = this.tracerPool.find((t)=>!t.visible);
        if (!m) return;
        const len = a.distanceTo(b);
        if (len < 0.5) return;
        m.visible = true;
        m.position.copy(a);
        m.lookAt(b);
        m.scale.set(1, 1, len);
        this.tracers.push({
            mesh: m,
            t: 0.09
        });
    }
    /* ================= update ================= */ update(dt, playerPos, playerSpeed, camera, time, inVehicle) {
        this.timeNow = time;
        this.playerPos = playerPos;
        this.playerSpeed = playerSpeed;
        this.fireCd = Math.max(0, this.fireCd - dt);
        // reload
        if (this.reloadT > 0) {
            this.reloadT -= dt;
            if (this.reloadT <= 0) {
                const w = this.weapon;
                const need = w.def.mag - w.mag;
                const take = Math.min(need, w.reserve);
                w.mag += take;
                w.reserve -= take;
            }
        }
        // muzzle light decay
        if (this.muzzleT > 0) {
            this.muzzleT -= dt;
            if (this.muzzleT <= 0) this.muzzleLight.intensity = 0;
        }
        // tracers
        for(let i = this.tracers.length - 1; i >= 0; i--){
            const tr = this.tracers[i];
            tr.t -= dt;
            const mat = tr.mesh.material;
            mat.opacity = Math.max(0, tr.t / 0.09) * 0.9;
            if (tr.t <= 0) {
                tr.mesh.visible = false;
                this.tracers.splice(i, 1);
            }
        }
        // humans
        const pp = playerPos;
        for(let i = this.humans.length - 1; i >= 0; i--){
            const h = this.humans[i];
            if (h.state === 'dead') {
                h.deadT += dt;
                // fall animation
                h.parts.group.rotation.x = Math.min(Math.PI / 2, h.deadT * 5);
                if (h.deadT > 9) {
                    this.scene.remove(h.parts.group);
                    this.humans.splice(i, 1);
                }
                continue;
            }
            this.updateHuman(h, dt, pp, time, inVehicle);
        }
        // pickups
        for(let i = this.pickups.length - 1; i >= 0; i--){
            const p = this.pickups[i];
            p.t += dt;
            p.mesh.rotation.y += dt * 2;
            p.mesh.position.y = 0.35 + Math.sin(p.t * 3) * 0.12;
            if (p.mesh.position.distanceToSquared(pp) < 2 * 2) {
                this.collect(p, time);
                this.scene.remove(p.mesh);
                this.pickups.splice(i, 1);
            } else if (p.t > 60) {
                this.scene.remove(p.mesh);
                this.pickups.splice(i, 1);
            }
        }
        // cop spawning (foot)
        if (this.stars >= 1) {
            this.copSpawnT -= dt;
            if (this.copSpawnT <= 0) {
                this.copSpawnT = 4.5;
                this.spawnCop(pp);
            }
        }
        this.starsDecay(dt, time);
        void camera;
    }
    collect(p, time) {
        if (p.kind === 'cash') {
            this.player.money += p.amount;
            this.sfx.cash();
        } else if (p.kind === 'ammo') {
            const w = this.weapon;
            w.reserve += p.amount;
            this.sfx.pickup();
        } else {
            this.player.health = Math.min(100, this.player.health + 40);
            this.sfx.pickup();
        }
        void time;
    }
    updateHuman(h, dt, pp, time, inVehicle) {
        const d = h.pos.distanceTo(pp);
        h.losT -= dt;
        if (h.losT <= 0) {
            h.losT = 0.4 + Math.random() * 0.2;
            h.hasLOS = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["segmentVsColliders"])(h.pos.x, h.pos.z, pp.x, pp.z, this.world.colliders) === null;
        }
        let moveTarget = null;
        let wantSpeed = 0;
        if (h.team === 'civ') {
            if (h.state === 'flee') {
                const away = h.pos.clone().sub(pp).normalize().multiplyScalar(30).add(h.pos);
                moveTarget = away;
                wantSpeed = 6.2;
                if (d > 42) {
                    h.state = 'idle';
                    h.wander.copy(h.pos);
                }
            } else {
                h.wanderT -= dt;
                if (h.wanderT <= 0) {
                    h.wanderT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(4, 9);
                    h.wander.copy(h.home).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-22, 22), 0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-22, 22)));
                }
                if (h.pos.distanceToSquared(h.wander) > 2) {
                    moveTarget = h.wander;
                    wantSpeed = 1.7;
                }
                if (this.stars >= 3 && d < 24 && h.hasLOS) h.state = 'flee';
            }
        } else if (h.team === 'cop' && this.stars === 0) {
            // walk away & despawn
            const away = h.pos.clone().sub(pp).normalize().multiplyScalar(40).add(h.pos);
            moveTarget = away;
            wantSpeed = 5;
            if (d > 55) {
                this.scene.remove(h.parts.group);
                const idx = this.humans.indexOf(h);
                if (idx >= 0) this.humans.splice(idx, 1);
                return;
            }
        } else {
            // bandit / cop / duelist combat
            const engageRange = h.team === 'cop' ? 46 : h.team === 'duelist' ? 40 : 38;
            if (this.player.dead) {
                h.state = 'idle';
            } else if (d < engageRange || h.state === 'engage') {
                if (d > engageRange * 1.3) h.state = 'idle';
                else h.state = 'engage';
            }
            if (h.state === 'engage' && h.hasLOS) {
                // strafe/hold position
                const ideal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(12, 15);
                if (d > ideal + 3) {
                    moveTarget = pp.clone();
                    wantSpeed = 5.4;
                } else if (d < ideal - 4) {
                    const away = h.pos.clone().sub(pp).normalize().multiplyScalar(6).add(h.pos);
                    moveTarget = away;
                    wantSpeed = 4.6;
                } else {
                    const perp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](pp.z - h.pos.z, 0, -(pp.x - h.pos.x)).normalize().multiplyScalar(h.strafe * 4);
                    moveTarget = h.pos.clone().add(perp);
                    wantSpeed = 2.4;
                    if (Math.random() < dt * 0.4) h.strafe *= -1;
                }
                // face player
                h.yaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(h.yaw, Math.atan2(pp.x - h.pos.x, pp.z - h.pos.z), 1 - Math.exp(-8 * dt));
                // shoot
                h.fireT -= dt;
                if (h.fireT <= 0 && d < 55) {
                    h.fireT = h.team === 'cop' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.9, 1.5) : h.team === 'duelist' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.7, 1.2) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(1.1, 2.2);
                    this.enemyShoot(h, pp, d, inVehicle);
                }
            } else if (h.state === 'engage' || d < 60) {
                // lost LOS → move toward last known
                moveTarget = pp.clone();
                wantSpeed = 5.2;
            } else {
                // idle wander near home
                h.wanderT -= dt;
                if (h.wanderT <= 0) {
                    h.wanderT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(5, 10);
                    h.wander.copy(h.home).add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-10, 10), 0, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-10, 10)));
                }
                if (h.pos.distanceToSquared(h.wander) > 2) {
                    moveTarget = h.wander;
                    wantSpeed = 1.6;
                }
            }
        }
        // movement
        if (moveTarget && wantSpeed > 0.1) {
            const dx = moveTarget.x - h.pos.x;
            const dz = moveTarget.z - h.pos.z;
            const dl = Math.hypot(dx, dz);
            if (dl > 0.6) {
                const step = Math.min(wantSpeed * dt, dl);
                h.pos.x += dx / dl * step;
                h.pos.z += dz / dl * step;
                if (h.state !== 'engage') h.yaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerpAngle"])(h.yaw, Math.atan2(dx, dz), 1 - Math.exp(-8 * dt));
                h.speed = wantSpeed;
            } else {
                h.speed = 0;
            }
        } else {
            h.speed = 0;
        }
        // collide with world (cheap: only near buildings)
        if (h.speed > 0.1) {
            for (const b of this.world.colliders){
                if (Math.abs(h.pos.x - b.x) > b.hw + 0.5 || Math.abs(h.pos.z - b.z) > b.hd + 0.5) continue;
                const cx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(h.pos.x, b.x - b.hw, b.x + b.hw);
                const cz = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(h.pos.z, b.z - b.hd, b.z + b.hd);
                const dx = h.pos.x - cx;
                const dz = h.pos.z - cz;
                const d2 = dx * dx + dz * dz;
                if (d2 < 0.25 && d2 > 0.0001) {
                    const dd = Math.sqrt(d2);
                    h.pos.x += dx / dd * (0.5 - dd);
                    h.pos.z += dz / dd * (0.5 - dd);
                }
            }
        }
        h.phase += h.speed * dt * 2.1;
        const armed = h.team !== 'civ' && (h.state === 'engage' || h.speed > 0.1);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["animateHuman"])(h.parts, h.phase, h.speed, armed && h.state === 'engage', 0);
        h.parts.group.position.copy(h.pos);
        h.parts.group.rotation.y = h.yaw;
        void time;
    }
    enemyShoot(h, pp, d, inVehicle) {
        this.sfx.enemyShot(d);
        const from = h.pos.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.35, 0));
        // hit chance
        let chance = 0.42 - d * 0.006 - this.playerSpeed * 0.018;
        if (inVehicle && inVehicle.kind === 'car') chance -= 0.12;
        if (!h.hasLOS) chance = 0;
        if (Math.random() < (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(chance, 0.05, 0.42)) {
            const to = pp.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1.3, 0));
            this.spawnTracer(from, to);
            const dmg = h.team === 'cop' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(5, 9) : h.team === 'duelist' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(9, 14) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(6, 11);
            if (inVehicle) {
                // damage vehicle instead
                this.vehicles.damage(inVehicle, dmg * 0.7, false);
                this.particles.burst(to, 3, {
                    additive: true,
                    color: 0xffe0a0,
                    life: 0.2,
                    size: 0.4,
                    sizeEnd: 1,
                    speed: 2
                });
            } else {
                this.player.damage(dmg, this.timeNow);
                if (this.player.dead) this.hooks.onPlayerDeath();
            }
        } else {
            const miss = pp.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-2.5, 2.5), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(0.5, 2.2), (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["rand"])(-2.5, 2.5)));
            this.spawnTracer(from, miss);
            this.particles.burst(miss, 2, {
                additive: true,
                color: 0xd8c090,
                life: 0.25,
                size: 0.3,
                sizeEnd: 1,
                speed: 2
            });
        }
    }
    /* mission helpers */ banditsAliveNear(pos, r) {
        return this.humans.filter((h)=>h.team === 'bandit' && h.state !== 'dead' && h.pos.distanceToSquared(pos) < r * r).length;
    }
    spawnDuelists(pos) {
        const arr = [];
        for(let i = 0; i < 3; i++){
            const a = i / 3 * Math.PI * 2;
            const h = this.spawnHuman('duelist', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](pos.x + Math.cos(a) * 9, 0, pos.z + Math.sin(a) * 9));
            h.state = 'engage';
            arr.push(h);
        }
        return arr;
    }
    setHeatForEscape() {
        this.heat = 380;
        this.stars = 4;
        this.lastCrime = this.timeNow;
        this.hooks.onStarsChange(4);
    }
    forceSpawnCops(n) {
        for(let i = 0; i < n; i++)this.spawnCop(this.playerPos);
    }
    /* ammo info for hud */ hudWeapon() {
        const w = this.weapon;
        return {
            name: w.def.name,
            mag: w.mag,
            reserve: w.reserve,
            reloading: this.reloadT > 0
        };
    }
    faAmmo() {
        const w = this.weapon;
        return `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(w.mag)} / ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(w.reserve)}`;
    }
    /* minimap entity data */ mapEntities() {
        const out = [];
        for (const h of this.humans){
            if (h.state === 'dead') continue;
            if (h.team === 'cop') out.push({
                x: h.pos.x,
                z: h.pos.z,
                t: 'cop'
            });
            else if (h.team === 'bandit' || h.team === 'duelist') out.push({
                x: h.pos.x,
                z: h.pos.z,
                t: 'enemy'
            });
        }
        for (const p of this.pickups)out.push({
            x: p.pos.x,
            z: p.pos.z,
            t: 'pickup'
        });
        return out;
    }
    colliders() {
        return this.world.colliders;
    }
    dispose() {
        for (const h of this.humans)this.scene.remove(h.parts.group);
        for (const p of this.pickups)this.scene.remove(p.mesh);
        for (const t of this.tracerPool)this.scene.remove(t);
        this.scene.remove(this.muzzleLight);
        // giver beacons are added by missions
        this.humans = [];
        this.pickups = [];
    }
}
/* ray-sphere intersection: returns t (distance along normalized dir) or null */ function raySphere(o, d, c, r) {
    const ox = o.x - c.x;
    const oy = o.y - c.y;
    const oz = o.z - c.z;
    const b = ox * d.x + oy * d.y + oz * d.z;
    const cc = ox * ox + oy * oy + oz * oz - r * r;
    const disc = b * b - cc;
    if (disc < 0) return null;
    const t = -b - Math.sqrt(disc);
    return t > 0 ? t : null;
}
}),
"[project]/src/game/missions.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Missions",
    ()=>Missions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/entities.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
class Missions {
    scene;
    world;
    combat;
    vehicles;
    player;
    sfx;
    defs;
    active;
    onComplete;
    onFail;
    giverMarkers;
    targetBeacon;
    cpBeacon;
    killCount;
    cpIndex;
    constructor(scene, world, combat, vehicles, player, sfx){
        this.scene = scene;
        this.world = world;
        this.combat = combat;
        this.vehicles = vehicles;
        this.player = player;
        this.sfx = sfx;
        this.defs = [];
        this.active = null;
        this.onComplete = null;
        this.onFail = null;
        this.giverMarkers = [];
        this.killCount = 0;
        this.cpIndex = 0;
        const g = world.spots.givers;
        this.defs = [
            {
                id: 'delivery',
                title: 'تحویل مرسوله',
                giver: g.delivery,
                reward: 500,
                desc: 'یکی بسته‌ی مشکوک از اداره پست لاس سومبرا باید تا سالون سنگ‌سرخ برسد. وقت کم است — سریع باش.'
            },
            {
                id: 'bounty',
                title: 'شکار جایزه‌باز',
                giver: g.bounty,
                reward: 800,
                desc: 'کلانتر سنگ‌سرخ برای از بین بردن ۴ یاغی کمپ شرقی جایزه گذاشته. حواست به کمین باشد.'
            },
            {
                id: 'race',
                title: 'مسابقه خیابانی',
                giver: g.race,
                reward: 600,
                desc: 'راننده‌های زیرزمینی لاس سومبرا چالش گذاشته‌اند: ۸ ایستگاه کنترل در خیابان‌های شهر. ماشین لازم داری!'
            },
            {
                id: 'duel',
                title: 'دوئل غروب',
                giver: g.duel,
                reward: 700,
                desc: 'سه تیرانداز حرفه‌ای پشت سالون منتظر تو هستند. قانون قدیمی مرز: هرکس زود بکشد، زنده می‌ماند.'
            },
            {
                id: 'escape',
                title: 'فرار بزرگ',
                giver: g.escape,
                reward: 1500,
                desc: 'می‌خواهی شهرتی شبیه افسانه‌ها داشته باشی؟ ۴ ستاره‌ی تعقیب را ۷۵ ثانیه زنده بمان...'
            },
            {
                id: 'farmraid',
                title: 'راهزنان مزرعه',
                giver: g.farmraid,
                reward: 900,
                desc: 'راهزنان مزرعه دلگون را محاصره کرده‌اند و بار مزارع را می‌دزدند. کلانتر می‌گوید هر کدام را که از پا درآوردی، جایزه دارد. اسلحه خوب بردار!'
            },
            {
                id: 'convoy',
                title: 'کشتیر غله',
                giver: g.convoy,
                reward: 750,
                desc: 'بار غله‌ی مزرعه باید به انبار شهر برسد. اول بار را بردار، بعد تا انبار غربی شهر بران — قبل از غروب!'
            },
            {
                id: 'treasure',
                title: 'نقشه گنج',
                giver: g.treasure,
                reward: 650,
                desc: 'یک نقشه‌ی کهنه پای کلیسا پیدا شده: گنجی نزدیک «دکل رادیوی بیابان» دفن شده. نشان روی نقشه را دنبال کن.'
            }
        ];
        // giver markers (pulsing rings)
        for (const def of this.defs){
            const mesh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeBeacon"])(0xffd24a, 1.6, 26);
            mesh.position.set(def.giver.x, 13, def.giver.z);
            mesh.visible = true;
            scene.add(mesh);
            this.giverMarkers.push({
                def,
                mesh
            });
        }
        this.targetBeacon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeBeacon"])(0xffa02a, 2.2, 60);
        this.targetBeacon.visible = false;
        scene.add(this.targetBeacon);
        this.cpBeacon = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$entities$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["makeBeacon"])(0x4ad8ff, 3.2, 40);
        this.cpBeacon.visible = false;
        scene.add(this.cpBeacon);
    // kill notifications are relayed by engine via notifyKill()
    }
    notifyKill(team, pos, camp) {
        if (!this.active) return;
        const id = this.active.def.id;
        if (id === 'bounty' && team === 'bandit' && camp === this.world.spots.bountyCamp) {
            this.killCount++;
            const need = 4;
            this.active.objective = `یاغی‌های کمپ شرقی را از بین ببر (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(Math.min(this.killCount, need))} از ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(need)})`;
            if (this.killCount >= need) this.complete();
        } else if (id === 'farmraid' && team === 'bandit' && camp === 4) {
            this.killCount++;
            const need = 6;
            this.active.objective = `راهزنان مزرعه را از پا درآور (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(Math.min(this.killCount, need))} از ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(need)})`;
            if (this.killCount >= need) this.complete();
        } else if (id === 'duel' && team === 'duelist') {
            this.killCount++;
            if (this.killCount >= 3) this.complete();
        }
        void pos;
    }
    startMission(def) {
        if (this.active) this.fail('مأموریت دیگری فعال است');
        this.active = {
            def,
            stage: 'start',
            timer: 0,
            data: {},
            target: null,
            objective: def.title
        };
        for (const gm of this.giverMarkers)gm.mesh.visible = false;
        this.killCount = 0;
        this.cpIndex = 0;
        switch(def.id){
            case 'delivery':
                {
                    this.active.stage = 'pickup';
                    this.active.target = def.giver;
                    this.active.objective = 'مرسوله را از اداره پست بگیر';
                    this.active.timer = 160;
                    break;
                }
            case 'bounty':
                {
                    const camp = this.world.camps[this.world.spots.bountyCamp];
                    this.active.stage = 'hunt';
                    this.active.target = {
                        x: camp.x,
                        z: camp.z
                    };
                    this.active.objective = 'یاغی‌های کمپ شرقی را از بین ببر (۰ از ۴)';
                    break;
                }
            case 'race':
                {
                    this.active.stage = 'race';
                    this.active.timer = 115;
                    this.cpIndex = 0;
                    const cp = this.world.spots.raceCp[0];
                    this.active.target = cp;
                    this.active.objective = 'از ایستگاه‌های کنترل عبور کن (۱ از ۸)';
                    break;
                }
            case 'duel':
                {
                    const spot = this.world.spots.duelSpot;
                    this.combat.spawnDuelists(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](spot.x, 0, spot.z));
                    this.active.stage = 'fight';
                    this.active.target = spot;
                    this.active.objective = 'هر سه تیرانداز را شکست بده (۰ از ۳)';
                    break;
                }
            case 'escape':
                {
                    this.combat.setHeatForEscape();
                    this.combat.forceSpawnCops(3);
                    this.active.stage = 'survive';
                    this.active.timer = 75;
                    this.active.target = null;
                    this.active.objective = '۷۵ ثانیه زنده بمان!';
                    break;
                }
            case 'farmraid':
                {
                    this.active.stage = 'hunt';
                    this.active.target = this.world.spots.farm;
                    this.active.objective = 'راهزنان مزرعه را از پا درآور (۰ از ۶)';
                    break;
                }
            case 'convoy':
                {
                    this.active.stage = 'pickup';
                    this.active.target = def.giver;
                    this.active.timer = 190;
                    this.active.objective = 'بار غله را از مزرعه بردار';
                    break;
                }
            case 'treasure':
                {
                    this.active.stage = 'seek';
                    this.active.target = this.world.spots.treasureSpot;
                    this.active.objective = 'به دکل رادیوی بیابان برس و گنج را بکاو';
                    break;
                }
        }
        this.sfx.checkpoint();
        this.updateBeacons();
    }
    fail(reason) {
        const def = this.active?.def;
        this.active = null;
        this.targetBeacon.visible = false;
        this.cpBeacon.visible = false;
        for (const gm of this.giverMarkers)gm.mesh.visible = true;
        this.sfx.jingleFail();
        this.onFail?.(def, reason);
    }
    complete() {
        const def = this.active.def;
        this.player.money += def.reward;
        this.active = null;
        this.targetBeacon.visible = false;
        this.cpBeacon.visible = false;
        for (const gm of this.giverMarkers)gm.mesh.visible = true;
        this.sfx.jingleWin();
        this.onComplete?.(def);
    }
    updateBeacons() {
        if (!this.active) {
            this.targetBeacon.visible = false;
            this.cpBeacon.visible = false;
            return;
        }
        if (this.active.def.id === 'race') {
            const cp = this.world.spots.raceCp[this.cpIndex];
            this.cpBeacon.visible = true;
            this.cpBeacon.position.set(cp.x, 20, cp.z);
            this.targetBeacon.visible = false;
        } else if (this.active.target) {
            this.targetBeacon.visible = true;
            this.targetBeacon.position.set(this.active.target.x, 30, this.active.target.z);
            this.cpBeacon.visible = false;
        } else {
            this.targetBeacon.visible = false;
            this.cpBeacon.visible = false;
        }
    }
    update(dt, playerPos, time) {
        // pulse markers
        const pulse = 0.7 + Math.sin(time * 3) * 0.25;
        for (const gm of this.giverMarkers){
            if (gm.mesh.visible) {
                ;
                gm.mesh.material.opacity = 0.22 * pulse;
                gm.mesh.rotation.y += dt * 0.5;
            }
        }
        ;
        this.targetBeacon.material.opacity = 0.24 * pulse;
        this.cpBeacon.material.opacity = 0.3 * pulse;
        this.cpBeacon.rotation.y -= dt * 0.8;
        if (!this.active) {
            // check giver proximity → offer (engine handles UI)
            return;
        }
        const m = this.active;
        const def = m.def;
        const dist = (p)=>Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
        switch(def.id){
            case 'delivery':
                {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        this.fail('وقت تمام شد');
                        return;
                    }
                    if (m.stage === 'pickup' && dist(def.giver) < 4) {
                        m.stage = 'deliver';
                        m.target = this.world.spots.deliveryDrop;
                        m.objective = 'مرسوله را به سالون سنگ‌سرخ برسان';
                        this.sfx.checkpoint();
                    } else if (m.stage === 'deliver' && dist(m.target) < 5) {
                        this.complete();
                        return;
                    }
                    break;
                }
            case 'bounty':
                {
                    break;
                }
            case 'race':
                {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        this.fail('وقت تمام شد');
                        return;
                    }
                    const cp = this.world.spots.raceCp[this.cpIndex];
                    if (dist(cp) < 9) {
                        this.cpIndex++;
                        this.sfx.checkpoint();
                        if (this.cpIndex >= this.world.spots.raceCp.length) {
                            this.complete();
                            return;
                        }
                        const next = this.world.spots.raceCp[this.cpIndex];
                        m.target = next;
                        m.objective = `از ایستگاه‌های کنترل عبور کن (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(this.cpIndex + 1)} از ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(this.world.spots.raceCp.length)})`;
                        this.updateBeacons();
                    }
                    break;
                }
            case 'duel':
                {
                    break;
                }
            case 'escape':
                {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        this.complete();
                        return;
                    }
                    m.objective = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(Math.ceil(m.timer))} ثانیه زنده بمان!`;
                    // keep pressure
                    if (Math.random() < dt * 0.25) this.combat.spawnCop(playerPos);
                    break;
                }
            case 'convoy':
                {
                    m.timer -= dt;
                    if (m.timer <= 0) {
                        this.fail('وقت تمام شد');
                        return;
                    }
                    if (m.stage === 'pickup' && dist(def.giver) < 5) {
                        m.stage = 'deliver';
                        m.target = this.world.spots.cityDepot;
                        m.objective = 'غله را به انبار غربی شهر برسان';
                        this.sfx.checkpoint();
                    } else if (m.stage === 'deliver' && dist(m.target) < 6) {
                        this.complete();
                        return;
                    }
                    break;
                }
            case 'treasure':
                {
                    if (m.stage === 'seek' && dist(m.target) < 7) {
                        m.objective = 'گنج پیدا شد!';
                        this.complete();
                        return;
                    }
                    break;
                }
        }
        this.updateBeacons();
        void __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"];
    }
    /** current target for minimap */ mapTarget() {
        if (!this.active) return null;
        if (this.active.def.id === 'race') {
            const cp = this.world.spots.raceCp[this.cpIndex];
            return {
                x: cp.x,
                z: cp.z,
                t: 'cp'
            };
        }
        if (this.active.target) return {
            x: this.active.target.x,
            z: this.active.target.z,
            t: 'target'
        };
        return null;
    }
    objective() {
        if (!this.active) return null;
        return {
            text: this.active.objective,
            timer: this.active.timer > 0 ? this.active.timer : null
        };
    }
    giverNear(playerPos) {
        if (this.active) return null;
        for (const def of this.defs){
            if (Math.hypot(def.giver.x - playerPos.x, def.giver.z - playerPos.z) < 3.4) return def;
        }
        return null;
    }
    dispose() {
        for (const gm of this.giverMarkers)this.scene.remove(gm.mesh);
        this.scene.remove(this.targetBeacon);
        this.scene.remove(this.cpBeacon);
    }
}
}),
"[project]/src/game/hud.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Hud",
    ()=>Hud
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
const CSS = `
.lshud{position:absolute;inset:0;overflow:hidden;pointer-events:none;font-family:Vazirmatn,Tahoma,sans-serif;
  color:#f0e8d8;user-select:none;-webkit-user-select:none;direction:rtl;z-index:5}
.lshud .panel{background:rgba(12,14,18,.78);border:1px solid rgba(232,182,76,.35);border-radius:14px;
  backdrop-filter:blur(6px);box-shadow:0 8px 30px rgba(0,0,0,.45)}
.lshud button{pointer-events:auto;cursor:pointer;font-family:inherit}
.btn{background:linear-gradient(180deg,#e8b64c,#c8922e);color:#241a08;border:none;border-radius:12px;
  padding:12px 34px;font-size:18px;font-weight:800;box-shadow:0 4px 14px rgba(0,0,0,.4);transition:transform .12s,filter .12s}
.btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
.btn:active{transform:translateY(1px)}
.btn.ghost{background:rgba(240,232,216,.12);color:#f0e8d8;border:1px solid rgba(240,232,216,.35)}
.btn.small{padding:8px 18px;font-size:15px;border-radius:10px}
/* vitals */
.vitals{position:absolute;top:14px;right:16px;display:flex;flex-direction:column;gap:7px;align-items:flex-end}
.vitals .row{display:flex;gap:8px;align-items:center}
.bar{width:190px;height:14px;border-radius:7px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.25);overflow:hidden}
.bar>i{display:block;height:100%;border-radius:7px;transition:width .18s}
.bar.hp>i{background:linear-gradient(90deg,#58c470,#8ae098)}
.bar.st>i{background:linear-gradient(90deg,#c8a83a,#e8cc70)}
.money{font-size:21px;font-weight:900;color:#ffd76a;text-shadow:0 2px 6px rgba(0,0,0,.7)}
.stars{font-size:20px;letter-spacing:3px;color:#3a3a3a;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.stars b{color:#ffd24a;text-shadow:0 0 10px rgba(255,190,60,.9)}
.wpn{font-size:14px;background:rgba(0,0,0,.5);padding:5px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.16)}
.speedo{font-size:15px;font-weight:800;color:#bfe6ff;background:rgba(0,0,0,.5);padding:4px 12px;border-radius:9px}
/* objective */
.objective{position:absolute;top:14px;left:50%;transform:translateX(-50%);text-align:center;min-width:280px;padding:9px 20px}
.objective .t{font-size:15.5px;font-weight:700}
.objective .timer{font-size:14px;color:#ffd76a;font-weight:800}
/* minimap */
.mapwrap{position:absolute;bottom:14px;left:14px;width:178px;height:178px;border-radius:50%;
  border:3px solid rgba(240,225,190,.55);overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.55),inset 0 0 30px rgba(0,0,0,.4)}
.mapwrap canvas{width:100%;height:100%;display:block}
/* crosshair */
.xhair{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26px;height:26px;opacity:0;transition:opacity .12s}
.xhair i{position:absolute;background:#f8f4e8;box-shadow:0 0 3px rgba(0,0,0,.8)}
.xhair .h{width:9px;height:2px;top:12px}.xhair .v{width:2px;height:9px;left:12px}
.xhair .l{left:0}.xhair .r{right:0}.xhair .t{top:0}.xhair .b{bottom:0}
/* prompt + toasts */
.prompt{position:absolute;bottom:20%;left:50%;transform:translateX(-50%);font-size:16px;font-weight:700;
  background:rgba(10,12,16,.72);padding:9px 20px;border-radius:11px;border:1px solid rgba(232,182,76,.4);opacity:0;transition:opacity .15s}
.prompt b{color:#ffd76a}
.toasts{position:absolute;bottom:110px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center}
.toast{padding:9px 22px;border-radius:11px;font-size:15px;font-weight:700;background:rgba(10,12,16,.82);
  border:1px solid rgba(255,255,255,.25);animation:toastIn .25s ease-out;white-space:nowrap}
.toast.gold{color:#ffd76a;border-color:rgba(232,182,76,.55)}
.toast.bad{color:#ff8a7a;border-color:rgba(255,90,70,.5)}
@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
/* damage vignette */
.dmg{position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(ellipse at center,transparent 55%,rgba(160,10,10,.55) 100%)}
/* fullscreen menus */
.overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:auto;
  background:rgba(5,6,10,.62);backdrop-filter:blur(4px)}
.card{padding:30px 38px;max-width:min(520px,92vw);text-align:center;max-height:88vh;overflow-y:auto}
.title{font-size:52px;font-weight:950;line-height:1.15;color:#ffd76a;
  text-shadow:0 3px 0 #7a4a10,0 10px 34px rgba(0,0,0,.7);letter-spacing:1px}
.subtitle{font-size:16px;color:#d8ccb2;margin:6px 0 22px}
.mrow{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.kv{display:flex;justify-content:space-between;gap:18px;padding:7px 4px;border-bottom:1px dashed rgba(255,255,255,.14);font-size:14.5px}
.kv b{color:#ffd76a}
.seg{display:inline-flex;border:1px solid rgba(255,255,255,.3);border-radius:10px;overflow:hidden}
.seg button{background:transparent;color:#e8dfc8;border:none;padding:8px 16px;font-size:14px;font-weight:700}
.seg button.on{background:#e8b64c;color:#241a08}
.err{color:#ff9a8a;font-size:14px;min-height:20px;margin-top:6px}
/* touch */
.touch{position:absolute;inset:0;display:none}
.touch.on{display:block}
.tbtn{position:absolute;border-radius:50%;background:rgba(20,22,28,.5);border:2px solid rgba(255,255,255,.4);
  color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;
  pointer-events:auto;touch-action:none;text-shadow:0 1px 3px #000}
.tbtn:active,.tbtn.hold{background:rgba(232,182,76,.55)}
.tbtn.fire{width:88px;height:88px;right:26px;bottom:34px;background:rgba(160,40,30,.55);font-size:17px;border-color:rgba(255,140,110,.6)}
.tbtn.aim{width:62px;height:62px;right:36px;bottom:140px}
.tbtn.enter{width:64px;height:64px;right:132px;bottom:52px;font-size:13px}
.tbtn.jump{width:56px;height:56px;right:140px;bottom:138px}
.tbtn.wpn{width:50px;height:50px;right:30px;bottom:222px}
.tbtn.sprint{width:50px;height:50px;right:118px;bottom:212px}
.tbtn.sprint.on{background:rgba(90,160,80,.6)}
.stick{position:absolute;width:120px;height:120px;border-radius:50%;border:2px solid rgba(255,255,255,.35);
  background:rgba(20,22,28,.35);pointer-events:none;display:none}
.stick i{position:absolute;width:52px;height:52px;border-radius:50%;background:rgba(240,230,210,.55);
  left:34px;top:34px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.pausebtn{position:absolute;top:14px;left:16px;width:42px;height:42px;border-radius:11px;font-size:18px;
  background:rgba(12,14,18,.7);border:1px solid rgba(255,255,255,.3);color:#f0e8d8;pointer-events:auto}
`;
class Hud {
    input;
    cbs;
    world;
    root;
    hpBar;
    stBar;
    moneyEl;
    starsEl;
    wpnEl;
    speedo;
    objEl;
    objText;
    objTimer;
    xhair;
    promptEl;
    toastsEl;
    dmgEl;
    mapCanvas;
    staticMap;
    touchEl;
    stickEl;
    stickKnob;
    enterBtn;
    sprintBtn;
    aimBtn;
    overlays;
    lastCache;
    promptTimeout;
    constructor(container, input, cbs, world){
        this.input = input;
        this.cbs = cbs;
        this.world = world;
        this.objText = null;
        this.objTimer = null;
        this.overlays = {};
        this.lastCache = {};
        this.promptTimeout = null;
        this.lastQuality = 'high';
        this.lastMuted = false;
        const style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);
        this.root = document.createElement('div');
        this.root.className = 'lshud';
        container.appendChild(this.root);
        this.build();
        this.buildStaticMap();
        this.bindTouch();
    }
    /* ================= build ================= */ el(tag, cls, parent) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        (parent ?? this.root).appendChild(e);
        return e;
    }
    build() {
        // vitals
        const v = this.el('div', 'vitals');
        const rMoney = this.el('div', 'row', v);
        this.moneyEl = this.el('div', 'money', rMoney);
        this.starsEl = this.el('div', 'stars', rMoney);
        const rHp = this.el('div', 'row', v);
        const hp = this.el('div', 'bar hp', rHp);
        this.hpBar = this.el('i', '', hp);
        const rSt = this.el('div', 'row', v);
        const st = this.el('div', 'bar st', rSt);
        this.stBar = this.el('i', '', st);
        const rW = this.el('div', 'row', v);
        this.wpnEl = this.el('div', 'wpn', rW);
        this.speedo = this.el('div', 'speedo', v);
        this.speedo.style.display = 'none';
        // objective
        this.objEl = this.el('div', 'objective panel');
        this.objEl.style.display = 'none';
        this.objText = this.el('div', 't', this.objEl);
        this.objTimer = this.el('div', 'timer', this.objEl);
        // minimap
        const mw = this.el('div', 'mapwrap');
        this.mapCanvas = document.createElement('canvas');
        this.mapCanvas.width = 356;
        this.mapCanvas.height = 356;
        mw.appendChild(this.mapCanvas);
        // crosshair
        this.xhair = this.el('div', 'xhair');
        for (const cls of [
            'h l',
            'h r',
            'v t',
            'v b'
        ]){
            this.el('i', cls, this.xhair);
        }
        // prompt / toasts / dmg
        this.promptEl = this.el('div', 'prompt');
        this.toastsEl = this.el('div', 'toasts');
        this.dmgEl = this.el('div', 'dmg');
        // touch
        this.touchEl = this.el('div', 'touch');
        this.stickEl = this.el('div', 'stick', this.touchEl);
        this.stickKnob = this.el('i', '', this.stickEl);
        this.mkBtn('fire', 'شلیک', 'fire');
        this.aimBtn = this.mkBtn('aim', 'نشانه', 'aim');
        this.enterBtn = this.mkBtn('enter', 'سوار', 'enter');
        this.mkBtn('jump', 'پرش', 'jump');
        this.mkBtn('wpn', 'اسلحه', 'wpn');
        this.sprintBtn = this.mkBtn('sprint', 'دویدن', 'sprint');
        // pause button
        const pb = this.el('button', 'pausebtn');
        pb.textContent = '❚❚';
        pb.addEventListener('click', ()=>{
            this.input.btnDown('pause');
        });
        pb.style.display = 'none';
        this.overlays.pausebtn = pb;
    }
    mkBtn(name, label, cls) {
        const b = this.el('button', `tbtn ${cls}`, this.touchEl);
        b.textContent = label;
        b.dataset.btn = name;
        b.addEventListener('touchstart', (e)=>{
            e.preventDefault();
            b.classList.add('hold');
            if (name === 'fire') this.input.btnDown('fire');
            else if (name === 'aim') {
                this.input.btnDown('aim');
                this.aimBtn.classList.toggle('on', this.input.aimHeld);
            } else if (name === 'sprint') {
                this.input.btnDown('sprint');
                this.sprintBtn.classList.toggle('on', this.sprintBtn.classList.contains('on') === false);
            } else if (name === 'jump') this.input.btnDown('jump');
            else this.input.btnTap(name);
        }, {
            passive: false
        });
        b.addEventListener('touchend', (e)=>{
            e.preventDefault();
            b.classList.remove('hold');
            if (name === 'fire') this.input.btnUp('fire');
        }, {
            passive: false
        });
        return b;
    }
    bindTouch() {
        window.addEventListener('stick-show', (e)=>{
            const d = e.detail;
            this.stickEl.style.display = 'block';
            this.stickEl.style.left = `${d.x - 60}px`;
            this.stickEl.style.top = `${d.y - 60}px`;
            this.stickKnob.style.transform = 'translate(0,0)';
        });
        window.addEventListener('stick-move', (e)=>{
            const d = e.detail;
            this.stickKnob.style.transform = `translate(${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d.x, -1, 1) * 32}px,${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(d.y, -1, 1) * 32}px)`;
        });
        window.addEventListener('stick-hide', ()=>{
            this.stickEl.style.display = 'none';
        });
    }
    /* ================= static minimap ================= */ buildStaticMap() {
        const S = 0.4 // px per world unit
        ;
        const size = Math.ceil(2400 * S);
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const x = c.getContext('2d');
        const W = (wx)=>(wx + 1200) * S;
        // desert bg
        x.fillStyle = '#a8895c';
        x.fillRect(0, 0, size, size);
        // town dirt
        x.fillStyle = '#b09068';
        x.fillRect(W(-240), W(480), 480 * S, 220 * S);
        // city base
        x.fillStyle = '#7c786e';
        x.fillRect(W(-300), W(-900), 600 * S, 600 * S);
        // roads
        x.strokeStyle = '#3c3d40';
        x.lineCap = 'round';
        for (const r of this.world.minimap.roads){
            x.lineWidth = 14 * S + 2;
            x.beginPath();
            if (r.vert) {
                x.moveTo(W(r.x), W(r.z - r.len / 2));
                x.lineTo(W(r.x), W(r.z + r.len / 2));
            } else {
                x.moveTo(W(r.x - r.len / 2), W(r.z));
                x.lineTo(W(r.x + r.len / 2), W(r.z));
            }
            x.stroke();
        }
        // rects
        for (const r of this.world.minimap.rects){
            if (r.t === 'b') x.fillStyle = 'rgba(60,58,52,.85)';
            else if (r.t === 'r') x.fillStyle = 'rgba(90,74,54,.8)';
            else if (r.t === 't') x.fillStyle = '#8a4a2a';
            else if (r.t === 'w') x.fillStyle = '#4a7a9a';
            else x.fillStyle = '#556b44';
            x.fillRect(W(r.x - r.hw), W(r.z - r.hd), r.hw * 2 * S, r.hd * 2 * S);
        }
        // camps
        for (const cmp of this.world.minimap.camps){
            x.strokeStyle = '#c03020';
            x.lineWidth = 2;
            x.beginPath();
            x.arc(W(cmp.x), W(cmp.z), 9, 0, Math.PI * 2);
            x.stroke();
        }
        this.staticMap = c;
    }
    /* ================= minimap frame ================= */ drawMap(px, pz, camYaw, ents, target, stars) {
        const ctx = this.mapCanvas.getContext('2d');
        const W = this.mapCanvas.width;
        const c = W / 2;
        const pxPerUnit = 0.62;
        const k = pxPerUnit / 0.4;
        ctx.clearRect(0, 0, W, W);
        ctx.save();
        ctx.beginPath();
        ctx.arc(c, c, c - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#1a1c20';
        ctx.fillRect(0, 0, W, W);
        ctx.translate(c, c);
        ctx.rotate(camYaw);
        ctx.translate(-((px + 1200) * 0.4) * k, -((pz + 1200) * 0.4) * k);
        ctx.scale(k, k);
        ctx.drawImage(this.staticMap, 0, 0);
        ctx.restore();
        // entity dots (in rotated space)
        const dot = (wx, wz, color, r)=>{
            const dx = (wx - px) * pxPerUnit;
            const dz = (wz - pz) * pxPerUnit;
            const th = camYaw;
            const rx = dx * Math.cos(th) - dz * Math.sin(th);
            const ry = dx * Math.sin(th) + dz * Math.cos(th);
            if (rx * rx + ry * ry > (c - 8) * (c - 8)) return;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(c + rx, c + ry, r, 0, Math.PI * 2);
            ctx.fill();
        };
        for (const e of ents){
            if (e.t === 'cop') dot(e.x, e.z, '#4a9af0', 4);
            else if (e.t === 'enemy') dot(e.x, e.z, '#e04030', 4);
            else if (e.t === 'pickup') dot(e.x, e.z, '#ffd24a', 3);
        }
        if (target) dot(target.x, target.z, target.t === 'cp' ? '#4ad8ff' : '#ffb02a', 6.5);
        // player arrow
        ctx.save();
        ctx.translate(c, c);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(6.5, 7);
        ctx.lineTo(0, 3.5);
        ctx.lineTo(-6.5, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // wanted border flash
        if (stars > 0) {
            const a = 0.35 + Math.sin(performance.now() * 0.006) * 0.3;
            ctx.strokeStyle = `rgba(255,70,50,${a})`;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(c, c, c - 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    /* ================= dynamic values ================= */ setText(key, e, v) {
        if (this.lastCache[key] !== v) {
            this.lastCache[key] = v;
            e.textContent = v;
        }
    }
    vitals(health, stamina, money, stars, wpn, ammo, reloading, speed) {
        this.hpBar.style.width = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(health, 0, 100)}%`;
        this.stBar.style.width = `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(stamina, 0, 100)}%`;
        this.setText('money', this.moneyEl, `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(money)} دلار`);
        let s = '';
        for(let i = 0; i < 5; i++)s += i < stars ? '<b>★</b>' : '★';
        if (this.lastCache.stars !== s) {
            this.lastCache.stars = s;
            this.starsEl.innerHTML = s;
        }
        this.setText('wpn', this.wpnEl, reloading ? 'در حال پرکردن...' : `${wpn} — ${ammo}`);
        if (speed !== null) {
            this.speedo.style.display = '';
            this.setText('speed', this.speedo, `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(Math.round(Math.abs(speed) * 3.6))} کیلومتر/ساعت`);
        } else {
            this.speedo.style.display = 'none';
        }
    }
    objective(text, timer) {
        if (!text) {
            this.objEl.style.display = 'none';
            return;
        }
        this.objEl.style.display = '';
        this.setText('obj', this.objText, text);
        if (timer !== null) {
            this.objTimer.style.display = '';
            this.setText('objt', this.objTimer, `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(Math.ceil(timer))} ثانیه`);
        } else {
            this.objTimer.style.display = 'none';
        }
    }
    crosshair(on) {
        this.xhair.style.opacity = on ? '0.9' : '0';
    }
    prompt(html) {
        if (!html) {
            if (this.promptEl.style.opacity !== '0') this.promptEl.style.opacity = '0';
            return;
        }
        if (this.promptEl.innerHTML !== html) this.promptEl.innerHTML = html;
        this.promptEl.style.opacity = '1';
    }
    toast(text, type = 'info') {
        const t = this.el('div', `toast ${type === 'info' ? '' : type}`, this.toastsEl);
        t.textContent = text;
        setTimeout(()=>{
            t.style.transition = 'opacity .5s';
            t.style.opacity = '0';
            setTimeout(()=>t.remove(), 550);
        }, 3200);
        while(this.toastsEl.children.length > 4)this.toastsEl.firstChild?.remove();
    }
    damageFlash(strength) {
        this.dmgEl.style.transition = 'none';
        this.dmgEl.style.opacity = String((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])(strength, 0, 0.85));
        requestAnimationFrame(()=>{
            this.dmgEl.style.transition = 'opacity .6s';
            this.dmgEl.style.opacity = '0';
        });
    }
    fadeBlack(on, ms = 500) {
        let f = this.overlays.fade;
        if (!f) {
            f = this.el('div', '');
            f.style.cssText = 'position:absolute;inset:0;background:#000;opacity:0;transition:opacity .5s;pointer-events:none';
            this.overlays.fade = f;
        }
        f.style.transition = `opacity ${ms}ms`;
        requestAnimationFrame(()=>{
            f.style.opacity = on ? '1' : '0';
        });
    }
    setTouchVisible(on) {
        this.touchEl.classList.toggle('on', on);
        this.overlays.pausebtn.style.display = on ? '' : 'none';
    }
    setPlayingUI(on) {
        this.overlays.pausebtn.style.display = on ? this.touchEl.classList.contains('on') ? '' : 'none' : 'none';
    }
    setEnterLabel(label) {
        if (label === null) {
            this.enterBtn.style.display = 'none';
        } else {
            this.enterBtn.style.display = '';
            this.setText('enter', this.enterBtn, label);
        }
    }
    /* ================= overlays ================= */ overlay(id) {
        let o = this.overlays[id];
        if (!o) {
            o = this.el('div', 'overlay');
            this.overlays[id] = o;
        }
        o.innerHTML = '';
        return o;
    }
    hideAll() {
        for (const k of Object.keys(this.overlays)){
            if (k !== 'fade' && k !== 'pausebtn') {
                const o = this.overlays[k];
                if (o && o.style.display !== 'none') o.style.display = 'none';
            }
        }
    }
    showStart(quality, muted) {
        const o = this.overlay('start');
        o.style.display = '';
        const card = this.el('div', 'panel card', o);
        this.el('div', 'title', card).textContent = 'لاس سومبرا';
        this.el('div', 'subtitle', card).textContent = 'جایی که خیابان‌های شهر به مرزِ بی‌قانون می‌رسد';
        const desc = this.el('div', 'subtitle', card);
        desc.style.fontSize = '13.5px';
        desc.textContent = 'دنیای باز سه‌بعدی — ماشین‌سواری و تعقیب‌وگریز در شهر، اسب‌سواری و شش‌لول در بیابان';
        const start = this.el('button', 'btn', card);
        start.textContent = 'شروع بازی';
        start.onclick = ()=>this.cbs.onStart();
        const row = this.el('div', 'mrow', card);
        const help = this.el('button', 'btn ghost small', row);
        help.textContent = 'راهنما';
        help.onclick = ()=>this.showHelp('start');
        // quality
        const qrow = this.el('div', 'mrow', card);
        this.el('span', '', qrow).textContent = 'کیفیت گرافیک: ';
        const seg = this.el('div', 'seg', qrow);
        for (const [val, label] of [
            [
                'low',
                'ساده'
            ],
            [
                'med',
                'متعادل'
            ],
            [
                'high',
                'عالی'
            ]
        ]){
            const b = this.el('button', quality === val ? 'on' : '', seg);
            b.textContent = label;
            b.onclick = ()=>{
                this.cbs.onQuality(val);
                for (const bb of Array.from(seg.children))bb.classList.remove('on');
                b.classList.add('on');
            };
        }
        const srow = this.el('div', 'mrow', card);
        const sb = this.el('button', 'btn ghost small', srow);
        sb.textContent = muted ? 'صدا: خاموش' : 'صدا: روشن';
        sb.onclick = ()=>{
            this.cbs.onToggleSound();
            sb.textContent = sb.textContent?.includes('خاموش') ? 'صدا: روشن' : 'صدا: خاموش';
        };
        const credit = this.el('div', 'subtitle', card);
        credit.style.cssText = 'margin-top:18px;font-size:12px;opacity:.7';
        credit.textContent = 'ساخته‌شده با Three.js — برای ویندوز و اندروید (مرورگر)';
    }
    showHelp(back) {
        const o = this.overlay('help');
        o.style.display = '';
        const card = this.el('div', 'panel card', o);
        const h = this.el('div', 'title', card);
        h.style.fontSize = '28px';
        h.textContent = 'راهنمای بازی';
        const grid = this.el('div', '', card);
        grid.style.cssText = 'text-align:right;margin:16px 0';
        const rows = [
            [
                'W A S D / اهرم لمسی',
                'حرکت'
            ],
            [
                'ماوس / کشیدن انگشت (سمت راست)',
                'دوربین'
            ],
            [
                'کلیک چپ / دکمه شلیک',
                'شلیک'
            ],
            [
                'کلیک راست / دکمه نشانه',
                'نشانه‌گیری'
            ],
            [
                'F (یا E) / دکمه سوار',
                'سوار/پیاده شدن از ماشین و اسب'
            ],
            [
                'Shift / دکمه دویدن',
                'دویدن (پیاده) — گالوپ (اسب)'
            ],
            [
                'Space',
                'پرش — ترمزدست (ماشین)'
            ],
            [
                'R',
                'پرکردن خشاب'
            ],
            [
                '1 2 3 یا Q',
                'تعویض سلاح'
            ],
            [
                'H',
                'بوق ماشین'
            ],
            [
                'Esc / دکمه ❚❚',
                'توقف بازی'
            ]
        ];
        for (const [k, v] of rows){
            const r = this.el('div', 'kv', grid);
            r.innerHTML = `<b>${k}</b><span>${v}</span>`;
        }
        const tip = this.el('div', 'subtitle', card);
        tip.style.cssText = 'font-size:13px;text-align:right';
        tip.textContent = 'نشانگرهای طلایی روی نقشه = محل مأموریت‌ها. داخل دایره قرمز نقشه، کمپ یاغی‌هاست. با ضربه زدن به مغازه اسلحه می‌توانی تجهیزات بخری.';
        const row = this.el('div', 'mrow', card);
        const back2 = this.el('button', 'btn small', row);
        back2.textContent = 'بازگشت';
        back2.onclick = ()=>{
            if (back === 'start') this.showStart(this.lastQuality ?? 'high', this.lastMuted);
            else this.showPause();
        };
    }
    lastQuality;
    lastMuted;
    showPause() {
        const o = this.overlay('pause');
        o.style.display = '';
        const card = this.el('div', 'panel card', o);
        const h = this.el('div', 'title', card);
        h.style.fontSize = '34px';
        h.textContent = 'توقف';
        const row = this.el('div', 'mrow', card);
        const resume = this.el('button', 'btn', row);
        resume.textContent = 'ادامه بازی';
        resume.onclick = ()=>this.cbs.onResume();
        const row2 = this.el('div', 'mrow', card);
        const help = this.el('button', 'btn ghost small', row2);
        help.textContent = 'راهنما';
        help.onclick = ()=>this.showHelp('pause');
        const restart = this.el('button', 'btn ghost small', row2);
        restart.textContent = 'شروع دوباره';
        restart.onclick = ()=>this.cbs.onRestart();
    }
    showDeath(fee) {
        const o = this.overlay('death');
        o.style.display = '';
        o.style.background = 'rgba(40,4,4,.55)';
        const card = this.el('div', 'panel card', o);
        const h = this.el('div', 'title', card);
        h.style.fontSize = '40px';
        h.style.color = '#ff8a7a';
        h.textContent = 'از نفس افتادی...';
        const sub = this.el('div', 'subtitle', card);
        sub.textContent = `درمانگاه تو را جمع کرد — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(fee)} دلار جریمه`;
        const row = this.el('div', 'mrow', card);
        const b = this.el('button', 'btn', row);
        b.textContent = 'بازگشت';
        b.onclick = ()=>this.cbs.onResume();
    }
    showMissionOffer(def) {
        const o = this.overlay('mission');
        o.style.display = '';
        const card = this.el('div', 'panel card', o);
        const h = this.el('div', 'title', card);
        h.style.fontSize = '30px';
        h.textContent = def.title;
        const d = this.el('div', 'subtitle', card);
        d.textContent = def.desc;
        const rw = this.el('div', 'money', card);
        rw.style.fontSize = '24px';
        rw.textContent = `جایزه: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(def.reward)} دلار`;
        const row = this.el('div', 'mrow', card);
        const ok = this.el('button', 'btn', row);
        ok.textContent = 'قبول می‌کنم';
        ok.onclick = ()=>this.cbs.onAccept(def.id);
        const no = this.el('button', 'btn ghost', row);
        no.textContent = 'بی‌خیال';
        no.onclick = ()=>this.cbs.onDecline();
    }
    showShop(owned, prices, canBuyAmmo, ammoLabel) {
        const o = this.overlay('shop');
        o.style.display = '';
        const card = this.el('div', 'panel card', o);
        const h = this.el('div', 'title', card);
        h.style.fontSize = '28px';
        h.textContent = 'مغازه اسلحه';
        const err = this.el('div', 'err', card);
        const list = this.el('div', '', card);
        list.style.cssText = 'text-align:right;margin:12px 0';
        const mkRow = (label, price, cb, disabled)=>{
            const r = this.el('div', 'kv', list);
            r.innerHTML = `<b>${label}</b><span>${price}</span>`;
            const b = this.el('button', 'btn small', r);
            b.style.marginRight = '10px';
            b.textContent = 'خرید';
            b.onclick = ()=>{
                const e = cb();
                if (e) err.textContent = e;
                else err.textContent = '';
            };
            if (disabled) b.style.display = 'none';
        };
        if (!owned[1]) mkRow('کلت برنی', `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(prices.pistol)} دلار`, ()=>this.cbs.onBuyWeapon(1), false);
        if (!owned[2]) mkRow('شاهین ۷۰۸ (تفنگ)', `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(prices.rifle)} دلار`, ()=>this.cbs.onBuyWeapon(2), false);
        mkRow(ammoLabel, '', ()=>this.cbs.onBuyAmmo(), false);
        mkRow('بسته سلامتی (کامل)', '۳۰ دلار', ()=>this.cbs.onBuyHealth(), false);
        const row = this.el('div', 'mrow', card);
        const b = this.el('button', 'btn', row);
        b.textContent = 'خروج';
        b.onclick = ()=>this.cbs.onDecline();
    }
    hideOverlays() {
        this.hideAll();
    }
    showHelpFromStart() {
        this.showHelp('start');
    }
    dispose() {
        this.root.remove();
        document.querySelectorAll('style').forEach((s)=>{
            if (s.textContent?.includes('.lshud{')) s.remove();
        });
    }
}
}),
"[project]/src/game/engine.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Game",
    ()=>Game
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$world$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/world.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$audio$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/audio.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$input$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/input.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$particles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/particles.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$vehicles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/vehicles.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$player$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/player.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$combat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/combat.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$missions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/missions.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$hud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/hud.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/game/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
const SAVE_KEY = 'lasombra_save_v1';
class Game {
    container;
    renderer;
    scene;
    camera;
    clock;
    raf;
    disposed;
    world;
    sfx;
    input;
    particles;
    vehicles;
    player;
    combat;
    missions;
    hud;
    quality;
    timeHour;
    dayLength;
    time;
    started;
    paused;
    menuOpen;
    lastSave;
    policeSpawnT;
    markerCd;
    respawnPending;
    // sky
    skyMat;
    stars;
    starsMat;
    moon;
    sunLight;
    hemi;
    clouds;
    constructor(container){
        this.container = container;
        this.scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Scene"]();
        this.clock = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Clock"]();
        this.raf = 0;
        this.disposed = false;
        this.sfx = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$audio$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sfx"]();
        this.timeHour = 9.4;
        this.dayLength = 520;
        this.time = 0;
        this.started = false;
        this.paused = false;
        this.menuOpen = false;
        this.lastSave = 0;
        this.policeSpawnT = 0;
        this.markerCd = 0;
        this.respawnPending = false;
        this.clouds = [];
        /* ================= loop ================= */ this.onResize = ()=>{
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
        };
        this.onVis = ()=>{
            if (document.hidden && this.started && !this.paused) this.pause();
        };
        this.tmpV = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.loop = ()=>{
            if (this.disposed) return;
            this.raf = requestAnimationFrame(this.loop);
            const dt = Math.min(0.05, this.clock.getDelta());
            if (!this.started || this.paused) {
                // still render menu backdrop
                this.updateSky(0.0001);
                this.renderer.render(this.scene, this.camera);
                return;
            }
            this.time += dt;
            this.timeHour = (this.timeHour + dt * 24 / this.dayLength) % 24;
            this.markerCd = Math.max(0, this.markerCd - dt);
            const inVehicle = this.vehicles.playerVehicle;
            // one-shot inputs
            if (this.input.consume('enter') && !this.player.dead) {
                if (inVehicle) {
                    const out = this.vehicles.exit();
                    if (out) {
                        this.player.pos.copy(out.pos);
                        this.player.pos.y = 0;
                        this.sfx.door();
                    }
                } else {
                    const v = this.vehicles.nearest(this.player.pos, 4.6);
                    if (v) {
                        this.vehicles.enter(v);
                        if (v.kind === 'horse') this.sfx.neigh();
                        else this.sfx.door();
                    }
                }
            }
            if (this.input.consume('reload')) this.combat.reload();
            if (this.input.consume('w1')) this.combat.switchWeapon(0);
            if (this.input.consume('w2')) this.combat.switchWeapon(1);
            if (this.input.consume('w3')) this.combat.switchWeapon(2);
            if (this.input.consume('wcycle')) this.combat.cycleWeapon();
            if (this.input.consume('horn') && inVehicle?.kind === 'car') this.sfx.horn();
            if (this.input.consume('sprint-toggle')) this.player.sprintToggle = !this.player.sprintToggle;
            if (this.vehicles.playerVehicle) this.vehicles.playerVehicle.gallopToggle = this.player.sprintToggle;
            // updates
            this.player.update(dt, this.input, this.camera, this.time, inVehicle);
            this.vehicles.update(dt, this.player.pos, this.nightFactor, !!inVehicle);
            this.combat.update(dt, this.player.pos, this.player.speed, this.camera, this.time, inVehicle);
            this.missions.update(dt, this.player.pos, this.time);
            this.particles.update(dt);
            this.world.update(this.nightFactor, dt);
            this.updateSky(dt);
            // fire (on foot)
            if (this.input.fireHeld && !inVehicle && !this.player.dead) {
                this.combat.tryFire(this.camera, this.player.pos, this.time, this.input.isTouch);
            }
            // engine sound
            if (inVehicle?.kind === 'car') {
                const throttle = this.input.move.y;
                this.sfx.engineUpdate(inVehicle.speed, throttle, true);
            } else {
                this.sfx.engineUpdate(0, 0, false);
            }
            // police cars cadence
            const desiredCars = this.combat.stars >= 4 ? 3 : this.combat.stars >= 2 ? 2 : this.combat.stars >= 1 ? 1 : 0;
            const aliveCops = this.vehicles.list.filter((v)=>v.isPolice && !v.dead && v.chase).length;
            if (aliveCops < desiredCars) {
                this.policeSpawnT -= dt;
                if (this.policeSpawnT <= 0) {
                    this.policeSpawnT = 5;
                    this.vehicles.spawnPolice(this.player.pos);
                }
            }
            // siren
            const chasing = this.vehicles.list.some((v)=>v.isPolice && !v.dead && v.chase && v.pos.distanceToSquared(this.player.pos) < 130 * 130);
            if (chasing) this.sfx.sirenOn();
            else this.sfx.sirenOff();
            // wind
            this.sfx.windUpdate(this.player.speed + (inVehicle ? Math.abs(inVehicle.speed) * 0.7 : 0), this.nightFactor > 0.6);
            // campfire ambience particles
            if (this.quality !== 'low') {
                for (const fp of this.world.firePoints){
                    if (fp.distanceToSquared(this.player.pos) < 90 * 90 && Math.random() < dt * 22) {
                        this.particles.spawn(fp.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](rand2(-0.2, 0.2), rand2(0, 0.3), rand2(-0.2, 0.2))), {
                            additive: true,
                            color: 0xff8a30,
                            life: rand2(0.5, 1),
                            size: 0.9,
                            sizeEnd: 0.2,
                            vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](rand2(-0.3, 0.3), rand2(1.4, 2.4), rand2(-0.3, 0.3))
                        });
                        if (Math.random() < 0.25) {
                            this.particles.spawn(fp.clone().add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0)), {
                                color: 0x555550,
                                life: rand2(1.5, 2.5),
                                size: 0.8,
                                sizeEnd: 2.6,
                                vel: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](rand2(-0.2, 0.2), rand2(1, 1.8), rand2(-0.2, 0.2))
                            });
                        }
                    }
                }
            }
            // markers (mission giver / shop) auto-open
            this.checkMarkers();
            // HUD
            const wpn = this.combat.hudWeapon();
            this.hud.vitals(this.player.health, this.player.stamina, this.player.money, this.combat.stars, wpn.name, `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(wpn.mag)} / ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(wpn.reserve)}`, wpn.reloading, inVehicle ? inVehicle.speed : null);
            const obj = this.missions.objective();
            this.hud.objective(obj?.text ?? null, obj?.timer ?? null);
            this.hud.crosshair(this.player.aiming && !inVehicle);
            this.updatePrompt();
            this.hud.drawMap(this.player.pos.x, this.player.pos.z, this.player.camYaw, this.combat.mapEntities(), this.missions.mapTarget(), this.combat.stars);
            // autosave
            if (this.time - this.lastSave > 6) {
                this.lastSave = this.time;
                this.persist();
            }
            this.renderer.render(this.scene, this.camera);
        };
        this.nightFactor = 0;
        /* ---------- quality ---------- */ const saved = this.loadSave();
        const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
        this.quality = saved.quality ?? (isTouch ? 'low' : 'high');
        /* ---------- renderer ---------- */ let renderer;
        try {
            renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
                antialias: this.quality !== 'low',
                powerPreference: 'high-performance'
            });
        } catch  {
            this.showWebglError();
            throw new Error('WebGL not available');
        }
        this.renderer = renderer;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === 'low' ? 1 : this.quality === 'med' ? 1.5 : 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = this.quality !== 'low';
        renderer.shadowMap.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PCFShadowMap"];
        renderer.toneMapping = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ACESFilmicToneMapping"];
        renderer.toneMappingExposure = 1.05;
        renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;touch-action:none';
        container.appendChild(renderer.domElement);
        this.camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PerspectiveCamera"](70, container.clientWidth / container.clientHeight, 0.4, 2000);
        this.scene.fog = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fog"](0xc8dde8, 60, this.quality === 'low' ? 340 : this.quality === 'med' ? 460 : 580);
        /* ---------- world & systems ---------- */ this.world = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$world$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["World"](this.quality);
        this.scene.add(this.world.group);
        this.buildSky();
        this.particles = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$particles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Particles"](this.scene);
        this.input = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$input$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Input"](renderer.domElement, ()=>this.togglePause());
        this.hud = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$hud$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Hud"](container, this.input, {
            onStart: ()=>this.startGame(),
            onResume: ()=>{
                if (this.player?.dead) this.respawn();
                else this.resume();
            },
            onRestart: ()=>{
                location.reload();
            },
            onAccept: (id)=>{
                const def = this.missions.defs.find((d)=>d.id === id);
                if (def) {
                    this.missions.startMission(def);
                    this.menuOpen = false;
                    this.resume();
                }
            },
            onDecline: ()=>{
                this.menuOpen = false;
                this.resume();
            },
            onBuyWeapon: (i)=>this.combat.buyWeapon(i),
            onBuyAmmo: ()=>this.combat.buyAmmo(),
            onBuyHealth: ()=>this.combat.buyHealth(),
            onQuality: (q)=>{
                this.quality = q;
                this.persist();
            },
            onToggleSound: ()=>{
                this.sfx.setMuted(!this.sfx.muted);
                this.persist();
            }
        }, this.world);
        this.hud.lastQuality = this.quality;
        this.hud.lastMuted = false;
        this.vehicles = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$vehicles$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vehicles"](this.scene, this.world, this.sfx, this.particles, this.input, this.quality);
        this.player = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$player$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Player"](this.scene, this.world, this.vehicles, this.sfx, this.world.spots.start);
        this.combat = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$combat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Combat"](this.scene, this.world, this.sfx, this.particles, this.vehicles, this.player, this.quality);
        this.missions = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$missions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Missions"](this.scene, this.world, this.combat, this.vehicles, this.player, this.sfx);
        /* ---------- hooks ---------- */ this.vehicles.hooks = {
            onJack: ()=>{
                this.combat.addCrime(28, this.time);
            },
            onPedHit: (pos, speed, byPlayer)=>{
                if (byPlayer) this.combat.onVehicleHitPed(pos, speed);
            },
            onExplosion: (pos)=>this.combat.onExplosion(pos),
            deployCops: (pos)=>{
                if (this.combat.stars > 0) this.combat.spawnCop(pos);
            },
            crash: ()=>{}
        };
        this.combat.hooks = {
            onKill: (team, pos, camp)=>this.missions.notifyKill(team, pos, camp),
            onStarsChange: ()=>{},
            onPlayerDeath: ()=>this.onDeath()
        };
        this.missions.onComplete = (def)=>{
            this.hud.toast(`مأموریت کامل شد — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(def.reward)} دلار`, 'gold');
        };
        this.missions.onFail = (_def, reason)=>this.hud.toast(`مأموریت ناتمام ماند: ${reason}`, 'bad');
        // load save into player/combat
        if (saved.money !== undefined) this.player.money = saved.money;
        if (saved.weapons) {
            saved.weapons.forEach((w, i)=>{
                if (this.combat.weapons[i]) {
                    Object.assign(this.combat.weapons[i], {
                        owned: w.owned,
                        mag: w.mag,
                        reserve: w.reserve
                    });
                }
            });
        }
        if (saved.current !== undefined && this.combat.weapons[saved.current]?.owned) {
            this.combat.current = saved.current;
        }
        if (saved.muted) this.sfx.setMuted(true);
        this.vehicles.spawnAll();
        this.combat.spawnBandits();
        this.combat.spawnCivilians();
        // events
        window.addEventListener('resize', this.onResize);
        document.addEventListener('visibilitychange', this.onVis);
        renderer.domElement.addEventListener('click', ()=>{
            if (this.started && !this.paused && !this.input.isTouch && !this.input.pointerLocked) this.input.requestLock();
        });
        this.hud.setTouchVisible(this.input.isTouch);
        this.hud.showStart(this.quality, this.sfx.muted);
        window.__game = this;
        // fire lights for camps handled by world; ambient loop
        this.loop();
    }
    showWebglError() {
        const d = document.createElement('div');
        d.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;background:#111;font-family:Tahoma;z-index:99;text-align:center;padding:20px';
        d.textContent = 'مرورگر شما از WebGL پشتیبانی نمی‌کند. لطفاً با کروم یا فایرفاکس به‌روز باز کنید.';
        this.container.appendChild(d);
    }
    /* ================= sky ================= */ buildSky() {
        const geo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SphereGeometry"](1250, 28, 14);
        this.skyMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ShaderMaterial"]({
            uniforms: {
                topColor: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x3f7cc4)
                },
                bottomColor: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xcfe4ee)
                },
                sunDir: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](0, 1, 0)
                },
                sunColor: {
                    value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xfff2d8)
                }
            },
            vertexShader: `
        varying vec3 vDir;
        void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
            fragmentShader: `
        uniform vec3 topColor; uniform vec3 bottomColor; uniform vec3 sunDir; uniform vec3 sunColor;
        varying vec3 vDir;
        void main(){
          vec3 d = normalize(vDir);
          float h = max(d.y, 0.0);
          vec3 col = mix(bottomColor, topColor, pow(h, 0.55));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          col += sunColor * pow(s, 260.0) * 1.4;
          col += sunColor * pow(s, 9.0) * 0.16;
          gl_FragColor = vec4(col, 1.0);
        }`,
            side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BackSide"],
            depthWrite: false,
            fog: false
        });
        const dome = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Mesh"](geo, this.skyMat);
        dome.frustumCulled = false;
        this.scene.add(dome);
        // stars
        const starGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferGeometry"]();
        const n = 700;
        const pos = new Float32Array(n * 3);
        for(let i = 0; i < n; i++){
            const a = Math.random() * Math.PI * 2;
            const e = Math.random() * Math.PI * 0.48;
            const r = 1150;
            pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
            pos[i * 3 + 1] = Math.sin(e) * r + 30;
            pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
        }
        starGeo.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferAttribute"](pos, 3));
        this.starsMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PointsMaterial"]({
            color: 0xcdd8ff,
            size: 2.2,
            sizeAttenuation: false,
            transparent: true,
            opacity: 0,
            fog: false,
            depthWrite: false
        });
        this.stars = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Points"](starGeo, this.starsMat);
        this.stars.frustumCulled = false;
        this.scene.add(this.stars);
        // moon
        this.moon = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
            map: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])(),
            color: 0xdfe8ff,
            transparent: true,
            opacity: 0,
            fog: false,
            depthWrite: false
        }));
        this.moon.scale.setScalar(70);
        this.scene.add(this.moon);
        // clouds
        const cloudTex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["texGlow"])();
        const nC = this.quality === 'low' ? 7 : 14;
        for(let i = 0; i < nC; i++){
            const s = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sprite"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpriteMaterial"]({
                map: cloudTex,
                color: 0xffffff,
                transparent: true,
                opacity: 0.26,
                fog: false,
                depthWrite: false
            }));
            const base = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"](-900 + Math.random() * 1800, 190 + Math.random() * 130, -900 + Math.random() * 1800);
            s.position.copy(base);
            s.scale.setScalar(120 + Math.random() * 160);
            this.scene.add(s);
            this.clouds.push({
                sprite: s,
                base,
                speed: 2 + Math.random() * 3
            });
        }
        // lights
        this.hemi = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HemisphereLight"](0xbfd8e8, 0x8a7048, 0.55);
        this.scene.add(this.hemi);
        this.sunLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DirectionalLight"](0xfff2d8, 2.4);
        this.sunLight.castShadow = this.quality !== 'low';
        const ss = this.quality === 'high' ? 2048 : 1024;
        this.sunLight.shadow.mapSize.set(ss, ss);
        this.sunLight.shadow.camera.left = -95;
        this.sunLight.shadow.camera.right = 95;
        this.sunLight.shadow.camera.top = 95;
        this.sunLight.shadow.camera.bottom = -95;
        this.sunLight.shadow.camera.near = 20;
        this.sunLight.shadow.camera.far = 420;
        this.sunLight.shadow.bias = -0.0004;
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);
    }
    /* ================= lifecycle ================= */ startGame() {
        this.started = true;
        this.paused = false;
        this.sfx.init();
        this.sfx.resume();
        this.sfx.windStart();
        this.sfx.ambientStart();
        this.hud.hideOverlays();
        this.input.enabled = true;
        this.hud.setPlayingUI(true);
        if (!this.input.isTouch) this.input.requestLock();
        this.hud.toast('به لاس سومبرا خوش آمدی — نشانگرهای طلایی را دنبال کن', 'gold');
    }
    togglePause() {
        if (!this.started || this.menuOpen || this.respawnPending) return;
        if (this.paused) this.resume();
        else this.pause();
    }
    pause() {
        if (this.paused) return;
        this.paused = true;
        this.input.enabled = false;
        this.input.releaseLock();
        this.input.clearQueue();
        this.sfx.engineUpdate(0, 0, false);
        this.sfx.sirenVol(0);
        this.hud.showPause();
    }
    /** pause without showing the pause menu (used when a game panel opens) */ softPause() {
        this.paused = true;
        this.input.enabled = false;
        this.input.releaseLock();
        this.input.clearQueue();
        this.sfx.engineUpdate(0, 0, false);
        this.sfx.sirenVol(0);
    }
    resume() {
        this.paused = false;
        this.menuOpen = false;
        this.hud.hideOverlays();
        this.input.enabled = true;
        this.hud.setPlayingUI(true);
        this.sfx.resume();
        if (!this.input.isTouch) this.input.requestLock();
    }
    onDeath() {
        if (this.respawnPending) return;
        this.respawnPending = true;
        setTimeout(()=>{
            this.hud.showDeath(Math.min(100, this.player.money));
            this.respawnPending = false;
        }, 1200);
        this.sfx.engineUpdate(0, 0, false);
    }
    respawn() {
        const fee = Math.min(100, this.player.money);
        this.player.money -= fee;
        // leave vehicle first, then move to hospital
        if (this.vehicles.playerVehicle) this.vehicles.exit();
        this.hud.fadeBlack(true, 400);
        setTimeout(()=>{
            this.player.respawn(this.world.spots.hospital, this.time);
            this.combat.clearWanted();
            this.vehicles.clearPolice();
            this.hud.fadeBlack(false, 600);
            this.resume();
            this.hud.toast('دوباره سرپا شدی — مراقب باش!', 'info');
        }, 550);
    }
    /* ================= save ================= */ loadSave() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch  {
            return {};
        }
    }
    persist() {
        try {
            const data = {
                money: Math.round(this.player.money),
                weapons: this.combat.weapons.map((w)=>({
                        owned: w.owned,
                        mag: w.mag,
                        reserve: w.reserve
                    })),
                current: this.combat.current,
                quality: this.quality,
                muted: this.sfx.muted
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch  {}
    }
    onResize;
    onVis;
    tmpV;
    loop;
    nightFactor;
    updateSky(dt) {
        const a = (this.timeHour - 6) / 12 * Math.PI // 6am: 0 (east horizon), noon: PI/2, 6pm: PI
        ;
        const sunDir = this.tmpV.set(Math.cos(a), Math.sin(a), -0.32).normalize().clone();
        const elev = sunDir.y;
        const dayT = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["smoothstep"])(0.12, 0.38, elev);
        const nightF = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clamp"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["smoothstep"])(0.02, -0.14, elev), 0, 1);
        this.nightFactor = nightF;
        const duskT = Math.max(0, 1 - dayT - nightF);
        // palettes
        const topDay = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x3f7cc4), topDusk = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x2e3f74), topNight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x05070f);
        const botDay = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xcfe4ee), botDusk = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xf0a45a), botNight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x121a2c);
        const fogDay = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xc8dde8), fogDusk = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xe0a878), fogNight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0x0d141f);
        const top = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](topDay.r * dayT + topDusk.r * duskT + topNight.r * nightF, topDay.g * dayT + topDusk.g * duskT + topNight.g * nightF, topDay.b * dayT + topDusk.b * duskT + topNight.b * nightF);
        const bot = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](botDay.r * dayT + botDusk.r * duskT + botNight.r * nightF, botDay.g * dayT + botDusk.g * duskT + botNight.g * nightF, botDay.b * dayT + botDusk.b * duskT + botNight.b * nightF);
        const fog = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](fogDay.r * dayT + fogDusk.r * duskT + fogNight.r * nightF, fogDay.g * dayT + fogDusk.g * duskT + fogNight.g * nightF, fogDay.b * dayT + fogDusk.b * duskT + fogNight.b * nightF);
        this.skyMat.uniforms.topColor.value.copy(top);
        this.skyMat.uniforms.bottomColor.value.copy(bot);
        this.scene.fog.color.copy(fog);
        // sun / moon
        const isDay = elev > 0.02;
        const lightDir = isDay ? sunDir : sunDir.clone().negate();
        this.skyMat.uniforms.sunDir.value.copy(isDay ? sunDir : sunDir.clone().negate());
        const sunCol = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"]().lerpColors(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xffb46a), new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xfff2d8), dayT);
        if (isDay) {
            this.skyMat.uniforms.sunColor.value.copy(sunCol);
            this.sunLight.color.copy(sunCol);
            this.sunLight.intensity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(1.5, 2.5, dayT);
        } else {
            this.skyMat.uniforms.sunColor.value.setRGB(0.55, 0.62, 0.8);
            this.sunLight.color.setHex(0x9db4d8);
            this.sunLight.intensity = 0.8;
        }
        this.hemi.intensity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(0.26, 0.58, dayT);
        this.hemi.color.copy(bot).lerp(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0xffffff), 0.4);
        // follow camera & player for shadow box
        const p = this.player ? this.player.pos : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Vector3"]();
        this.stars.position.set(p.x, 0, p.z);
        this.moon.position.set(p.x + lightDir.x * 1100, lightDir.y * 1100, p.z + lightDir.z * 1100);
        this.moon.material.opacity = nightF * 0.85;
        this.starsMat.opacity = nightF * 0.9;
        this.sunLight.position.set(p.x + lightDir.x * 190, Math.max(30, lightDir.y * 190), p.z + lightDir.z * 190);
        this.sunLight.target.position.set(p.x, 0, p.z);
        this.sunLight.target.updateMatrixWorld();
        // clouds drift
        for (const c of this.clouds){
            c.base.x += c.speed * dt;
            if (c.base.x > 1000) c.base.x = -1000;
            if (this.camera) c.sprite.position.set(c.base.x, c.base.y, c.base.z);
            c.sprite.material.opacity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["lerp"])(0.07, 0.28, dayT);
        }
        // stars twinkle? skip
        void dt;
    }
    updatePrompt() {
        if (this.player.dead) {
            this.hud.prompt(null);
            return;
        }
        if (this.vehicles.playerVehicle) {
            this.hud.prompt(`<b>F</b> یا دکمه سوار — پیاده شدن`);
            this.hud.setEnterLabel('پیاده');
            return;
        }
        const v = this.vehicles.nearest(this.player.pos, 4.6);
        if (v) {
            const name = v.kind === 'horse' ? 'اسب' : v.isPolice ? 'ماشین پلیس' : 'ماشین';
            this.hud.prompt(`<b>F</b> — سوار شدن روی ${name}`);
            this.hud.setEnterLabel('سوار');
            return;
        }
        const giver = this.missions.giverNear(this.player.pos);
        if (giver) {
            this.hud.prompt(`مأموریت: <b>${giver.title}</b>`);
            this.hud.setEnterLabel(null);
            return;
        }
        if (this.nearShop()) {
            this.hud.prompt('<b>مغازه اسلحه</b> — خرید تجهیزات');
            this.hud.setEnterLabel(null);
            return;
        }
        this.hud.prompt(null);
        this.hud.setEnterLabel(null);
    }
    nearShop() {
        for (const s of this.world.spots.gunShops){
            if (Math.hypot(s.x - this.player.pos.x, s.z - this.player.pos.z) < 4) return true;
        }
        return false;
    }
    checkMarkers() {
        if (this.menuOpen || this.markerCd > 0 || this.player.dead) return;
        const giver = this.missions.giverNear(this.player.pos);
        if (giver) {
            this.menuOpen = true;
            this.softPause();
            this.hud.showMissionOffer(giver);
            return;
        }
        if (this.nearShop()) {
            this.menuOpen = true;
            this.softPause();
            const owned = this.combat.weapons.map((w)=>w.owned);
            const w = this.combat.weapon;
            this.hud.showShop(owned, {
                pistol: 250,
                rifle: 600
            }, true, `خشاب ${w.def.name} (${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(w.def.ammoPack)} تیر) — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["faNum"])(w.def.ammoCost)} دلار`);
        }
    }
    dispose() {
        this.disposed = true;
        cancelAnimationFrame(this.raf);
        window.removeEventListener('resize', this.onResize);
        document.removeEventListener('visibilitychange', this.onVis);
        this.input.dispose();
        this.hud.dispose();
        this.sfx.dispose();
        this.vehicles.dispose();
        this.combat.dispose();
        this.missions.dispose();
        this.particles.dispose();
        this.persist();
        this.renderer.dispose();
        this.renderer.domElement.remove();
        this.scene.traverse((o)=>{
            const m = o;
            if (m.geometry) m.geometry.dispose();
        });
        void __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$game$2f$world$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WORLD_HALF"];
    }
}
function rand2(a, b) {
    return a + Math.random() * (b - a);
}
}),
];

//# sourceMappingURL=src_game_9ca6fbf4._.js.map