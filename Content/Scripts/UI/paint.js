async function createBackground()
{
    const url = "./Content/Images/background.png";

    try
    {
        const tex = await loadTexture(url);
        const spr = new PIXI.Sprite(tex);
        const scale = Math.max(app.screen.width/tex.width, app.screen.height/tex.height);
        spr.width = tex.width*scale;
        spr.height = tex.height*scale;
        
        backgroundHeight = tex.height*scale;

        spr.x = (app.screen.width - spr.width)/2;
        spr.y = (app.screen.height - spr.height)/2;
        spr.zIndex = 0;
        app.stage.addChild(spr);
    }
    catch(e)
    {
        console.warn("[BG] Failed:", e);
    }
}

async function addReelsFrame()
{
    const innerRect = FRAME_INNER_RECT;
    const url = "./Content/Images/board.png";
    const totalW = REELS_COLS * CELL + (REELS_COLS - 1) * REEL_GAP;
    const totalH = REELS_ROWS * CELL;
  
    try
    {
        const tex = await loadTexture(url);
        const spr = new PIXI.Sprite(tex);

        const sx = totalW / innerRect.width / 1.8;
        const sy = totalH / innerRect.height / 1.8;
        const s  = Math.min(sx, sy);
        spr.scale.set(s);

        spr.x = reels.root.x - innerRect.x * s -70;
        spr.y = reels.root.y - innerRect.y * s - 230;

        spr.zIndex = 50;
        app.stage.addChild(spr);
    }
    catch (e)
    {
        console.warn("[FRAME] Failed:", e);
    }
}