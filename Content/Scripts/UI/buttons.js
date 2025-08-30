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

async function createBetButton()
{
    const innerRect = FRAME_INNER_RECT;
    const url = "./Content/Images/bet.png";
  
    try
    {
        const tex = await loadTexture(url);
        const spr = new PIXI.Sprite(tex);
        
        spr.interactive = true;
        spr.buttonMode = true;
        spr.height = 70;
        spr.width = 70;
        spr.x = app.screen.width - 245;
        spr.y = backgroundHeight / 2 + 100;

        spr.zIndex = 10;

        const betModal = createBetModal(app, BETS, (chosen) =>
        {
            console.log('Chosen bet:', chosen);
            activeBetIndex = BETS.indexOf(chosen);
            updateHUD();
        });

        spr.on("pointerdown", () =>
        {
            betModal.open()
        });
        app.stage.addChild(spr);
        spinBtnRef = spr;
    } catch (e) {
        console.warn("[FRAME] Failed:", e);
    }
}

function createBetModal(app, bets = [], onSelect = (v)=>{})
{
    const overlay = new PIXI.Container();
    overlay.zIndex = 1000;
    overlay.visible = false;
    overlay.interactive = true;

    const scr = new PIXI.Graphics();
    scr.beginFill(0x000000, 0.65).drawRect(0, 0, app.screen.width, app.screen.height).endFill();
    overlay.addChild(scr);

    const PANEL_W = Math.min(560, Math.floor(app.screen.width * 0.7));
    const ITEM_H  = 96;
    const GAP     = 10;
    const VISIBLE_ROWS = 5;

    const panel = new PIXI.Container();
    overlay.addChild(panel);

    const listContainer = new PIXI.Container();
    panel.addChild(listContainer);

    const panelBg = new PIXI.Graphics();
    panel.addChildAt(panelBg, 0);

    const maskGfx = new PIXI.Graphics();
    panel.addChild(maskGfx);
    listContainer.mask = maskGfx;

    function makeItem(label, w, h)
    {
        const row = new PIXI.Container();
        row.interactive = true; row.cursor = 'pointer';

        const bg = new PIXI.Graphics();
        bg.beginFill(0x213408, 0.88).drawRoundedRect(0, 0, w - GAP*2, h, 12).endFill();
        bg.x = GAP;
        row.addChild(bg);

        const style = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontWeight: 'bold',
        fontSize: 36,
        fill: 0xffffff,
        align: 'center'
        });

        const txt = new PIXI.Text(label, style);
        txt.anchor.set(0.5);
        txt.x = w / 2;
        txt.y = h / 2;
        row.addChild(txt);

        row.on('pointertap', () => {
        close();
        onSelect(parseFloat(label));
        });

        return row;
    }

    bets.forEach((b, i) =>
    {
        const label = `${b.toFixed(2)} DMO`;
        const item = makeItem(label, PANEL_W, ITEM_H);
        item.y = i * (ITEM_H + GAP);
        listContainer.addChild(item);
    });

    let scrollY = 0;
    const maxScroll = Math.max(0, (bets.length - VISIBLE_ROWS) * (ITEM_H + GAP));

    overlay.interactive = true;
    overlay.on('wheel', (e) =>
    {
        const delta = e.deltaY;
        scrollY = Math.min(maxScroll, Math.max(0, scrollY + delta));
        updateScroll();
    });

    let dragging = false;
    let lastY = 0;
    overlay.on('pointerdown', (e) => { dragging = true; lastY = e.data.global.y; });
    overlay.on('pointerup',   () => { dragging = false; });
    overlay.on('pointerupoutside', () => { dragging = false; });
    overlay.on('pointermove', (e) =>
    {
        if (!dragging) return;
        const newY = e.data.global.y;
        const dy = lastY - newY;
        scrollY = Math.min(maxScroll, Math.max(0, scrollY + dy));
        lastY = newY;
        updateScroll();
    });

    function updateScroll()
    {
        listContainer.y = -scrollY;
    }

    function resize()
    {
        scr.clear().beginFill(0x000000, 0.65).drawRect(0, 0, app.screen.width, app.screen.height).endFill();

        // panel-ის ზომები
        const panelH = VISIBLE_ROWS * (ITEM_H + GAP);
        panel.x = (app.screen.width - PANEL_W) / 2;
        panel.y = (app.screen.height - panelH) / 2;

        panelBg.clear().beginFill(0x32470a, 0.85).drawRoundedRect(0, 0, PANEL_W, panelH, 16).endFill();
        maskGfx.clear().beginFill(0xffffff).drawRect(0, 0, PANEL_W, panelH).endFill();

        updateScroll();
    }

    function open()  { overlay.visible = true; if (!overlay.parent) app.stage.addChild(overlay); resize(); }
    function close() { overlay.visible = false; if (overlay.parent) app.stage.removeChild(overlay); }

    return { open, close, overlay };
}