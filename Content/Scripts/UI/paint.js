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

let balanceControl, betControl, winControl;

async function createHUD()
{
    balanceControl = await getBalanceControl();
    betControl = await getBetControl();
    winControl = await getWinControl();
}

async function getBalanceControl()
{
    const balanceContainer = new PIXI.Container();
    balanceContainer.x = app.screen.width / 2 - 260;
    balanceContainer.y = backgroundHeight - 80;

    const bg = PIXI.Sprite.from("./Content/Images/balance.png");
    bg.anchor.set(0.5);
    bg.scale.set(0.8);
    balanceContainer.addChild(bg);

    const styleTitle = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0x9ccf3c,
        fontWeight: "bold",
        align: "center",
        textTransform: "uppercase"
    });
    const titleText = new PIXI.Text("BALANCE", styleTitle);
    titleText.anchor.set(0.5);
    titleText.y = -20;
    balanceContainer.addChild(titleText);

    const styleValue = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "center"
    });
    const valueText = new PIXI.Text(`1,000.00 DMO`, styleValue);
    valueText.anchor.set(0.5);
    valueText.y = 8;
    balanceContainer.addChild(valueText);

    app.stage.addChild(balanceContainer);

    balanceContainer.updateBalance = (val) =>
    {
        valueText.text = `${val.toLocaleString()} DMO`;
    };

    return balanceContainer;
}

async function getBetControl()
{
    const container = new PIXI.Container();
    container.x = app.screen.width / 2 + 260;
    container.y = backgroundHeight - 80;

    const bg = PIXI.Sprite.from("./Content/Images/balance.png");
    bg.anchor.set(0.5);
    bg.scale.set(0.8);
    container.addChild(bg);

    const styleTitle = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0x9ccf3c,
        fontWeight: "bold",
        align: "center",
        textTransform: "uppercase"
    });
    const titleText = new PIXI.Text("BET", styleTitle);
    titleText.anchor.set(0.5);
    titleText.y = -20;
    container.addChild(titleText);

    const styleValue = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "center"
    });
    const valueText = new PIXI.Text(`1.00 DMO`, styleValue);
    valueText.anchor.set(0.5);
    valueText.y = 8;
    container.addChild(valueText);

    app.stage.addChild(container);

    container.updateBalance = (val) =>
    {
        valueText.text = `${val.toLocaleString()} DMO`;
    };

    return container;
}

async function getWinControl()
{
    const container = new PIXI.Container();
    container.x = app.screen.width / 2;
    container.y = backgroundHeight - 80;

    const bg = PIXI.Sprite.from("./Content/Images/win.png");
    bg.anchor.set(0.5);
    bg.scale.set(0.8);
    container.addChild(bg);

    const styleTitle = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "center",
        textTransform: "uppercase"
    });
    const titleText = new PIXI.Text("WIN", styleTitle);
    titleText.anchor.set(0.5);
    titleText.y = -20;
    container.addChild(titleText);

    const styleValue = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "center"
    });
    const valueText = new PIXI.Text(`1.00 DMO`, styleValue);
    valueText.anchor.set(0.5);
    valueText.y = 8;
    container.addChild(valueText);

    app.stage.addChild(container);

    container.updateBalance = (val) =>
    {
        valueText.text = `${val.toLocaleString()} DMO`;
    };

    return container;
}

async function updateHUD()
{
    balanceControl.updateBalance(Number(balance||0).toFixed(2));
    betControl.updateBalance(Number(BETS[activeBetIndex]||1).toFixed(2));
    winControl.updateBalance(Number(win||0).toFixed(2));
}