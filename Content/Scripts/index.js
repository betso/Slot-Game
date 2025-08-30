if (!window.PIXI) throw new Error("PIXI not loaded. Include pixi.js before index.js");

// --------------- properties ---------------
const BETS = [0.5, 1, 5, 10, 20, 30, 40, 50, 100, 200];
let activeBetIndex = 1;
let balance = 0, win = 0;

let backgroundHeight;
let wheel;
let balanceFetched = false;

const REELS_COLS = 5, REELS_ROWS = 3, CELL = 110, REEL_GAP = 0;
let reels;
const CELL_PAD = 0;
const FRAME_INNER_RECT =
{
    x: 90,
    y: 86,
    width:  REELS_COLS * CELL + (REELS_COLS - 1) * REEL_GAP,
    height: REELS_ROWS * CELL
};
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
  "spin-7":  "./Content/Images/spin-7.png",
  "spin-a":  "./Content/Images/spin-a.png",
  "spin-b":  "./Content/Images/spin-b.png",
  "spin-c":  "./Content/Images/spin-c.png",
  "spin-ch": "./Content/Images/spin-ch.png",
  "spin-f":  "./Content/Images/spin-f.png",
  "spin-j":  "./Content/Images/spin-j.png",
  "spin-k":  "./Content/Images/spin-k.png",
  "spin-p":  "./Content/Images/spin-p.png",
  "spin-s":  "./Content/Images/spin-s.png",
  "spin-w":  "./Content/Images/spin-w.png"
};

let symbolTextures = {};
let SYMBOL_KEYS = [];

symbolTextures = typeof symbolTextures !== "undefined" ? symbolTextures : {};
SYMBOL_KEYS     = typeof SYMBOL_KEYS !== "undefined" ? SYMBOL_KEYS : [];
// --------------- properties ---------------

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
// --------------- app ---------------

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
    let symbols = new Promise((resolve) =>
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
    return symbols;
}

function getTextureByIndex(i)
{
    const list = SYMBOL_WHITELIST && SYMBOL_WHITELIST.length ? SYMBOL_WHITELIST : SYMBOL_KEYS;
    if (!list || !list.length) return null;
    const n = list.length;
    const num = Number.isFinite(i) ? Math.trunc(i) : 0;
    
    const idx = ((num % n) + n) % n;
    const key = list[idx];
  return symbolTextures[key] || null;
}

function normalizeReelsData(raw)
{
    if (Array.isArray(raw) && raw.length === REELS_COLS && Array.isArray(raw[0]))
    {
        return raw;
    }
    if (Array.isArray(raw) && raw.length === REELS_COLS * REELS_ROWS)
    {
        const out = [];
        for (let c = 0; c < REELS_COLS; c++)
        {
            out[c] = [];
            for (let r = 0; r < REELS_ROWS; r++)
            {
                out[c][r] = raw[c * REELS_ROWS + r];
            }
        }
        return out;
    }
    return Array.from({ length: REELS_COLS }, () => Array(REELS_ROWS).fill(0));
}

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

async function init()
{
    await createBackground();
    await loadSymbolImages();

    const info = await GetBoard();
    balance = Number(info.Balance ?? info.balance ?? 0);
    win     = Number(info.Win ?? info.win ?? 0);

    await createHUD();
    await updateHUD();
    createSpinButton();
    //createBetButtons();

    reels = new ReelsEngine(app);
    await addReelsFrame();
    wheel = new Wheel(app);

    const bet = BETS[activeBetIndex];
    const result = await GetBoard(bet);
    const reelsRaw  = result.Baraban ?? result.reels;
    const reelsData = normalizeReelsData(reelsRaw);
    await reels.stopWithResult(reelsData);
}

init();

async function onSpinClick()
{
    if (spinBtnRef)
        spinBtnRef.interactive = false;

    const bet = BETS[activeBetIndex];

    const speedFactor = 1.4;
    reels.startSpin(speedFactor);
    wheel.start(speedFactor);

    const result = await GetBoard(bet);

    await wheel.stopOn(
        Number(result.Multiplier ?? result.multiplier ?? 1), { duration: 500 }
    );

    const reelsRaw  = result.Baraban ?? result.reels;
    const reelsData = normalizeReelsData(reelsRaw);
    await reels.stopWithResult(reelsData);

    balance = Number(result.Balance ?? result.balance ?? balance);
    win     = Number(result.UserWin ?? result.win ?? 0);
    await updateHUD();

    if (spinBtnRef) spinBtnRef.interactive = true;
}