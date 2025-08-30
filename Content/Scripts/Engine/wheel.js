class Wheel
{
  constructor(app)
  {
    this.app = app;

    this.root = new PIXI.Container();
    this.root.zIndex = 0;
    this.root.x = 634;
    this.root.y = 378;

    this.sprite = PIXI.Sprite.from("./Content/Images/wheel.png");
    this.sprite.anchor.set(0.5);

    const targetSize = 650;
    this.sprite.width  = targetSize;
    this.sprite.height = targetSize;

    this.root.addChild(this.sprite);
    this.app.stage.addChild(this.root);

    this.setRectMask();

    this.running  = false;
    this.spinSpeed = 0.12;
    this._tick = (d) =>
    {
      if (!this.running) return;
      this.sprite.rotation += this.spinSpeed * d;
    };
    this.app.ticker.add(this._tick);
  }

  setRectMask()
  {
    const x = -this.sprite.width  / 2;
    const y = -this.sprite.height / 2;
    const width  = this.sprite.width;
    const height = 120;
    const debug  = false;

    if (!this._maskGfx)
    {
      this._maskGfx = new PIXI.Graphics();
      this.root.addChild(this._maskGfx);
      this.sprite.mask = this._maskGfx;
    }

    this._maskRect  = { x, y, width, height };
    this._maskDebug = !!debug;

    const g = this._maskGfx;
    g.clear();

    g.beginFill(0xffffff, 1);
    g.drawRect(x, y, width, height);
    g.endFill();

    if (this._maskDebug)
    {
      g.lineStyle(2, 0x00ff88, 0.9);
      g.moveTo(x, y); g.lineTo(x+width, y); g.lineTo(x+width, y+height); g.lineTo(x, y+height); g.closePath();

      g.lineStyle(1, 0xffffff, 0.35);
      g.moveTo(-this.sprite.width/2, 0); g.lineTo(this.sprite.width/2, 0);
      g.moveTo(0, -this.sprite.height/2); g.lineTo(0, this.sprite.height/2);
    }
  }

  start(speed = 1)
  {
    this.running   = true;
    this.spinSpeed = 0.12 * speed;
  }

  async stopOn(mult, { duration = 900 } = {})
  {
    const segments = 14;
    const segAngle = (Math.PI * 2) / segments;

    const idx = (mult - 1) % segments;
    let targetRotation = -idx * segAngle;

    if (mult == 1) // 1x
      targetRotation = -1.795;
    else if (mult == 2) // 2x
      targetRotation = -0.897;
    else if (mult == 3) // 3x
      targetRotation = -2.220;
    else if (mult == 4) // 4x
      targetRotation = -0.448;
    else if (mult == 5) // 5x
      targetRotation = -1.346;

    const twoPI = Math.PI * 2;
    const current = ((this.sprite.rotation % twoPI) + twoPI) % twoPI;

    let final = targetRotation;
    while (final < current) final += twoPI;
    final += twoPI * 2;

    const start = current;
    const diff  = final - start;
    const t0 = performance.now();
    this.running = false;

    await new Promise((res) =>
    {
      const step = (t) =>
      {
        const k = Math.min(1, (t - t0) / duration);
        const e = 1 - Math.pow(1 - k, 3);
        this.sprite.rotation = start + diff * e;
        if (k < 1)
          requestAnimationFrame(step);
        else
          res();
      };
      requestAnimationFrame(step);
    });
  }
}