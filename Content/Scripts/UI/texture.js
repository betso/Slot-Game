function loadTexture(src)
{
    if (PIXI.Assets?.load)
    {
        return PIXI.Assets.load(src);
    }

    if (PIXI.Loader)
    {
        return new Promise((resolve, reject) =>
        {
            const key = `tex:${src}:${Date.now()}`;   // უნიკალური key
            const loader = new PIXI.Loader();
            loader.add(key, src).load((_, res) =>
            {
                const tex = res[key]?.texture;
                tex ? resolve(tex) : reject(new Error('no texture'));
            });
        });
    }

    throw new Error('No loader available');
}