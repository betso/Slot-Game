async function createSpinButton()
{
    const innerRect = FRAME_INNER_RECT;
    const url = "./Content/Images/spin.png";
  
    try
    {
        const tex = await loadTexture(url);
        const spr = new PIXI.Sprite(tex);
        
        spr.interactive = true;
        spr.buttonMode = true;
        spr.height = 150;
        spr.width = 150;
        spr.x = app.screen.width - 280;
        spr.y = backgroundHeight / 2 - 70;

        spr.zIndex = 10;
        spr.on("pointerdown", onSpinClick);
        app.stage.addChild(spr);
        spinBtnRef = spr;
    } catch (e) {
        console.warn("[FRAME] Failed:", e);
    }
}

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

    minus.x = 20;
    minus.y = 140;
    plus.x  = 20 + 72;
    plus.y  = 140;

    app.stage.addChild(minus, plus);
}