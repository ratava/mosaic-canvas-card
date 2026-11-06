---
title: "Editor Guide — Settings tab"
permalink: /editor/settings/
---

The Settings tab holds the five panels that configure the installation as a whole:
**Canvas**, **Global Defaults**, **Templates**, **Config Health** and **About**.

## Canvas

The surface everything stands on. Four sections:

![The Canvas panel]({{ "/assets/images/panel-canvas.png" | relative_url }})

| Section | Contains |
|---|---|
| **Placement Mode** | Precision (free pixel drag) or Grid (snap to a grid you define). **Entering Grid mode re-lays-out existing cards onto the grid — one way.** Leaving Grid mode changes nothing, but the pre-grid layout is not restored; the screen warns you before you switch. |
| **Canvas Size** | The design-space size (defaults to the image's natural size), fit, and extend margins beyond the image |
| **Canvas Box** | Background and border of the canvas itself |
| **Background** | Method, images & EV count |

### Background

One screen configures the whole background model. Three tiles at the top choose
the **method**, and only that method's settings show:

![The Background screen]({{ "/assets/images/canvas-background.png" | relative_url }})

- **Single Image** — one fixed background image.
- **Day / Night** — two sets of images, one for day and one for night. **Source**
  chooses how the active set is picked: `auto (sun)` follows a sun entity, `day`
  and `night` pin one set, and `entity` follows any entity (including a virtual).
  Raising **EV count** adds an image row per count — one Day and one Night image
  per EV variant — so the background can show the right number of cars in the
  driveway.
- **State Entity** — one image per state of an entity you pick. Each rule pairs a
  state value with an image; a value matches the state as text, as a number
  (`21` matches `21.0`) or as a boolean (`true` matches `on`). **A state with no
  rule shows no background**, so cover every state you care about.

Every image path on this screen — day/night rows included — has the
[image picker]({{ "/editor/" | relative_url }}#image-paths-and-the-image-picker)
beside it, offering the backgrounds that ship with the card and your Home
Assistant media library. **Background fit** (cover or contain) applies to
whichever image is showing.

## Global Defaults

The styling tier every card and field inherits from — read
[Core Concepts]({{ "/concepts/" | relative_url }}#the-defaults-system) for how the
inheritance works. The sections:

![The Global Defaults panel]({{ "/assets/images/panel-defaults.png" | relative_url }})

| Section | Sets the default for |
|---|---|
| **Mosaic Card Defaults** | Field placement (Flow or Grid), columns, rows and all three gaps, card box style, text colour, and the expand-overlay dimming |
| **Popover Card Defaults** | Default columns, size, gaps, style and dimming for every popover card |
| **Embedded Card Default** | Default frame, transparency and CSS for embedded cards |
| **Value Default** | Value text style |
| **Label Default** | Label text style |
| **Control Default** | Per-control-type styling (toggle, slider, dropdown, button group, button, …), the shared accent, container box, and the **Variant Builder** for your saved variants |
| **Custom Colors** | Named, reusable colours — offered in every colour picker |
| **Custom Variables** | Named, reusable sizes, shadows and other values |
| **Layout & Fonts** | Fonts and units — the settings that really do apply to every card type |
| **Element Library** | Default fills, gradients, ticks and text for each of the ten shapes |
| **Reset & Rerun Wizard** | Clears the configuration and re-runs the setup wizard — it warns exactly what it clears first |

Each card type owns its field spacing outright: a Mosaic card's placement, column
and row counts and gaps live on **Mosaic Card Defaults**, a popover's on **Popover
Card Defaults**, and Layout & Fonts keeps only the fonts and units. Changing one
card type's spacing never moves another's.

**Popover Card Defaults** has a *Copy styling from Mosaic Card Defaults* button
that brings the whole box style across in one go — it asks first, and it copies
values rather than linking the two, so changing your Mosaic cards later leaves
popovers alone.

### Element Library defaults

Each shape gets its own screen; set a tank's fill colour or a thermometer's tick
style here once and every instance of that shape follows, unless a specific field
overrides it.

![The Element Library defaults]({{ "/assets/images/defaults-element-library.png" | relative_url }})

## Templates

Move whole layouts between cards, dashboards or houses:

![The Templates panel]({{ "/assets/images/panel-templates.png" | relative_url }})

- **Export Template** saves the current configuration as a portable file. An
  *include entities* switch controls whether your entity references travel with it —
  turn it off to share a layout publicly without your instance's details.
- **Import Template** loads a saved file, replacing the configuration (undo covers
  you).
- **Export / Import Control Variants** move just your saved control variant packs;
  importing *merges* them into what you have.

## Config Health

A read-only checkup over the whole configuration: popover actions that point at a
popover card that no longer exists, flow points naming a removed card, entities Home
Assistant doesn't have, dangling virtual references, and values only reachable from
the YAML editor. Every finding links to the screen that owns it, so a fix is one tap
away. Findings you disagree with can be ignored; ignored rows stay retrievable and
travel with templates.

![Config Health, all clear]({{ "/assets/images/panel-health.png" | relative_url }})

The panel's badge on the Settings tab shows errors only, so a merely informational
finding never flags your whole config.

## About

The card version and build, with links to the project repository, this
documentation and the Ko-fi support page.

![The About panel]({{ "/assets/images/panel-about.png" | relative_url }})
