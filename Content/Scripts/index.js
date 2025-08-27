// --------------- guard ---------------
if (!window.PIXI) throw new Error("PIXI not loaded. Include pixi.js before index.js");

// --------------- app ---------------
const app = new PIXI.Application({ width: 1280, height: 720, backgroundColor: 0x000000 });
app.stage.sortableChildren = true;

const container = document.createElement("div");
container.id = "game-container";
container.style.position = "fixed";
container.style.top = "0";
container.style.left = "0";
container.style.right = "0";
container.style.margin = "0 auto";
container.style.zIndex = "0";
document.body.appendChild(container);
container.appendChild(app.view);

const style = document.createElement("style");
style.textContent = `#game-container canvas{display:block}`;
document.head.appendChild(style);

const REELS_COLS = 5, REELS_ROWS = 3, CELL = 110, REEL_GAP = 0;
let reels;
const CELL_PAD = 0;

function resizeGame()
{
    const baseW = 1280, baseH = 720;
    let scale = window.innerWidth / baseW;
    if (baseH * scale > window.innerHeight)
    {
        scale = window.innerHeight / baseH;
    }
    const cssW = Math.floor(baseW * scale);
    const cssH = Math.floor(baseH * scale);

    app.view.style.width = cssW + "px";
    app.view.style.height = cssH + "px";

    container.style.width = cssW + "px";
    container.style.height = cssH + "px";
}
window.addEventListener("resize", resizeGame);
resizeGame();

// --------------- background ---------------
async function createBackground()
{
    //const url = "./Content/Images/background.jpg";
    const url = "./src/images/background.png";

    try
    {
        const tex = await loadTexture(url);
        const spr = new PIXI.Sprite(tex);
        const scale = Math.max(app.screen.width/tex.width, app.screen.height/tex.height);
        spr.width = tex.width*scale;
        spr.height = tex.height*scale;
        
        spr.x = (app.screen.width - spr.width)/2;
        spr.y = (app.screen.height - spr.height)/2;
        //placeSpriteInCell(spr, 0, spr.y);
        spr.zIndex = 0;
        app.stage.addChild(spr);
        console.log("[BG] Loaded successfully");
    }
    catch(e)
    {
        console.warn("[BG] Failed:", e);
    }

    function loadTexture(src)
    {
        if (PIXI.Assets?.load)
        {
            const id = `bg-${Date.now()}`; PIXI.Assets.add({alias:id, src}); return PIXI.Assets.load(id);
        }
        if (PIXI.Loader)
        {
            return new Promise((resolve, reject)=>
            {
                new PIXI.Loader().add("bg", src).load((_,res)=>res.bg?.texture?resolve(res.bg.texture):reject(new Error("no texture")));
            });
        }
        throw new Error("No loader available");
    }
}

// --------------- foreground frame (above reels) ---------------
async function addReelsFrame(imagePath, innerRect)
{
  const totalW = REELS_COLS * CELL + (REELS_COLS - 1) * REEL_GAP;
  const totalH = REELS_ROWS * CELL;
  
  function loadTexture(src)
  {
    if (PIXI.Assets?.load)
    {
        const id = `frame-${Date.now()}`;
        PIXI.Assets.add({ alias: id, src });
        return PIXI.Assets.load(id);
    }
    if (PIXI.Loader)
    {
        return new Promise((resolve, reject) =>
        {
            new PIXI.Loader().add("frameTex", src).load((_, res) =>
            res.frameTex?.texture ? resolve(res.frameTex.texture) : reject(new Error("no texture")));
        });
    }
    throw new Error("No loader available");
  }

  try {
    const tex = await loadTexture(imagePath);
    const spr = new PIXI.Sprite(tex);

    // ჩარჩოს შიდა ფანჯარა → რეელების ფანჯარა
    const sx = totalW / innerRect.width / 1.8;
    const sy = totalH / innerRect.height / 1.8;
    const s  = Math.min(sx, sy);
    spr.scale.set(s);

    // ჩარჩოს ასე ვასწორებთ, რომ innerRect-ის (x,y) ზუსტად მოიყვანოს reels.root-ის (0,0)-ზე
    spr.x = reels.root.x - innerRect.x * s -70;
    spr.y = reels.root.y - innerRect.y * s - 230;

    spr.zIndex = 50; // ზემოთ რეელებზე (რეელების root = zIndex 10)
    app.stage.addChild(spr);

    console.log("[FRAME] Loaded successfully");
  } catch (e) {
    console.warn("[FRAME] Failed:", e);
  }
}

// --------------- HUD ---------------
const BETS = [0.5, 1, 5, 10, 20, 30, 40, 50, 100, 200];
let activeBetIndex = 1;
let balance = 0, win = 0;
let balanceText, betText, winText, spinBtnRef;
let isTurbo = false;

function createHUD()
{
    const st = new PIXI.TextStyle({ fontFamily:"Arial", fontSize: 32, fill: 0xffffff });
    balanceText = new PIXI.Text("Balance: 0", st); balanceText.x=20; balanceText.y=20;
    betText     = new PIXI.Text("Bet: 0", st);     betText.x=20;     betText.y=60;
    winText     = new PIXI.Text("Win: 0", st);     winText.x=20;     winText.y=100;
    app.stage.addChild(balanceText, betText, winText);
}
function updateHUD()
{
    balanceText.text = "Balance: " + Number(balance||0).toFixed(2);
    betText.text     = "Bet: "     + Number(BETS[activeBetIndex]||1).toFixed(2);
    winText.text     = "Win: "     + Number(win||0).toFixed(2);
}

// --- SYMBOLS from atlases ---
const SYMBOL_WHITELIST = [
  "spin-7",
  "spin-a",
  "spin-b",
  "spin-c",
  "spin-ch",
  "spin-f",
  "spin-j",
  "spin-k",
  "spin-p",
  "spin-s",
  "spin-w"
];

const SYMBOL_PATHS = {
  "spin-7":  "./src/images/spin-7.png",
  "spin-a":  "./src/images/spin-a.png",
  "spin-b":  "./src/images/spin-b.png",
  "spin-c":  "./src/images/spin-c.png",
  "spin-ch": "./src/images/spin-ch.png",
  "spin-f":  "./src/images/spin-f.png",
  "spin-j":  "./src/images/spin-j.png",
  "spin-k":  "./src/images/spin-k.png",
  "spin-p":  "./src/images/spin-p.png",
  "spin-s":  "./src/images/spin-s.png",
  "spin-w":  "./src/images/spin-w.png"
};

let symbolTextures = {};   // frameName -> PIXI.Texture
let SYMBOL_KEYS = [];
// ბექინგ-მაპი (თუ ჯერ არ გაქვს გამოცხადებული)
symbolTextures = typeof symbolTextures !== "undefined" ? symbolTextures : {};
SYMBOL_KEYS     = typeof SYMBOL_KEYS !== "undefined" ? SYMBOL_KEYS : [];

// პატარა ჰელპერები
function pickKeyList()
{
    return (SYMBOL_WHITELIST && SYMBOL_WHITELIST.length) ? SYMBOL_WHITELIST : SYMBOL_KEYS;
}

function getTextureByKey(key)
{
    return symbolTextures[key] || null;
}

async function loadSymbolImages()
{
    return new Promise((resolve) =>
    {
        const loader = new PIXI.Loader();
        SYMBOL_WHITELIST.forEach(key =>
        {
            loader.add(key, SYMBOL_PATHS[key]);
        });
        loader.load((_, resources) =>
        {
            SYMBOL_WHITELIST.forEach(key =>
            {
                symbolTextures[key] = resources[key].texture;
            });
            resolve();
        });
    });
}

function getTextureByIndex(i)
{
    const list = SYMBOL_WHITELIST && SYMBOL_WHITELIST.length ? SYMBOL_WHITELIST : SYMBOL_KEYS;
    if (!list || !list.length) return null;
    const n = list.length;
    const num = Number.isFinite(i) ? Math.trunc(i) : 0;
    // proper modulo in [0..n-1]
    const idx = ((num % n) + n) % n;
    const key = list[idx];
  return symbolTextures[key] || null;
}

function normalizeReelsData(raw)
{
    if (Array.isArray(raw) && raw.length === REELS_COLS && Array.isArray(raw[0])) {
        return raw;
    }
        if (Array.isArray(raw) && raw.length === REELS_COLS * REELS_ROWS)
        {
            const out = [];
            for (let c = 0; c < REELS_COLS; c++) {
            out[c] = [];
            for (let r = 0; r < REELS_ROWS; r++) {
                out[c][r] = raw[c * REELS_ROWS + r];
            }
        }
        return out;
    }
    return Array.from({ length: REELS_COLS }, () => Array(REELS_ROWS).fill(0));
}

// --------------- Spin button ---------------
function createSpinButton()
{
  const btn = new PIXI.Graphics();
  btn.beginFill(0x00ff00).drawRoundedRect(0,0,160,60,10).endFill();
  btn.x = app.screen.width - 220; btn.y = app.screen.height - 100;
  btn.interactive = true; btn.buttonMode = true;

  const label = new PIXI.Text("SPIN", { fontFamily:"Arial", fontSize:28, fontWeight:"bold", fill:0x000000 });
  label.anchor.set(0.5); label.x=80; label.y=30; btn.addChild(label);

  btn.on("pointerdown", onSpinClick);
  app.stage.addChild(btn);
  spinBtnRef = btn;
}

// --------------- Bet button ---------------
function createBetButtons()
{
    const makeBtn = (text, onClick) =>
    {
        const g = new PIXI.Graphics();
        g.beginFill(0x244357).drawRoundedRect(0,0,64,48,10).endFill();
        g.interactive = true; g.buttonMode = true;

        const t = new PIXI.Text(text, { fontFamily:"Arial", fontSize:28, fontWeight:"bold", fill:0xffffff });
        t.anchor.set(0.5); t.x=32; t.y=24;
        g.addChild(t);
        g.on('pointerdown', onClick);
        return g;
    };

    const minus = makeBtn("–", () =>
    {
        activeBetIndex = Math.max(0, activeBetIndex - 1);
        updateHUD();
    });

    const plus  = makeBtn("+", () =>
    {
        activeBetIndex = Math.min(BETS.length - 1, activeBetIndex + 1);
        updateHUD();
    });

    minus.x = 20;           minus.y = 140;
    plus.x  = 20 + 72;      plus.y  = 140;

    app.stage.addChild(minus, plus);
}

// --------------- Turbo button ---------------
function createTurboButton()
{
    const btn = new PIXI.Graphics();
    btn.beginFill(0x2a2a2a).drawRoundedRect(0,0,160,48,10).endFill();
    btn.interactive = true; btn.buttonMode = true;

    const label = new PIXI.Text("TURBO: OFF", { fontFamily:"Arial", fontSize:18, fontWeight:"bold", fill:0xffffff });
    label.anchor.set(0.5); label.x = 80; label.y = 24;
    btn.addChild(label);

    btn.x = app.screen.width - 220 - 180;
    btn.y = app.screen.height - 96;

    btn.on('pointerdown', () =>
    {
        isTurbo = !isTurbo;
        label.text = isTurbo ? "TURBO: ON" : "TURBO: OFF";
        btn.tint = isTurbo ? 0xffa200 : 0xffffff;
    });

    app.stage.addChild(btn);
}

const FRAME_IMAGE_PATH = "./src/images/board.png";

const FRAME_INNER_RECT =
{
    x: 90,
    y: 86,
    width:  REELS_COLS * CELL + (REELS_COLS - 1) * REEL_GAP,
    height: REELS_ROWS * CELL
};

function placeSpriteInCell(spr, cellX, cellY)
{
    spr.anchor.set(0.5);
    spr.x = cellX + CELL / 2;
    spr.y = cellY + CELL / 2;

    const maxW = CELL - CELL_PAD;
    const maxH = CELL - CELL_PAD;

    const texW = spr.texture.width  || maxW;
    const texH = spr.texture.height || maxH;

    const s = Math.min(maxW / texW, maxH / texH);
    spr.scale.set(s);
}

class ReelsEngine
{
    constructor(app)
    {
        this.app=app;
        this.root=new PIXI.Container();
        this.root.zIndex=10;
        const totalW = REELS_COLS*CELL+(REELS_COLS-1)*REEL_GAP;
        const totalH = REELS_ROWS*CELL;
        
        this.root.x=(app.screen.width-totalW)/2;
        this.root.y=(app.screen.height-totalH)/2;

        const maskShape = new PIXI.Graphics();
        maskShape.beginFill(0xffffff).drawRoundedRect(0, 0, totalW, totalH, 16).endFill();
        this.root.addChild(maskShape);
        this.root.mask = maskShape;

        this.cols = [];
        for (let c = 0; c < REELS_COLS; c++)
        {
            const col = new PIXI.Container();
            col.x = c * (CELL + REEL_GAP);
            this.root.addChild(col);
            this.cols.push(col);
        }
        this.spinningCols = new Array(REELS_COLS).fill(false);

        this.spinning = false;
        this.scroll = 0;
        this.speed = 10;
        this._tick=(d)=>{ if(!this.spinning) return; this.scroll+=this.speed*d; this.drawSpinning(); };
        app.stage.addChild(this.root);
        app.ticker.add(this._tick);
    }
    startSpin(speedFactor = 1)
    {
        this.spinning = true;
        this.speed = 22 * speedFactor;
        this.cols.forEach(c => c.removeChildren());
        this.spinningCols.fill(true);
    }
    async stopWithResult(result, { perReelDelay = 120, stopTime = 280 } = {})
    {
        for (let c = 0; c < REELS_COLS; c++)
        {
            await wait(perReelDelay);
            await this.stopOneColumn(c, result[c]);
        }
        await wait(stopTime);
        this.spinning = false;
    }
    async stopOneColumn(colIndex, colResult)
    {
        this.spinningCols[colIndex] = false;

        const col = this.cols[colIndex];
        col.removeChildren();

        for (let r = 0; r < REELS_ROWS; r++)
        {
            const idx = colResult[r];
            const tex = getTextureByIndex(idx);
            const y = r * CELL;

            if (tex)
            {
                const spr = new PIXI.Sprite(tex);
                placeSpriteInCell(spr, 0, y);
                col.addChild(spr);
            }
            else
            {
                const g = new PIXI.Graphics();
                g.beginFill(0x123c2b).drawRoundedRect(0, y, CELL, CELL, 12).endFill();
                const t = new PIXI.Text(String(idx), { fontFamily: "Arial", fontSize: 32, fontWeight: "bold", fill: 0xe7f0ff });
                t.anchor.set(0.5); t.x = CELL/2; t.y = y + CELL/2;
                col.addChild(g, t);
            }

            await wait(80);
        }
    }
    clear()
    {
        this.cols.forEach(c=>c.removeChildren());
    }
    drawSpinning()
    {
        for (let c = 0; c < REELS_COLS; c++)
        {
            if (!this.spinningCols[c]) continue;

            const col = this.cols[c];
            col.removeChildren();

            for (let r = -1; r < REELS_ROWS + 1; r++)
            {
                const y = (r * CELL + (this.scroll % CELL));
                const tex = getTextureByIndex(Math.floor(Math.random() * (SYMBOL_WHITELIST?.length || SYMBOL_KEYS.length)));
                if (tex)
                {
                    const spr = new PIXI.Sprite(tex);
                    placeSpriteInCell(spr, 0, y);
                    col.addChild(spr);
                }
                else
                {
                    const g = new PIXI.Graphics();
                    g.beginFill(0x123c2b).drawRoundedRect(0, y, CELL, CELL, 12).endFill();
                    const t = new PIXI.Text("?", { fontFamily: "Arial", fontSize: 28, fontWeight: "bold", fill: 0x28f77a });
                    t.anchor.set(0.5); t.x = CELL / 2; t.y = y + CELL / 2;
                    col.addChild(g, t);
                }
            }
        }
    }
    async drawColumnStopped(c, arr)
    {
        const col = this.cols[c];
        col.removeChildren();

        for (let r = 0; r < REELS_ROWS; r++)
        {
            const symIndex = arr[r];
            const tex = getTextureByIndex(symIndex);
            const y = r * CELL;

            if (tex)
            {
                const spr = new PIXI.Sprite(tex);
                placeSpriteInCell(spr, 0, y);
                col.addChild(spr);
            }
            else
            {
                const color = (symIndex === 0) ? 0x1b2bff : 0x123c2b;
                const g = new PIXI.Graphics();
                g.beginFill(color).drawRoundedRect(0, y, CELL, CELL, 12).endFill();
                const t = new PIXI.Text(String(symIndex), {
                    fontFamily: "Arial",
                    fontSize: 32,
                    fontWeight: "bold",
                    fill: 0xe7f0ff
                });
                t.anchor.set(0.5);
                t.x = CELL / 2;
                t.y = y + CELL / 2;
                col.addChild(g, t);
            }

            await wait(80);
        }
    }
}
function pickColor(i){ const arr=[0x28f77a,0xffe066,0xff8a00,0xff4d6d,0x3dd8ff,0xb16eff,0x7cf3ff,0xf3a1ff,0x8cf58e,0xf5c58c]; return arr[i%arr.length]; }
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

// --------------- Wheel (simple) ---------------
let wheel;
class Wheel
{
    constructor(app)
    {
        this.app=app; this.root=new PIXI.Container(); this.root.zIndex=20;
        this.root.x = app.screen.width - 160; this.root.y = 160;

        const bg=new PIXI.Graphics(); bg.beginFill(0x0d2230).drawCircle(0,0,60).endFill(); bg.lineStyle(4,0x1f3a4b).drawCircle(0,0,62); this.root.addChild(bg);
        for(let i=0;i<5;i++){ const line=new PIXI.Graphics(); line.lineStyle(2,0xffffff,0.4); line.moveTo(0,0); const a=i*(Math.PI*2/5); line.lineTo(Math.cos(a)*60, Math.sin(a)*60); this.root.addChild(line); }
        this.center = new PIXI.Text("1x",{fontFamily:"Arial",fontSize:20,fontWeight:"bold",fill:0xffffff}); this.center.anchor.set(0.5); this.root.addChild(this.center);

        app.stage.addChild(this.root);
        this.running=false; this.spinSpeed=0.12;
        this._tick=(d)=>{ if(!this.running) return; this.root.rotation += this.spinSpeed*d; };
        app.ticker.add(this._tick);
    }

    start(speed=1){ this.running=true; this.spinSpeed=0.12*speed; }
    async stopOn(mult,{duration=900}={})
    {
        const seg=(Math.PI*2)/5, target=(mult-0.5)*seg;
        const current=this.root.rotation%(Math.PI*2); let final=target; while(final<current) final+=Math.PI*2; final+=Math.PI*2*2;
        const start=current, diff=final-start, t0=performance.now(); this.running=false;
        await new Promise(res=>{ const step=(t)=>{ const k=Math.min(1,(t-t0)/duration), e=1-Math.pow(1-k,3); this.root.rotation=start+diff*e; if(k<1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step);});
        this.center.text = `${mult}x`;
    }
}

// --------------- flow ---------------
let balanceFetched = false;

async function init()
{
    await createBackground();
    await loadSymbolImages();

    const info = await GetBoard();
    balance = Number(info.Balance ?? info.balance ?? 0);
    win     = Number(info.Win ?? info.win ?? 0);

    createHUD();
    updateHUD();
    createSpinButton();
    createBetButtons();
    createTurboButton();

    reels = new ReelsEngine(app);
    await addReelsFrame(FRAME_IMAGE_PATH, FRAME_INNER_RECT);
    wheel = new Wheel(app);
}
init();

async function onSpinClick()
{
    if (spinBtnRef)
        spinBtnRef.interactive = false;

    const bet = BETS[activeBetIndex];

    const speedFactor = isTurbo ? 2.2 : 1.4;
    reels.startSpin(speedFactor);
    wheel.start(speedFactor);

    const result = await GetBoard(bet);

    await wheel.stopOn(
        Number(result.Multiplier ?? result.multiplier ?? 1),
        { duration: isTurbo ? 300 : 500 }
    );

    const reelsRaw  = result.Baraban ?? result.reels;
    const reelsData = normalizeReelsData(reelsRaw);
    await reels.stopWithResult(reelsData, {
        perReelDelay: isTurbo ? 5 : 10,
        stopTime:     isTurbo ? 50 : 100
    });

    balance = Number(result.Balance ?? result.balance ?? balance);
    win     = Number(result.Win ?? result.win ?? 0);
    updateHUD();

    if (spinBtnRef) spinBtnRef.interactive = true;
}