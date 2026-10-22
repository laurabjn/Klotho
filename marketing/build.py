"""Builds the store and ad visuals of Klotho from HTML, with headless Chrome.

Run from the repository root: python marketing/build.py
Sources (logo, fonts, illustrations) are in marketing/src.
"""
import os
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = (ROOT / 'src').as_uri()
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'

CSS = f"""
@font-face {{ font-family: 'Cormorant'; font-weight: 600; src: url('{SRC}/cormorant-600.woff2'); }}
@font-face {{ font-family: 'Cormorant'; font-weight: 500; src: url('{SRC}/cormorant-500.woff2'); }}
@font-face {{ font-family: 'Jost'; font-weight: 400; src: url('{SRC}/jost-400.woff2'); }}
@font-face {{ font-family: 'Jost'; font-weight: 500; src: url('{SRC}/jost-500.woff2'); }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: 100%; height: 100%; overflow: hidden; }}
body {{ font-family: 'Jost', sans-serif; color: #6B5048;
  background: radial-gradient(circle at 78% 22%, #F6E1D8 0, transparent 58%),
    linear-gradient(160deg, #FBF7F2 0%, #F5E6DE 100%); position: relative; }}
.brand {{ display: flex; align-items: center; gap: .35em; font-family: 'Cormorant';
  font-weight: 600; color: #3E231C; }}
.brand img {{ height: 1.25em; }}
h1 {{ font-family: 'Cormorant'; font-weight: 600; color: #3E231C; line-height: 1.04; }}
.over {{ text-transform: uppercase; letter-spacing: .22em; color: #9C6658; font-weight: 500; }}
.pill {{ display: inline-block; border-radius: 999px; background: #B07869; color: #FFF9F5;
  font-weight: 500; box-shadow: 0 10px 24px rgba(176, 120, 105, .3); }}
.art {{ position: absolute; }}
"""


def page(width, height, body):
    return f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS} html, body {{ width: {width}px; height: {height}px; }}</style></head>
<body>{body}</body></html>"""


def logo(size):
    return f'<div class="brand" style="font-size:{size}px"><img src="{SRC}/monogram.svg" alt="">Klotho</div>'


VISUALS = {}

# Play Store feature graphic: 1024 x 500, no text near the edges.
VISUALS['store/feature-graphic-1024x500'] = (1024, 500, f"""
<div style="position:absolute;left:64px;top:92px;width:500px">
  {logo(42)}
  <h1 style="font-size:46px;margin:24px 0 14px">Ta tenue du jour, sans y passer la matinée.</h1>
  <p style="font-size:19px;line-height:1.5">Ton dressing organisé, des tenues selon la météo, ton style et l’occasion.</p>
</div>
<img class="art" src="{SRC}/hero.png" style="right:56px;top:28px;height:444px">
""")

HOOKS = {
    'a': ('Ton dressing, en douceur', 'Ta tenue du jour, sans y passer la matinée.'),
    'b': ('Ta tenue du jour', 'Rien à te mettre ? Ton dressing a déjà la réponse.'),
}
CTAS = {'bientot': 'Bientôt sur Google Play', 'disponible': 'Disponible sur Google Play'}
SUB = 'Klotho range ta garde-robe et compose des tenues selon la météo, ton style et l’occasion.'

for key, (over, title) in HOOKS.items():
    for cta_key, cta in CTAS.items():
        # Instagram / Facebook / TikTok feed: 1080 x 1080.
        VISUALS[f'ads/carre-{key}-{cta_key}-1080x1080'] = (1080, 1080, f"""
<div style="position:absolute;left:84px;top:84px">{logo(46)}</div>
<div style="position:absolute;left:84px;top:230px;width:500px">
  <p class="over" style="font-size:19px">{over}</p>
  <h1 style="font-size:70px;margin:20px 0 24px">{title}</h1>
  <p style="font-size:25px;line-height:1.45;width:400px">{SUB}</p>
  <p class="pill" style="font-size:27px;padding:20px 38px;margin-top:38px">{cta}</p>
</div>
<img class="art" src="{SRC}/hero.png" style="right:20px;bottom:60px;height:660px">
""")
        # Stories / Reels / TikTok: 1080 x 1920, text kept out of the top and bottom 250 px.
        VISUALS[f'ads/story-{key}-{cta_key}-1080x1920'] = (1080, 1920, f"""
<div style="position:absolute;left:0;right:0;top:270px;text-align:center;padding:0 90px">
  <div style="display:flex;justify-content:center">{logo(56)}</div>
  <p class="over" style="font-size:24px;margin-top:56px">{over}</p>
  <h1 style="font-size:96px;margin:24px 0 30px">{title}</h1>
  <p style="font-size:32px;line-height:1.45">{SUB}</p>
</div>
<img class="art" src="{SRC}/hero.png" style="left:50%;transform:translateX(-50%);bottom:360px;height:760px">
<div style="position:absolute;left:0;right:0;bottom:270px;text-align:center">
  <p class="pill" style="font-size:34px;padding:24px 52px">{cta}</p>
</div>
""")
        # Pinterest pin: 1000 x 1500.
        VISUALS[f'ads/epingle-{key}-{cta_key}-1000x1500'] = (1000, 1500, f"""
<div style="position:absolute;left:0;right:0;top:80px;text-align:center;padding:0 80px">
  <div style="display:flex;justify-content:center">{logo(50)}</div>
  <h1 style="font-size:84px;margin:44px 0 24px">{title}</h1>
  <p style="font-size:29px;line-height:1.45">{SUB}</p>
</div>
<img class="art" src="{SRC}/rack.png" style="left:20px;top:560px;height:640px">
<img class="art" src="{SRC}/hero.png" style="right:10px;top:500px;height:800px">
<div style="position:absolute;left:0;right:0;bottom:60px;text-align:center">
  <p class="pill" style="font-size:30px;padding:20px 46px">{cta}</p>
</div>
""")


def build():
    tmp = ROOT / '.html'
    tmp.mkdir(exist_ok=True)
    for name, (w, h, body) in VISUALS.items():
        html = tmp / (name.replace('/', '_') + '.html')
        html.write_text(page(w, h, body), encoding='utf-8')
        out = ROOT / f'{name}.png'
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([
            CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
            '--force-device-scale-factor=1', f'--window-size={w},{h}',
            '--virtual-time-budget=2000', f'--screenshot={out}', html.as_uri(),
        ], check=True, capture_output=True)
        print(name, os.path.getsize(out) // 1024, 'Ko')
    shutil.rmtree(tmp)


if __name__ == '__main__':
    build()
