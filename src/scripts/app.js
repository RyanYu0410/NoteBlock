// =========================================================
//  ORIGINAL CURATED SETS
// =========================================================
const SETS = [
  { name:'Mist', color:'#a8e6cf', accent:'#dcedc1',
    bg:[12,28,28], bpm:63,
    scale:['E3','F#3','G#3','A#3','B3','C#4','D#4','E4','F#4','G#4'],
    padScale:['E3','G#3','B3','D#4'],
    available:['melody','reply','pad','ghost'],
    gains:{ solo:.20, reply:.12, pad:.16, ghost:.18, sub:0, bass:0, kick:0, hat:0, snare:0, openhat:0, rim:0, arp:0, prism:0, bloom:0, pulse:0 },
    soloLpf:1400, bassLpf:700, reverbDecay:8, delayFb:0.6 },
  { name:'Aria', color:'#00ffcc', accent:'#88ffee',
    bg:[8,18,32], bpm:84,
    scale:['A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'],
    padScale:['A3','C4','E4','G4'],
    available:['melody','reply','rim','ghost','pad','snare'],
    gains:{ solo:.30, reply:.16, pad:.14, ghost:.10, rim:.20, snare:.08, sub:0, bass:0, kick:0, hat:0, openhat:0, arp:0, prism:0, bloom:0, pulse:0 },
    soloLpf:1900, bassLpf:900, reverbDecay:5, delayFb:0.5 },
  { name:'Bloom', color:'#ffaaa5', accent:'#ffd3b6',
    bg:[32,14,24], bpm:110,
    scale:['E4','G4','A4','B4','D5','E5','G5','A5','B5','D6'],
    padScale:['E3','G3','B3','D4','E4'],
    available:['melody','arp','bloom','prism','hat','rim','bass','pad'],
    gains:{ solo:.24, arp:.14, bloom:.12, prism:.08, hat:.06, rim:.14, bass:.12, pad:.16, reply:0, ghost:0, sub:0, kick:0, snare:0, openhat:0, pulse:0 },
    soloLpf:2200, bassLpf:1100, reverbDecay:3, delayFb:0.35 },
  { name:'Drop', color:'#ff0055', accent:'#ff4488',
    bg:[12,4,16], bpm:150,
    scale:['E3','F3','G#3','A3','B3','C4','D4','E4','F4','G#4'],
    padScale:['E2','G#2','B2','D3'],
    available:['kick','snare','hat','openhat','bass','sub','arp','prism','pulse'],
    gains:{ kick:.16, snare:.24, hat:.10, openhat:.28, bass:.28, sub:.22, arp:.18, prism:.22, pulse:.12, solo:0, reply:0, pad:0, ghost:0, rim:0, bloom:0 },
    soloLpf:1800, bassLpf:1500, reverbDecay:1, delayFb:0.2 },
  { name:'Afterglow', color:'#9900ff', accent:'#cc66ff',
    bg:[16,8,32], bpm:72,
    scale:['C4','D4','E4','G4','A4','B4','C5','D5','E5','G5'],
    padScale:['C3','E3','G3','B3'],
    available:['melody','reply','ghost','pad','pulse','rim','bloom'],
    gains:{ solo:.20, reply:.12, ghost:.14, pad:.16, pulse:.06, rim:.10, bloom:.06, sub:0, bass:0, kick:0, hat:0, snare:0, openhat:0, arp:0, prism:0 },
    soloLpf:1500, bassLpf:900, reverbDecay:7, delayFb:0.55 }
];

const ALL_INSTRUMENTS = ['kick','hat','snare','openhat','rim','bass','sub','melody','reply','arp','prism','bloom','ghost','pulse','pad'];
const CHAR_ACTIONS = ['move','mute','delete'];
const ROLE_GAIN_KEY = { kick:'kick',hat:'hat',snare:'snare',openhat:'openhat',rim:'rim',bass:'bass',sub:'sub',melody:'solo',reply:'reply',arp:'arp',prism:'prism',bloom:'bloom',ghost:'ghost',pad:'pad',pulse:'pulse' };

// =========================================================
//  COLOR → ROLE  (priority list per fruit colour)
//  First role in the list that's present in the current set wins.
// =========================================================
const COLOR_TYPES = ['red','orange','yellow','green','blue','purple'];
const COLOR_DISPLAY = {
    red:    { c:'#ff5577', light:'#ff99aa', glow:'rgba(255,85,119,0.55)' },
    orange: { c:'#ff9933', light:'#ffbb77', glow:'rgba(255,153,51,0.55)' },
    yellow: { c:'#ffd633', light:'#fff099', glow:'rgba(255,214,51,0.55)' },
    green:  { c:'#33cc66', light:'#88ddaa', glow:'rgba(51,204,102,0.55)' },
    blue:   { c:'#223a8f', light:'#5f78d6', glow:'rgba(50,70,180,0.60)' },
    purple: { c:'#9966cc', light:'#bb99dd', glow:'rgba(153,102,204,0.55)' }
};
const COLOR_ROLE_PRIORITY = {
    red:    ['pad','bloom','ghost','reply'],
    orange: ['melody','reply','arp'],
    yellow: ['bass','sub'],
    // Green should feel like an active musical note first, not a barely audible hat.
    green:  ['melody','arp','kick','rim','snare','openhat','hat','reply','pad'],
    blue:   ['prism','pulse','bloom','arp','reply'],
    purple: ['ghost','pad','bloom']
};
function colorToRole(color) {
    const list = COLOR_ROLE_PRIORITY[color] || [];
    for (const r of list) if (set.available.includes(r)) return r;
    return null;
}

// HSV thresholds for camera color detection
const HSV_RANGES = [
    { type:'red',    test:(h,s,v)=>(h<18||h>340) && s>0.45 && v>0.30 && v<0.96 },
    // Orange/yellow are continuous now: no dead-zone, so orange fruit is easier to catch.
    { type:'orange', test:(h,s,v)=> h>=12 && h<58  && s>0.46 && v>0.40 },
    { type:'yellow', test:(h,s,v)=> h>=58 && h<78  && s>0.38 && v>0.48 },
    { type:'green',  test:(h,s,v)=> h>=75 && h<165 && s>0.30 && v>0.25 },
    // Blueberry: small, dark blue/blue-purple. Keep low brightness valid and
    // allow a wider hue band so shadowed berries are still picked up.
    { type:'blue',   test:(h,s,v)=> h>=205 && h<285 && s>0.34 && v>0.10 && v<0.50 },
    { type:'purple', test:(h,s,v)=> h>=260 && h<335 && s>0.25 && v>0.20 }
];

// Camera detection performance
const PROC_W = 240, PROC_H = 180;
const DETECT_INTERVAL_MS = 140;       // ~7Hz (was 80ms / ~12Hz)
const FRUIT_TTL_MS = 600;
const SMOOTH_ALPHA = 0.30;
const MIN_BLOB_CELLS = 5;
const COLOR_MIN_BLOB_CELLS = { orange: 16, blue: 3 };
const VOICE_CAP_PER_COLOR = 3;

let currentMode = 0;
let set = SETS[0];
let isAudioInitialized = false;

// ── AUDIO ──
const nodes = {};
const synths = {};
let masterReverb, masterDelay;

async function initAudio() {
    if (isAudioInitialized) return;
    await Tone.start();
    // Lower the audio context's render quality slightly — laptops thank us.
    const master = new Tone.Gain(0.9).toDestination();

    // ── ONE shared FX chain (was 7 reverbs + 5 delays in the original).
    // JCReverb is a cheap Schroeder reverb instead of convolution.
    masterReverb = new Tone.JCReverb({ roomSize: 0.7, wet: 0.32 }).connect(master);
    masterDelay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.32, wet: 0.18 }).connect(masterReverb);
    const fxIn = masterDelay;

    // Per-role gain buses (set-driven mix). All routed through fxIn → master.
    const gainKeys = ['solo','reply','pad','ghost','sub','bass','kick','hat','snare','openhat','rim','arp','prism','bloom','pulse'];
    gainKeys.forEach(k => { nodes[k] = new Tone.Gain(set.gains[k] || 0).connect(fxIn); });

    // Per-role lowpass filters (cheap; give roles tonal differentiation without per-role reverbs)
    nodes.soloFilter = new Tone.Filter(set.soloLpf, 'lowpass').connect(nodes.solo);
    nodes.bassFilter = new Tone.Filter(set.bassLpf, 'lowpass').connect(nodes.bass);
    nodes.replyFilter = new Tone.Filter(1600, 'lowpass').connect(nodes.reply);
    nodes.padFilter = new Tone.Filter(1000, 'lowpass').connect(nodes.pad);
    nodes.prismFilter = new Tone.Filter(2600, 'lowpass').connect(nodes.prism);
    nodes.subFilter = new Tone.Filter(300, 'lowpass').connect(nodes.sub);
    nodes.ghostFilter = new Tone.Filter(1800, 'lowpass').connect(nodes.ghost);
    nodes.arpFilter = new Tone.Filter(2500, 'lowpass').connect(nodes.arp);
    nodes.bloomFilter = new Tone.Filter(1600, 'lowpass').connect(nodes.bloom);

    // PolySynths capped to small voice counts to bound CPU.
    synths.solo  = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 4, oscillator:{type:"triangle"}, envelope:{attack:0.05,release:1} }).connect(nodes.soloFilter);
    synths.reply = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 3, oscillator:{type:"triangle"}, envelope:{attack:0.04,release:0.8} }).connect(nodes.replyFilter);
    synths.pad   = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 4, oscillator:{type:"sawtooth"}, envelope:{attack:0.5,release:2} }).connect(nodes.padFilter);
    synths.sub   = new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.1,release:1}}).connect(nodes.subFilter);
    synths.bass  = new Tone.Synth({oscillator:{type:"sawtooth"},envelope:{attack:0.05,release:0.5}}).connect(nodes.bassFilter);
    synths.prism = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 3, oscillator:{type:"square"}, envelope:{attack:0.01,release:0.2} }).connect(nodes.prismFilter);
    synths.pulse = new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.01,release:0.1}}).connect(nodes.pulse);
    synths.bloom = new Tone.PolySynth(Tone.Synth, { maxPolyphony: 3, oscillator:{type:"square"}, envelope:{attack:0.01,release:0.15} }).connect(nodes.bloomFilter);
    synths.arp   = new Tone.Synth({oscillator:{type:"square"},envelope:{attack:0.01,decay:0.1,sustain:0}}).connect(nodes.arpFilter);
    synths.ghost = new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:0.05,decay:0.4,sustain:0}}).connect(nodes.ghostFilter);
    synths.kick  = new Tone.MembraneSynth({pitchDecay:0.05,octaves:4,envelope:{attack:0.001,decay:0.4,sustain:0.01,release:1.4}}).connect(nodes.kick);
    synths.hat   = new Tone.MetalSynth({frequency:200,envelope:{attack:0.001,decay:0.1,release:0.01},harmonicity:5.1,modulationIndex:32,resonance:4000,octaves:1.5}).connect(nodes.hat);
    synths.snare = new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:0.005,decay:0.2,sustain:0}}).connect(nodes.snare);
    synths.openhat=new Tone.MetalSynth({frequency:300,envelope:{attack:0.001,decay:0.3,release:0.1},harmonicity:3.5,modulationIndex:20,resonance:6000,octaves:2}).connect(nodes.openhat);
    synths.rim   = new Tone.MembraneSynth({pitchDecay:0.008,octaves:2,envelope:{attack:0.001,decay:0.05,sustain:0,release:0.1}}).connect(nodes.rim);
    synths.rim.volume.value = 4;

    Tone.Transport.bpm.value = set.bpm;

    Tone.Transport.scheduleRepeat((time) => {
        // Hub flash on downbeats only — visual cost
        if (stepCount % 4 === 0) Tone.Draw.schedule(() => { hub.pulse = 20; }, time);
        // Hot loop — for-of with index, avoid forEach allocation
        const len = characters.length;
        for (let i = 0; i < len; i++) {
            const c = characters[i];
            if (c.active && c.sequence[stepCount % c.n] === 1) {
                c.playSound(time, stepCount);
                Tone.Draw.schedule(() => c.pulse(), time);
            }
        }
        stepCount++;
    }, "16n");

    Tone.Transport.start();
    isAudioInitialized = true;
    applySet();
}

function isRoleAvailable(role) { return set.available.includes(role); }

function setMode(m) {
    currentMode = m % 5;
    set = SETS[currentMode];
    applySet();
}

function applySet() {
    if (isAudioInitialized) {
        Tone.Transport.bpm.rampTo(set.bpm, 2);
        const gainKeys = ['solo','reply','pad','ghost','sub','bass','kick','hat','snare','openhat','rim','arp','prism','bloom','pulse'];
        gainKeys.forEach(k => { nodes[k].gain.rampTo((set.gains[k] || 0) * 2, 1.5); });
        nodes.soloFilter.frequency.rampTo(set.soloLpf, 1.5);
        nodes.bassFilter.frequency.rampTo(set.bassLpf, 1.5);
        if (masterReverb) masterReverb.roomSize.rampTo(Math.min(0.92, 0.40 + set.reverbDecay * 0.06), 1.5);
        if (masterDelay)  masterDelay.feedback.rampTo(set.delayFb, 1.5);
    }

    // Camera-source characters re-map their role to the new set's available roster
    // (their fruit colour stays fixed; the instrument it represents may change).
    characters.forEach(c => {
        if (c.source === 'camera' && c.fruitColor) {
            const newRole = colorToRole(c.fruitColor);
            if (newRole && newRole !== c.role) c.morphRole(newRole);
        }
    });

    // Auto-mute / auto-unmute based on new gain availability
    characters.forEach(c => {
        const gainKey = ROLE_GAIN_KEY[c.role];
        const g = set.gains[gainKey] || 0;
        if (g <= 0) { c.active = false; c.autoMuted = true; }
        else if (c.autoMuted) { c.active = true; c.autoMuted = false; }
    });

    updateUI();
    refreshPaletteChips();
    bgFlashes.push({color:p5color(set.color).levels, alpha:80, decay:5});
}

// ── VISUAL ──
let particles=[], ripples=[], bgFlashes=[], characters=[];
let stepCount=0, selectedCharacter=null;
const hub = {x:0,y:0,radius:50,pulse:0};
let gestureState = {active:false,type:null,startX:0,startY:0,target:null,currentAngle:0,distance:0};

// ── CLOCK ──
// 12 sectors (like a wall clock) drive the Euclidean rhythm pulse count `k`.
// 12 o'clock = 1 pulse (sparse), going clockwise 2,3,...,12 (dense).
const CLOCK_SECTORS = 12;
const CLOCK_K_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
function angleToSector(x, y) {
    const dx = x - hub.x, dy = y - hub.y;
    let a = Math.atan2(dy, dx) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    if (a >= Math.PI * 2) a -= Math.PI * 2;
    return Math.floor(a / (Math.PI * 2 / CLOCK_SECTORS)) % CLOCK_SECTORS;
}
function angleToK(x, y) { return CLOCK_K_VALUES[angleToSector(x, y)]; }

// ── SIZE ──
// Per-fruit size multipliers; fruit size controls texture/material (note duration).
const SIZE_LEVELS = [0.55, 0.75, 1.0, 1.35, 1.8];
const SIZE_DEFAULT_INDEX = 2;
function durSec(noteString, mult) {
    try { return Tone.Time(noteString).toSeconds() * (mult || 1); }
    catch (e) { return 0.25 * (mult || 1); }
}

// Helper: p5 colour parser (reused outside p5 setup too)
function p5color(s) { return color(s); }

function setup() {
    createCanvas(windowWidth, windowHeight); noStroke();
    // Cap p5's draw loop at 30fps — half the per-frame CPU vs default 60fps,
    // and more than enough for the audiovisual feel here.
    frameRate(30);
    hub.x = width/2; hub.y = height/2;
    setupOriginalUI();
}

function draw() {
    background(set.bg[0], set.bg[1], set.bg[2], 60);

    for (let i=bgFlashes.length-1;i>=0;i--) { let f=bgFlashes[i]; fill(f.color[0],f.color[1],f.color[2],f.alpha); rect(0,0,width,height); f.alpha-=f.decay; if(f.alpha<=0) bgFlashes.splice(i,1); }

    hub.x=width/2; hub.y=height/2;

    // Loudness rings (subtle visual cue for distance->volume)
    push();
    stroke(255, 18); strokeWeight(1); noFill();
    const maxR = Math.min(width, height) * 0.42;
    for (let i=1;i<=4;i++) ellipse(hub.x, hub.y, (maxR*2) * (i/4));
    pop();

    // Clock face: angular sectors that drive Euclidean pulse count (k)
    drawClockFace();

    push(); translate(hub.x,hub.y);
    noFill(); strokeWeight(2); stroke(255,100); ellipse(0,0,hub.radius*2+hub.pulse);
    fill(255,20); ellipse(0,0,hub.radius*2);
    stroke(255); strokeWeight(3); line(-10,0,10,0); line(0,-10,0,10);
    if(hub.pulse>0) hub.pulse*=0.9;
    pop();

    // Camera silhouette tint inside the ring (optional, lightweight)
    drawCameraSilhouette();

    for (let i=ripples.length-1;i>=0;i--) { let r=ripples[i]; noFill(); strokeWeight(r.weight); stroke(r.c[0],r.c[1],r.c[2],r.alpha); ellipse(r.x,r.y,r.size); r.size+=r.speed; r.alpha-=r.decay; r.weight*=0.95; if(r.alpha<=0) ripples.splice(i,1); }
    noStroke();

    characters.forEach(c => { c.update(); c.display(); });

    for (let i=particles.length-1;i>=0;i--) { let p=particles[i]; fill(p.c[0],p.c[1],p.c[2],p.alpha); push(); translate(p.x,p.y); rotate(p.rotation); if(p.shape==='circle') ellipse(0,0,p.size); else if(p.shape==='rect') rect(-p.size/2,-p.size/2,p.size,p.size); else triangle(-p.size/2,p.size/2,p.size/2,p.size/2,0,-p.size/2); pop(); p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.rotation+=p.vr; p.alpha-=p.decay; p.size*=0.98; if(p.alpha<=0||p.size<0.5) particles.splice(i,1); }

    drawGestures();

    if (selectedCharacter && !gestureState.active) {
        const panel = document.getElementById('icon-panel');
        panel.style.display='flex';
        let tx=selectedCharacter.x, ty=selectedCharacter.y;
        if(tx>width-150) tx=selectedCharacter.x-120;
        if(ty<100) ty=100; if(ty>height-100) ty=height-100;
        panel.style.left=tx+'px'; panel.style.top=ty+'px';
    } else { document.getElementById('icon-panel').style.display='none'; }

    // Camera detection tick (independent of frame rate)
    cameraDetectFrame(performance.now());
}

function drawGestures() {
    if (!gestureState.active) return;
    gestureState.distance = dist(gestureState.startX,gestureState.startY,mouseX,mouseY);
    gestureState.currentAngle = atan2(mouseY-gestureState.startY,mouseX-gestureState.startX);
    if (gestureState.currentAngle<0) gestureState.currentAngle+=TWO_PI;

    push(); translate(gestureState.startX,gestureState.startY);

    if (gestureState.type === 'hub_dial') {
        const items = set.available;
        const numItems = items.length;
        const angleStep = TWO_PI / numItems;
        const selectedIndex = floor((gestureState.currentAngle+angleStep/2)/angleStep)%numItems;
        const ringRadius = 90 + numItems * 3;
        noFill(); stroke(255,30); strokeWeight(2); ellipse(0,0,ringRadius*2);
        for (let i=0; i<numItems; i++) {
            const a = i * angleStep;
            const px = cos(a)*ringRadius, py = sin(a)*ringRadius;
            const isSel = (i===selectedIndex && gestureState.distance>40);
            noStroke();
            fill(isSel ? set.color : 80);
            ellipse(px,py,isSel?24:12);
            if (isSel) { fill(255); textAlign(CENTER,CENTER); textSize(12);
                const lx=cos(a)*(ringRadius+28), ly=sin(a)*(ringRadius+28);
                text(items[i].toUpperCase(),lx,ly); }
        }
        stroke(255,80); strokeWeight(1.5);
        line(0,0,mouseX-gestureState.startX,mouseY-gestureState.startY);
    } else if (gestureState.type === 'char_action') {
        const numItems = CHAR_ACTIONS.length;
        const angleStep = TWO_PI / numItems;
        const selectedIndex = floor((gestureState.currentAngle+angleStep/2)/angleStep)%numItems;
        noFill(); stroke(255,30); strokeWeight(2); ellipse(0,0,120);
        for (let i=0;i<numItems;i++) {
            const a=i*angleStep, px=cos(a)*60, py=sin(a)*60;
            const isSel=(i===selectedIndex && gestureState.distance>30);
            const col = CHAR_ACTIONS[i]==='delete'?'#ff0055':CHAR_ACTIONS[i]==='mute'?'#ffcc00':'#ffffff';
            fill(isSel?col:50); noStroke(); ellipse(px,py,isSel?20:10);
            if(isSel){ fill(col); textAlign(CENTER,CENTER); textSize(12); text(CHAR_ACTIONS[i].toUpperCase(),cos(a)*90,sin(a)*90); }
        }
        if(CHAR_ACTIONS[selectedIndex]==='move' && gestureState.distance>30 && gestureState.target.source !== 'camera') {
            gestureState.target.tx=mouseX; gestureState.target.ty=mouseY;
            stroke(255,80); strokeWeight(1.5); line(0,0,mouseX-gestureState.startX,mouseY-gestureState.startY);
        }
    }
    pop();
}

function windowResized() { resizeCanvas(windowWidth,windowHeight); }

async function mousePressed(event) {
    if(event.target.tagName!=='CANVAS') return;
    if(!isAudioInitialized) await ensureAudio();

    gestureState.startX=mouseX; gestureState.startY=mouseY; gestureState.distance=0;

    if(dist(mouseX,mouseY,hub.x,hub.y)<hub.radius) { gestureState.active=true; gestureState.type='hub_dial'; gestureState.target=hub; selectCharacter(null); return; }

    for(let i=characters.length-1;i>=0;i--) {
        const c=characters[i];
        if(dist(mouseX,mouseY,c.x,c.y)<c.baseSize+30) { gestureState.active=true; gestureState.type='char_action'; gestureState.target=c; selectCharacter(c); return; }
    }
    selectCharacter(null);
    triggerPad(mouseX,mouseY,false);
}

function mouseDragged(event) {
    if(!isAudioInitialized) return;
    if(event.target.tagName!=='CANVAS') return;
    if(!gestureState.active && frameCount%8===0) triggerPad(mouseX,mouseY,true);
}

function mouseReleased() {
    if(gestureState.active) {
        if(gestureState.distance>30) {
            if(gestureState.type==='hub_dial') {
                const items=set.available;
                const angleStep=TWO_PI/items.length;
                const idx=floor((gestureState.currentAngle+angleStep/2)/angleStep)%items.length;
                spawnCharacter(items[idx],mouseX,mouseY,'virtual',null);
            } else if(gestureState.type==='char_action') {
                const angleStep=TWO_PI/CHAR_ACTIONS.length;
                const idx=floor((gestureState.currentAngle+angleStep/2)/angleStep)%CHAR_ACTIONS.length;
                const action=CHAR_ACTIONS[idx];
                if(action==='mute'){gestureState.target.active=!gestureState.target.active; gestureState.target.autoMuted=false;}
                else if(action==='delete'){spawnParticles(gestureState.target.x,gestureState.target.y,gestureState.target.c,30,15); characters=characters.filter(c=>c!==gestureState.target); selectCharacter(null);}
            }
        } else {
            if(gestureState.type==='hub_dial') spawnCharacter(random(set.available),mouseX+random(-50,50),mouseY+random(-50,50),'virtual',null);
        }
    }
    gestureState.active=false;
}

const MAX_CHARACTERS = 12;
function spawnCharacter(role,tx,ty,source,fruitColor) {
    if (!role) return null;
    // Cap concurrent characters — each one runs on every 16n tick.
    if (characters.length >= MAX_CHARACTERS) {
        const oldestVirtualIdx = characters.findIndex(c => c.source !== 'camera');
        if (oldestVirtualIdx >= 0) {
            const old = characters.splice(oldestVirtualIdx, 1)[0];
            if (selectedCharacter === old) selectCharacter(null);
        } else {
            return null; // all camera-bound, can't add more
        }
    }
    // k is derived from the clock sector (angle of the drop position around the hub).
    const k = Math.max(1, Math.min(15, angleToK(tx, ty)));
    const c=new Character(role,hub.x,hub.y,k,16,source||'virtual',fruitColor);
    c.tx=tx; c.ty=ty;
    characters.push(c);
    if (source !== 'camera') selectCharacter(c);
    spawnParticles(hub.x,hub.y,c.c,8,8); spawnRipples(hub.x,hub.y,c.c,1);
    return c;
}

function triggerPad(x,y,isDrag=false) {
    if(!isAudioInitialized) return;
    const col=color(set.color).levels;
    spawnParticles(x,y,col,isDrag?2:8,isDrag?3:8);
    if(!isDrag) spawnRipples(x,y,col,1);
    const note=random(set.padScale);
    const v = distanceVelocity(x, y);
    if(isDrag) synths.pad.triggerAttackRelease(note,"8n",undefined,v);
    else synths.pad.triggerAttackRelease([note,random(set.padScale)],"2n",undefined,v);
    characters.forEach(c=>{
        if(c.active && !c.isSelected && !gestureState.active && c.source !== 'camera'){c.tx=x+random(-150,150); c.ty=y+random(-150,150);}
    });
}

// Distance-as-volume: closer to hub center = louder
function distanceVelocity(x, y) {
    const maxR = Math.min(width, height) * 0.42;
    const d = Math.sqrt((x - hub.x)**2 + (y - hub.y)**2);
    const t = Math.max(0, Math.min(1, d / maxR));
    return Math.max(0.15, Math.pow(1 - t, 1.5));
}

// Draw the clock face — sector lines + k labels around the playable circle.
// Highlights the active sector for the selected character.
function drawClockFace() {
    const tableR = Math.min(width, height) * 0.42;
    const sectorWidth = TWO_PI / CLOCK_SECTORS;
    push(); translate(hub.x, hub.y);

    if (selectedCharacter) {
        const sec = angleToSector(selectedCharacter.x, selectedCharacter.y);
        const a0 = -HALF_PI + sec * sectorWidth;
        const tint = selectedCharacter.c || [255,255,255];
        noStroke();
        fill(tint[0], tint[1], tint[2], 28);
        beginShape();
        vertex(0, 0);
        const steps = 18;
        for (let t = 0; t <= steps; t++) {
            const aa = a0 + sectorWidth * (t/steps);
            vertex(Math.cos(aa) * tableR, Math.sin(aa) * tableR);
        }
        endShape(CLOSE);
    }

    stroke(255, 32); strokeWeight(1);
    for (let i = 0; i < CLOCK_SECTORS; i++) {
        const a = -HALF_PI + i * sectorWidth;
        const x1 = Math.cos(a) * (hub.radius + 8);
        const y1 = Math.sin(a) * (hub.radius + 8);
        const x2 = Math.cos(a) * tableR;
        const y2 = Math.sin(a) * tableR;
        line(x1, y1, x2, y2);
    }

    noStroke();
    fill(255, 90);
    textAlign(CENTER, CENTER);
    textSize(11);
    textStyle(BOLD);
    for (let i = 0; i < CLOCK_SECTORS; i++) {
        const a = -HALF_PI + (i + 0.5) * sectorWidth;
        const lx = Math.cos(a) * (tableR + 18);
        const ly = Math.sin(a) * (tableR + 18);
        text(CLOCK_K_VALUES[i], lx, ly);
    }
    textStyle(NORMAL);

    pop();
}

function setupOriginalUI() {
    document.getElementById('mode-btn').onclick=()=>{
        setMode(currentMode+1);
    };
    // k is now controlled by the clock sector — drag the fruit around the hub
    // to change pulse count. Size +/- controls timbre (note duration).
    const onSizePlus  = () => { if (selectedCharacter) selectedCharacter.adjustSize(+1); };
    const onSizeMinus = () => { if (selectedCharacter) selectedCharacter.adjustSize(-1); };
    const sizePlus  = document.getElementById('btn-size-plus');
    const sizeMinus = document.getElementById('btn-size-minus');
    if (sizePlus)  sizePlus.onclick  = onSizePlus;
    if (sizeMinus) sizeMinus.onclick = onSizeMinus;
    document.getElementById('btn-n-plus').onclick=()=>{if(selectedCharacter&&selectedCharacter.n<32){selectedCharacter.n++;selectedCharacter.updateEuclidean();}};
    document.getElementById('btn-n-minus').onclick=()=>{if(selectedCharacter&&selectedCharacter.n>selectedCharacter.k&&selectedCharacter.n>2){selectedCharacter.n--;selectedCharacter.updateEuclidean();}};
}

function updateUI() {
    const btn=document.getElementById('mode-btn');
    btn.style.borderColor=set.color;
    document.querySelectorAll('.mode-dot').forEach((dot,i)=>{
        dot.style.background=i===currentMode?set.color:'rgba(255,255,255,.2)';
        dot.style.boxShadow=i===currentMode?`0 0 8px ${set.color}`:'none';
    });
}

function selectCharacter(c){if(selectedCharacter) selectedCharacter.isSelected=false; selectedCharacter=c; if(c) c.isSelected=true;}

const MAX_PARTICLES = 50;
const MAX_RIPPLES = 8;
function spawnParticles(x,y,c,count,maxSpeed){
    const shapes=['circle','rect','triangle'];
    for(let i=0;i<count;i++) particles.push({x,y,vx:random(-maxSpeed,maxSpeed),vy:random(-maxSpeed,maxSpeed),vr:random(-.2,.2),rotation:random(TWO_PI),size:random(10,30),c,alpha:255,decay:random(2,5),shape:random(shapes)});
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}
// Ripples are now smaller, slower, and shorter-lived by default.
// `opts.intensity` (0..1, default 0.6) scales their visual heaviness.
function spawnRipples(x,y,c,count,opts){
    const intensity = (opts && opts.intensity != null) ? opts.intensity : 0.6;
    for(let i=0;i<count;i++) ripples.push({
        x,y,
        size: 8,
        speed: random(2, 8) * intensity,
        weight: random(1, 3) * intensity,
        c,
        alpha: 140 * intensity,
        decay: random(5, 10)
    });
    if (ripples.length > MAX_RIPPLES) ripples.splice(0, ripples.length - MAX_RIPPLES);
}

// ═════════════════════════════════════════════════════════
//   COLOUR PALETTE DOCK  (drag chip → spawn character)
// ═════════════════════════════════════════════════════════
function setupPalette() {
    const palette = document.getElementById('palette');
    palette.innerHTML = '';
    COLOR_TYPES.forEach(t => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.dataset.color = t;
        chip.style.setProperty('--c', COLOR_DISPLAY[t].c);
        chip.style.setProperty('--c-light', COLOR_DISPLAY[t].light);
        chip.style.setProperty('--c-glow', COLOR_DISPLAY[t].glow);
        chip.addEventListener('pointerdown', e => startChipDrag(e, t));
        palette.appendChild(chip);
    });
}

function refreshPaletteChips() {
    document.querySelectorAll('#palette .chip').forEach(chip => {
        const t = chip.dataset.color;
        const role = colorToRole(t);
        chip.dataset.role = role || '— n/a';
        chip.classList.toggle('disabled', !role);
    });
}

function startChipDrag(e, color) {
    e.preventDefault(); e.stopPropagation();
    if (!isAudioInitialized) { ensureAudio(); }
    const role = colorToRole(color);
    if (!role) { showToast(`No ${color} role in ${set.name} — try another set`); return; }

    const ghost = document.getElementById('drag-ghost');
    ghost.style.setProperty('--c', COLOR_DISPLAY[color].c);
    ghost.style.setProperty('--c-light', COLOR_DISPLAY[color].light);
    ghost.style.setProperty('--c-glow', COLOR_DISPLAY[color].glow);
    ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
    ghost.classList.add('show');

    const onMove = em => { ghost.style.left = em.clientX + 'px'; ghost.style.top = em.clientY + 'px'; };
    const onUp = eu => {
        ghost.classList.remove('show');
        window.removeEventListener('pointermove', onMove);
        const overPalette = document.elementFromPoint(eu.clientX, eu.clientY)?.closest('#palette');
        if (overPalette) return;
        const targetRole = colorToRole(color);
        if (targetRole) spawnCharacter(targetRole, eu.clientX, eu.clientY, 'virtual', color);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
}

// ═════════════════════════════════════════════════════════
//   CAMERA   (color blob detection → spawn camera characters)
// ═════════════════════════════════════════════════════════
const camera = {
    stream: null, deviceId: null,
    mirror: false, showSilhouette: true, hasPermission: false,
    videoEl: null, previewEl: null,
    offCanvas: null, offCtx: null,
    lastDetect: 0
};

async function unlockLabels() {
    if (camera.hasPermission) return true;
    try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        camera.hasPermission = true;
        s.getTracks().forEach(t => t.stop());
        return true;
    } catch (e) { showToast('Camera permission denied'); return false; }
}

// Match anything that smells like a phone-class camera. macOS Continuity Camera
// labels typically include "iPhone" or the device's nickname; some browsers report
// "Camera (Continuity)" / "iOS Device". Built-in laptop cameras are explicitly
// excluded so a renamed iPhone is still detected as the "non-built-in" camera.
const BUILTIN_CAM_RE = /facetime|isight|hd camera|integrated|built-?in/i;
const IPHONE_CAM_RE  = /iphone|ipad|ios|continuity|camo/i;
function isIphoneLabel(s) { return IPHONE_CAM_RE.test(s || ''); }
function isBuiltinLabel(s) { return BUILTIN_CAM_RE.test(s || ''); }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

async function listVideoInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
}

async function refreshCameraList() {
    const sel = document.getElementById('camera-select');
    const cur = sel.value;
    const offOpt = '<option value="off">Off — virtual fruits only</option>';
    const rescanOpt = '<option value="rescan">↻ Rescan cameras</option>';
    if (!camera.hasPermission) {
        sel.innerHTML = offOpt + '<option value="enable">Enable camera…</option>';
        return;
    }
    const vids = await listVideoInputs();
    vids.sort((a, b) => (isIphoneLabel(a.label)?0:1) - (isIphoneLabel(b.label)?0:1));
    console.log('[camera] detected video inputs:', vids.map(d => ({ label: d.label, deviceId: d.deviceId })));
    let html = offOpt;
    vids.forEach(d => {
        const raw = d.label || `Camera ${d.deviceId.slice(0,6)}`;
        const lbl = isIphoneLabel(raw) ? `📱 ${raw}` : raw;
        html += `<option value="${d.deviceId}">${escapeHtml(lbl)}</option>`;
    });
    html += rescanOpt;
    sel.innerHTML = html;
    if (cur && [...sel.options].some(o => o.value === cur)) sel.value = cur;
    else if (camera.deviceId) sel.value = camera.deviceId;
}

async function selectCamera(deviceId) {
    if (camera.stream) { camera.stream.getTracks().forEach(t => t.stop()); camera.stream = null; }
    camera.deviceId = null;
    document.getElementById('cam-preview').classList.remove('show');
    const iphoneBtn = document.getElementById('iphone-btn');

    if (deviceId === 'off' || !deviceId) {
        // Drop all camera-source characters
        characters = characters.filter(c => c.source !== 'camera');
        if (selectedCharacter && selectedCharacter.source === 'camera') selectCharacter(null);
        localStorage.setItem('avp.cameraId', 'off');
        iphoneBtn.classList.remove('active');
        document.getElementById('camera-reopen').classList.remove('live');
        return;
    }

    const tryOpen = async (constraints) => navigator.mediaDevices.getUserMedia({ video: constraints });
    try {
        let s;
        try {
            s = await tryOpen({ deviceId: { exact: deviceId }, width:{ideal:640}, height:{ideal:480} });
        } catch (innerErr) {
            // Continuity Camera deviceIds can rotate between sessions, producing
            // OverconstrainedError. Fall back to the same camera by label match.
            console.warn('[camera] exact deviceId failed, retrying loosely:', innerErr.name);
            const sel = document.getElementById('camera-select');
            const targetLabel = ([...sel.options].find(o => o.value === deviceId) || {}).textContent || '';
            await refreshCameraList();
            const reMatched = [...document.getElementById('camera-select').options]
                .find(o => o.textContent === targetLabel && o.value !== 'off' && o.value !== 'enable');
            if (reMatched) {
                s = await tryOpen({ deviceId: { exact: reMatched.value }, width:{ideal:640}, height:{ideal:480} });
                deviceId = reMatched.value;
            } else {
                throw innerErr;
            }
        }
        camera.stream = s;
        camera.deviceId = deviceId;
        camera.videoEl.srcObject = s;
        camera.previewEl.srcObject = s;
        camera.previewEl.classList.add('show');
        await camera.videoEl.play().catch(()=>{});
        await camera.previewEl.play().catch(()=>{});
        localStorage.setItem('avp.cameraId', deviceId);
        const sel = document.getElementById('camera-select');
        const opt = [...sel.options].find(o => o.value === deviceId);
        iphoneBtn.classList.toggle('active', !!(opt && isIphoneLabel(opt.textContent)));
        document.getElementById('camera-reopen').classList.add('live');
    } catch (e) {
        console.warn('[camera] switch failed', e);
        const msg = e && e.name === 'NotAllowedError'
            ? 'Camera blocked by browser. Allow access in site settings.'
            : `Could not open that camera (${e && e.name || 'error'}). It may be in use by another app.`;
        showToast(msg);
        document.getElementById('camera-select').value = 'off';
    }
}

// macOS often takes several seconds to expose the iPhone as a video input device
// after Continuity Camera connects, even when everything else is configured right.
// Poll for up to ~15s, refresh the list along the way, and surface diagnostics.
let iphonePollInProgress = false;
async function useIphone() {
    if (iphonePollInProgress) return;
    iphonePollInProgress = true;
    const iphoneBtn = document.getElementById('iphone-btn');
    iphoneBtn.classList.add('active');

    setCameraPanelCollapsed(false);
    const sel = document.getElementById('camera-select');

    const ok = await unlockLabels();
    if (!ok) { iphonePollInProgress = false; iphoneBtn.classList.remove('active'); return; }

    const POLL_MS = 1000, MAX_TRIES = 15;
    let lastSeenLabels = [];
    for (let i = 0; i < MAX_TRIES; i++) {
        await refreshCameraList();
        const opts = [...sel.options].filter(o => o.value !== 'off' && o.value !== 'enable');
        lastSeenLabels = opts.map(o => o.textContent);

        const iphoneOpt = opts.find(o => isIphoneLabel(o.textContent));
        if (iphoneOpt) {
            sel.value = iphoneOpt.value;
            await selectCamera(iphoneOpt.value);
            showToast(`📱 Connected to ${iphoneOpt.textContent.replace(/^📱\s*/, '')}`);
            iphonePollInProgress = false;
            return;
        }

        if (i === 0) {
            showToast('Looking for iPhone… unlock it & keep it nearby');
        } else if (i === 4) {
            showToast('Still searching… try plugging the iPhone in via USB');
        }
        await new Promise(r => setTimeout(r, POLL_MS));
    }

    iphoneBtn.classList.remove('active');
    iphonePollInProgress = false;

    if (lastSeenLabels.length === 0) {
        showToast('No cameras at all detected. Check browser camera permission.', 6000);
    } else {
        const list = lastSeenLabels.map(l => l.replace(/^📱\s*/, '').replace(/^↻\s*/, '')).join(', ');
        showToast(`No iPhone found. Detected: ${list}. Pick from the dropdown, or enable Continuity Camera on iPhone (Settings → General → AirPlay & Handoff).`, 8000);
    }
    console.warn('[camera] iPhone not detected after polling. Visible cameras:', lastSeenLabels);
}

function rgb2hsv(r, g, b) {
    r/=255; g/=255; b/=255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b)/d) % 6;
        else if (max === g) h = (b - r)/d + 2;
        else h = (r - g)/d + 4;
        h *= 60; if (h < 0) h += 360;
    }
    return [h, max === 0 ? 0 : d/max, max];
}

function cameraDetectFrame(now) {
    if (!camera.stream || !camera.videoEl.videoWidth) return;
    if (now - camera.lastDetect < DETECT_INTERVAL_MS) return;
    camera.lastDetect = now;

    const ctx = camera.offCtx;
    const w = PROC_W, h = PROC_H;
    try {
        if (camera.mirror) {
            ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
            ctx.drawImage(camera.videoEl, 0, 0, w, h);
            ctx.restore();
        } else {
            ctx.drawImage(camera.videoEl, 0, 0, w, h);
        }
    } catch (e) { return; }
    const data = ctx.getImageData(0, 0, w, h).data;

    const CELL = 3;
    const cols = w/CELL, rows = h/CELL;
    const grid = new Int8Array(cols * rows);
    const TYPE_IDX = { red:1, orange:2, yellow:3, green:4, blue:5, purple:6 };
    const IDX_TYPE = ['','red','orange','yellow','green','blue','purple'];
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        const px = c*CELL+(CELL>>1), py = r*CELL+(CELL>>1);
        const i = (py*w+px)<<2;
        const [hh,ss,vv] = rgb2hsv(data[i], data[i+1], data[i+2]);
        let t = 0;
        for (const range of HSV_RANGES) if (range.test(hh,ss,vv)) { t = TYPE_IDX[range.type]; break; }
        grid[r*cols+c] = t;
    }

    // Connected components per color
    const visited = new Uint8Array(cols*rows);
    const blobs = [];
    const stack = [];
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
        const idx = r*cols+c;
        if (visited[idx] || grid[idx] === 0) continue;
        const t = grid[idx];
        let sumX=0, sumY=0, count=0;
        stack.length = 0; stack.push(idx); visited[idx]=1;
        while (stack.length) {
            const k = stack.pop();
            const kr = (k/cols)|0, kc = k - kr*cols;
            sumX += kc; sumY += kr; count++;
            const ns = [
                kr>0 ? k-cols : -1,
                kr<rows-1 ? k+cols : -1,
                kc>0 ? k-1 : -1,
                kc<cols-1 ? k+1 : -1
            ];
            for (let n=0;n<4;n++) { const nk=ns[n];
                if (nk>=0 && !visited[nk] && grid[nk]===t) { visited[nk]=1; stack.push(nk); } }
        }
        const blobType = IDX_TYPE[t];
        const minCells = COLOR_MIN_BLOB_CELLS[blobType] || MIN_BLOB_CELLS;
        if (count >= minCells) blobs.push({ type: blobType, cx: sumX/count, cy: sumY/count, count });
    }

    // Map normalized blob positions to canvas coords centered on hub
    const tableR = Math.min(width, height) * 0.42;
    const detected = blobs.map(b => ({
        type: b.type,
        x: hub.x + (b.cx/cols - 0.5) * tableR * 2.0,
        y: hub.y + (b.cy/rows - 0.5) * tableR * 2.0,
        count: b.count
    }));

    trackCameraCharacters(detected, now);
}

function trackCameraCharacters(detected, now) {
    // Group by color and limit per-color
    const byType = {};
    for (const d of detected) (byType[d.type] = byType[d.type] || []).push(d);
    for (const t in byType) { byType[t].sort((a,b)=>b.count-a.count); byType[t] = byType[t].slice(0, VOICE_CAP_PER_COLOR); }

    // Existing camera chars by color
    const existingByType = {};
    for (const c of characters) if (c.source==='camera') (existingByType[c.fruitColor] = existingByType[c.fruitColor] || []).push(c);

    for (const t of COLOR_TYPES) {
        const obs = byType[t] || [];
        const ex = existingByType[t] || [];
        const usedObs = new Set(), usedEx = new Set();
        const pairs = [];
        for (let i=0;i<ex.length;i++) {
            let best=-1, bestD=Infinity;
            for (let j=0;j<obs.length;j++) {
                if (usedObs.has(j)) continue;
                const dx = ex[i].x - obs[j].x, dy = ex[i].y - obs[j].y;
                const dd = dx*dx + dy*dy;
                if (dd < bestD) { bestD = dd; best = j; }
            }
            const tableR = Math.min(width,height) * 0.42;
            const matchThresh = (tableR*0.6) ** 2;
            if (best>=0 && bestD<matchThresh) { pairs.push([i,best]); usedEx.add(i); usedObs.add(best); }
        }
        for (const [i,j] of pairs) {
            const c = ex[i], o = obs[j];
            c.x = c.x + (o.x - c.x) * SMOOTH_ALPHA;
            c.y = c.y + (o.y - c.y) * SMOOTH_ALPHA;
            c.tx = c.x; c.ty = c.y;
            c.lastSeen = now;
            // Blob area drives fruit size (texture) — k is now angle-driven.
            c.setSizeFromBlob(o.count);
        }
        // Spawn new chars for unmatched obs
        for (let j=0;j<obs.length;j++) {
            if (usedObs.has(j)) continue;
            const o = obs[j];
            const role = colorToRole(t);
            if (!role) continue;
            const c = spawnCharacter(role, o.x, o.y, 'camera', t);
            if (c) { c.setSizeFromBlob(o.count); c.lastSeen = now; c.x = o.x; c.y = o.y; c.tx = o.x; c.ty = o.y; }
        }
    }

    // TTL: remove camera chars not seen recently
    for (let i=characters.length-1;i>=0;i--) {
        const c = characters[i];
        if (c.source==='camera' && c.lastSeen && now - c.lastSeen > FRUIT_TTL_MS) {
            if (selectedCharacter === c) selectCharacter(null);
            characters.splice(i, 1);
        }
    }
}

function drawCameraSilhouette() {
    if (!camera.stream || !camera.showSilhouette || !camera.videoEl.videoWidth) return;
    const tableR = Math.min(width, height) * 0.42;
    push();
    translate(hub.x, hub.y);
    // Circular clip
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.arc(0, 0, tableR * 0.95, 0, Math.PI * 2);
    drawingContext.clip();
    drawingContext.globalAlpha = 0.16;
    drawingContext.globalCompositeOperation = 'lighter';
    const vw = camera.videoEl.videoWidth, vh = camera.videoEl.videoHeight;
    const scale = (tableR * 2) / Math.min(vw, vh);
    const dw = vw * scale, dh = vh * scale;
    if (camera.mirror) {
        drawingContext.translate(dw / 2, -dh / 2);
        drawingContext.scale(-1, 1);
        drawingContext.drawImage(camera.videoEl, 0, 0, dw, dh);
    } else {
        drawingContext.drawImage(camera.videoEl, -dw / 2, -dh / 2, dw, dh);
    }
    drawingContext.restore();
    pop();
}

// ═════════════════════════════════════════════════════════
//   CAMERA UI WIRING
// ═════════════════════════════════════════════════════════
function setCameraPanelCollapsed(collapsed) {
    const panel = document.getElementById('camera-panel');
    const reopen = document.getElementById('camera-reopen');
    if (collapsed) {
        panel.classList.remove('show');
        panel.classList.add('collapsed');
        reopen.classList.add('show');
        // Show a green dot on the chip if a camera is currently live
        reopen.classList.toggle('live', !!camera.stream);
    } else {
        panel.classList.add('show');
        panel.classList.remove('collapsed');
        reopen.classList.remove('show');
    }
    try { localStorage.setItem('avp.camPanelCollapsed', collapsed ? '1' : '0'); } catch (e) {}
}

function setupCameraUI() {
    const sel = document.getElementById('camera-select');
    document.getElementById('camera-collapse').addEventListener('click', () => setCameraPanelCollapsed(true));
    document.getElementById('camera-reopen').addEventListener('click', () => setCameraPanelCollapsed(false));
    sel.addEventListener('change', async () => {
        const v = sel.value;
        if (v === 'enable') {
            const ok = await unlockLabels();
            if (ok) {
                await refreshCameraList();
                const real = [...sel.options].find(o => o.value !== 'off' && o.value !== 'enable' && o.value !== 'rescan');
                if (real) { sel.value = real.value; await selectCamera(real.value); }
                else sel.value = 'off';
            } else sel.value = 'off';
        } else if (v === 'rescan') {
            const prev = camera.deviceId || 'off';
            await unlockLabels();
            await refreshCameraList();
            const opts = [...sel.options].filter(o => !['off','enable','rescan'].includes(o.value));
            sel.value = prev;
            const labels = opts.map(o => o.textContent.replace(/^📱\s*/, '')).join(', ') || 'none';
            showToast(`Cameras: ${labels}`, 5000);
        } else {
            await selectCamera(v);
        }
    });
    document.getElementById('mirror-toggle').addEventListener('change', e => {
        camera.mirror = e.target.checked;
        document.getElementById('cam-preview').classList.toggle('mirror', camera.mirror);
    });
    document.getElementById('silhouette-toggle').addEventListener('change', e => {
        camera.showSilhouette = e.target.checked;
    });
    document.getElementById('iphone-btn').addEventListener('click', useIphone);

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', async () => {
            const before = [...sel.options].map(o => o.value);
            await refreshCameraList();
            const after = [...sel.options].map(o => o.value);
            const newOnes = after.filter(v => !before.includes(v) && !['off','enable','rescan'].includes(v));
            if (newOnes.length > 0) {
                const opt = [...sel.options].find(o => o.value === newOnes[0]);
                if (opt && isIphoneLabel(opt.textContent)) {
                    showToast('📱 iPhone camera detected — tap "Use iPhone"');
                    document.getElementById('iphone-btn').classList.add('active');
                }
            }
        });
    }
}

// ═════════════════════════════════════════════════════════
//   TOAST + BOOT
// ═════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg, ms) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms || 3200);
}

async function ensureAudio() {
    if (isAudioInitialized) return;
    await initAudio();
}

function showMainUI() {
    // Restore camera panel collapsed state (default: expanded)
    const wasCollapsed = (localStorage.getItem('avp.camPanelCollapsed') === '1');
    setCameraPanelCollapsed(wasCollapsed);
    document.getElementById('palette').classList.add('show');
    refreshPaletteChips();
}

function init() {
    camera.videoEl = document.getElementById('proc');
    camera.previewEl = document.getElementById('cam-preview');
    camera.offCanvas = document.createElement('canvas');
    camera.offCanvas.width = PROC_W; camera.offCanvas.height = PROC_H;
    camera.offCtx = camera.offCanvas.getContext('2d', { willReadFrequently: true });

    setupPalette();
    setupCameraUI();
    showMainUI();
}
init();

// ═════════════════════════════════════════════════════════
//   CHARACTER  (extends original v0 character with source/colour)
// ═════════════════════════════════════════════════════════
class Character {
    constructor(role,x,y,k,n,source,fruitColor) {
        this.role=role; this.x=x; this.y=y; this.tx=x; this.ty=y;
        this.source = source || 'virtual';
        this.fruitColor = fruitColor || null;
        this.lastSeen = 0;
        this.sizeIndex = SIZE_DEFAULT_INDEX;
        this.sizeMultiplier = SIZE_LEVELS[this.sizeIndex];
        this.baseSize = this._baseSizeForRole(role) * this.sizeMultiplier;
        this.size=this.baseSize;
        // Use the fruit colour palette for camera-source characters so colour reads true to the real fruit;
        // otherwise pick from the current set's accent colours.
        if (fruitColor) this.c = color(COLOR_DISPLAY[fruitColor].c).levels;
        else this.c = color(random([set.color, set.accent, '#ffffff'])).levels;
        this.active=true; this.autoMuted=false; this.pulseTimer=0; this.isSelected=false;
        this.shape = this._shapeForRole(role);
        this.k=k; this.n=n; this.sequence=[];
        this.updateEuclidean();
        this.noteIndex=floor(random(10));
    }
    _baseSizeForRole(role) {
        return ['kick','bass','sub'].includes(role)?40 : ['melody','reply'].includes(role)?32 : 25;
    }
    adjustSize(delta) {
        const next = Math.max(0, Math.min(SIZE_LEVELS.length - 1, this.sizeIndex + delta));
        if (next === this.sizeIndex) return;
        this.sizeIndex = next;
        this.sizeMultiplier = SIZE_LEVELS[next];
        this.baseSize = this._baseSizeForRole(this.role) * this.sizeMultiplier;
        spawnRipples(this.x, this.y, this.c, 1, { intensity: 0.4 });
    }
    setSizeFromBlob(blobCount) {
        const t = Math.max(0, Math.min(1, (blobCount - 5) / 60));
        const idx = Math.round(t * (SIZE_LEVELS.length - 1));
        if (idx === this.sizeIndex) return;
        this.sizeIndex = idx;
        this.sizeMultiplier = SIZE_LEVELS[idx];
        this.baseSize = this._baseSizeForRole(this.role) * this.sizeMultiplier;
    }
    _shapeForRole(role) {
        return {kick:'rect',hat:'triangle',snare:'hexagon',openhat:'pentagon',rim:'cross',bass:'ellipse',sub:'circle',melody:'star',reply:'diamond',arp:'zigzag',prism:'octagon',bloom:'flower',ghost:'cloud',pulse:'dot',pad:'wave'}[role]||'circle';
    }
    morphRole(newRole) {
        this.role = newRole;
        this.shape = this._shapeForRole(newRole);
        this.baseSize = this._baseSizeForRole(newRole) * this.sizeMultiplier;
        // k will be re-derived from the clock sector on the next update().
        this.updateEuclidean();
        spawnRipples(this.x, this.y, this.c, 1);
    }

    updateEuclidean(){this.sequence=[];for(let i=0;i<this.n;i++) this.sequence.push((i*this.k)%this.n<this.k?1:0);}

    playSound(time,step) {
        const sc=set.scale;
        const v = distanceVelocity(this.x, this.y);
        const sm = this.sizeMultiplier || 1;
        if(this.role==='kick') synths.kick.triggerAttackRelease("C1", durSec("8n", sm), time, v);
        else if(this.role==='hat') synths.hat.triggerAttackRelease(durSec("16n", sm), time, v);
        else if(this.role==='snare') synths.snare.triggerAttackRelease(durSec("16n", sm), time, v);
        else if(this.role==='openhat') synths.openhat.triggerAttackRelease(durSec("8n", sm), time, v);
        else if(this.role==='rim') synths.rim.triggerAttackRelease("G4", durSec("32n", sm), time, v);
        else if(this.role==='bass') synths.bass.triggerAttackRelease(random(sc.slice(0,3)), durSec("8n", sm), time, v);
        else if(this.role==='sub') synths.sub.triggerAttackRelease(sc[0].replace(/\d/,'1'), durSec("4n", sm), time, v);
        else if(this.role==='melody'){synths.solo.triggerAttackRelease(sc[this.noteIndex%sc.length], durSec("8n", sm), time, v); this.noteIndex++;}
        else if(this.role==='reply'){synths.reply.triggerAttackRelease(sc[(this.noteIndex+3)%sc.length], durSec("8n", sm), time, v); this.noteIndex++;}
        else if(this.role==='arp'){synths.arp.triggerAttackRelease(sc[this.noteIndex%sc.length], durSec("16n", sm), time, v); this.noteIndex++;}
        else if(this.role==='prism') synths.prism.triggerAttackRelease(random(sc.slice(5)), durSec("16n", sm), time, v);
        else if(this.role==='bloom') synths.bloom.triggerAttackRelease(random(sc.slice(4)), durSec("16n", sm), time, v);
        else if(this.role==='ghost') synths.ghost.triggerAttackRelease(durSec("8n", sm), time, v);
        else if(this.role==='pulse') synths.pulse.triggerAttackRelease(sc[4]||"E4", durSec("16n", sm), time, v);
        else if(this.role==='pad') synths.pad.triggerAttackRelease(random(set.padScale), durSec("4n", sm), time, v);
    }

    pulse(){
        if(!this.active) return;
        this.pulseTimer = 15;
        this.size = this.baseSize * 1.4;
        // Only emit a ripple on downbeats (every 4 sixteenth-notes), and make it subtler.
        // Quieter roles (hat, rim, bell-ish) also skip ripples to keep the screen calm.
        const subtleRoles = { hat:1, rim:1, openhat:1, snare:1, prism:1, pulse:1 };
        if (stepCount % 4 === 0 && !subtleRoles[this.role]) {
            spawnRipples(this.x, this.y, this.c, 1, { intensity: 0.55 });
        }
    }

    update(){
        if(this.source !== 'camera'){
            if(this.active){this.x=lerp(this.x,this.tx,0.05);this.y=lerp(this.y,this.ty,0.05);if(!this.isSelected&&!gestureState.active&&frameCount%60===0&&random()>0.7){this.tx=this.x+random(-40,40);this.ty=this.y+random(-40,40);}}
            this.tx=constrain(this.tx,50,width-50);this.ty=constrain(this.ty,50,height-50);
        }
        // Re-derive Euclidean pulse count from the clock sector under the fruit.
        const newK = Math.max(1, Math.min(this.n - 1, angleToK(this.x, this.y)));
        if (newK !== this.k) { this.k = newK; this.updateEuclidean(); }
        this.size=lerp(this.size,this.baseSize,0.1);if(this.pulseTimer>0)this.pulseTimer--;
    }

    display(){
        push();translate(this.x,this.y);
        const isHovered=dist(mouseX,mouseY,this.x,this.y)<this.baseSize+30;
        if(this.isSelected||(isHovered&&!gestureState.active)){
            const pr=this.baseSize+25, as=TWO_PI/this.n;
            stroke(this.c[0],this.c[1],this.c[2],this.active?50:20);strokeWeight(1);fill(this.c[0],this.c[1],this.c[2],this.active?10:5);
            beginShape();for(let i=0;i<this.n;i++){const a=i*as-HALF_PI;vertex(cos(a)*pr,sin(a)*pr);}endShape(CLOSE);
            const ls=stepCount%this.n;
            for(let i=0;i<this.n;i++){const a=i*as-HALF_PI,px=cos(a)*pr,py=sin(a)*pr;noStroke();if(!this.active)fill(30,30,30,100);else if(this.sequence[i]===1)fill(this.c[0],this.c[1],this.c[2],200);else fill(50,50,50,150);const ns=(this.active&&i===ls)?12:6;if(this.active&&i===ls)fill(255);ellipse(px,py,ns);}
            if(this.isSelected){noFill();stroke(255,150);strokeWeight(2);drawingContext.setLineDash([5,5]);ellipse(0,0,pr*2+20);drawingContext.setLineDash([]);}
        }
        noStroke();const al=this.active?220:80;if(!this.active)fill(60,60,60,al);else fill(this.c[0],this.c[1],this.c[2],al);
        const bounce=(this.active&&this.pulseTimer>0)?sin(frameCount*0.5)*10:0;translate(0,bounce);
        this.drawShape();
        const ea=this.active?255:30;fill(ea);const es=this.baseSize*0.25;
        const ex=constrain((mouseX-this.x)*0.05,-this.baseSize/4,this.baseSize/4),ey=constrain((mouseY-this.y)*0.05,-this.baseSize/4,this.baseSize/4);
        if(this.active){ellipse(-this.baseSize/4+ex,ey,es);ellipse(this.baseSize/4+ex,ey,es);fill(0);ellipse(-this.baseSize/4+ex,ey,es/2);ellipse(this.baseSize/4+ex,ey,es/2);}
        else{stroke(40);strokeWeight(2);line(-this.baseSize/4-es/2,0,-this.baseSize/4+es/2,0);line(this.baseSize/4-es/2,0,this.baseSize/4+es/2,0);noStroke();}
        // Source ring (camera-detected vs virtual)
        if (this.source === 'camera') {
            noFill(); stroke(this.c[0],this.c[1],this.c[2], 120); strokeWeight(1.4);
            drawingContext.setLineDash([4,4]);
            ellipse(0, 0, this.baseSize*1.6);
            drawingContext.setLineDash([]);
        }
        pop();
    }

    drawShape(){
        const s=this.size;
        if(this.shape==='rect'){rectMode(CENTER);rect(0,0,s,s,8);}
        else if(this.shape==='ellipse')ellipse(0,0,s*1.2,s*0.8);
        else if(this.shape==='circle')ellipse(0,0,s);
        else if(this.shape==='triangle')triangle(-s/2,s/2,s/2,s/2,0,-s/2);
        else if(this.shape==='star')this._star(0,0,s/3,s/1.5,5);
        else if(this.shape==='hexagon')this._poly(0,0,s/1.2,6);
        else if(this.shape==='pentagon')this._poly(0,0,s/1.2,5);
        else if(this.shape==='octagon')this._poly(0,0,s/1.2,8);
        else if(this.shape==='diamond'){push();rotate(QUARTER_PI);rectMode(CENTER);rect(0,0,s*0.8,s*0.8,4);pop();}
        else if(this.shape==='cloud'){ellipse(0,0,s,s*0.6);ellipse(-s*0.3,-s*0.1,s*0.6);ellipse(s*0.3,-s*0.2,s*0.7);}
        else if(this.shape==='cross'){rectMode(CENTER);rect(0,0,s*0.3,s,3);rect(0,0,s,s*0.3,3);}
        else if(this.shape==='zigzag'){beginShape();const w=s*0.6,h=s*0.5;vertex(-w,h);vertex(-w/2,-h);vertex(0,h);vertex(w/2,-h);vertex(w,h);endShape();}
        else if(this.shape==='flower'){for(let a=0;a<TWO_PI;a+=TWO_PI/5)ellipse(cos(a)*s*0.3,sin(a)*s*0.3,s*0.5);ellipse(0,0,s*0.4);}
        else if(this.shape==='dot'){ellipse(0,0,s*0.6);noFill();stroke(this.active?this.c:[60,60,60]);strokeWeight(2);ellipse(0,0,s);noStroke();}
        else ellipse(0,0,s);
    }
    _star(x,y,r1,r2,n){const a=TWO_PI/n,h=a/2;beginShape();for(let i=-PI/2;i<TWO_PI-PI/2;i+=a){vertex(x+cos(i)*r2,y+sin(i)*r2);vertex(x+cos(i+h)*r1,y+sin(i+h)*r1);}endShape(CLOSE);}
    _poly(x,y,r,n){const a=TWO_PI/n;beginShape();for(let i=0;i<TWO_PI;i+=a)vertex(x+cos(i)*r,y+sin(i)*r);endShape(CLOSE);}
}
