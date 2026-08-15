---
title: "Installation"
permalink: /installation/
---

## HACS (recommended)

1. In Home Assistant, open **HACS**, click the **⋮** menu → **Custom repositories**.
2. Add `https://github.com/ratava/mosaic-canvas-card` with category **Dashboard**.
3. Find **Mosaic Canvas Card** in HACS and install it.
4. HACS registers the Lovelace resource automatically. If the card doesn't appear
   after a browser hard-refresh, add the resource manually
   (**Settings → Dashboards → ⋮ → Resources → Add Resource**):
   - URL: `/hacsfiles/mosaic-canvas-card/mosaic-canvas-card.js`
   - Resource type: **JavaScript Module**

## Manual install

1. Download the latest release archive from the
   [Releases page](https://github.com/ratava/mosaic-canvas-card/releases).
2. Copy the contents of `dist/` into `config/www/community/mosaic-canvas-card/` on
   your Home Assistant instance.
3. Add the Lovelace resource (**Settings → Dashboards → ⋮ → Resources → Add
   Resource**):
   - URL: `/local/community/mosaic-canvas-card/mosaic-canvas-card.js`
   - Resource type: **JavaScript Module**
4. Hard-reload the browser after every update to bust the cache.

## Your first card

Add **Mosaic Canvas Card** from the dashboard card picker, or by YAML:

```yaml
type: custom:mosaic-canvas
```

A setup wizard runs the first time and offers to tailor the starting configuration;
a guided tour of the editor follows. The wizard asks for a background image — pick
one of the backgrounds that ship with the card, browse (or upload to) your Home
Assistant media library, or point it at any image under `/local/` (your
`config/www/` folder).

![The setup wizard]({{ "/assets/images/setup-wizard.png" | relative_url }})

From here, read [Core Concepts]({{ "/concepts/" | relative_url }}) and follow the
[Editor Guide]({{ "/editor/" | relative_url }}).
