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

function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }