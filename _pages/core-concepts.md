---
title: "Core Concepts"
permalink: /concepts/
---

Five minutes here makes everything else obvious. Mosaic has a small number of ideas
that repeat everywhere: a **canvas** you place things on, **cards** made of
**fields**, each field carrying its own **options** — and a defaults system that
means you style things once and override only where needed.

![A Mosaic canvas: cards positioned over the background, with a flow line]({{ "/assets/images/concepts-canvas.png" | relative_url }})

## The hierarchy: Canvas → Cards → Fields → Options

![The core concept hierarchy: canvas, cards, fields and options]({{ "/assets/images/Core-Concept.png" | relative_url }})

### Canvas

The canvas is the design surface — a fixed coordinate grid laid over your background
image. You choose its size once (it defaults to the image's natural size), and every
position and width you set afterwards is expressed in that **design space**. The
whole canvas then scales as one piece to whatever width your dashboard gives it, so a
layout built on a desktop holds together on a phone without any per-device work.

Two placement modes:

- **Precision** (default) — drag anything to any pixel.
- **Grid** — card centres snap to an invisible grid you define, and card widths
  become column spans. Useful for tidy, aligned layouts.

The **background** is its own thing beneath the canvas, with three methods: one
fixed image; day/night sets chosen automatically by sun position or an entity of
your choice, optionally with extra variants per EV count (e.g. a driveway photo
with zero, one or two cars on it); or one image per state of an entity you pick.

### Cards

A card is a positioned box on the canvas. It has a position (where), an anchor
(which point of the box sits on that position — top-left, centre, …), one or more
columns, and a stack of fields. Cards can be transparent, glassy, bordered, glowing —
or invisible boxes that just group their contents. A card can also carry its own
**background image** behind its fields — fixed, or swapped by an entity's state.

### Fields

Fields are the content inside a card. In the default **Flow** placement they stack
in order (drag to restack, assign to columns for side-by-side layouts); switch the
card to **Grid** placement and each field instead sits in a cell of a grid you
size, with optional spans. Every field has a **type**:

| Kind | Types | What they do |
|---|---|---|
| Display | `label`, `value`, `icon`, `blank`, `rule` | Text, entity values, icons, spacing, divider lines |
| Visual | Element Library (SVG) | Thermometers, batteries, tanks, inverter, arc gauges — image-quality gauges filled by an entity value |
| Charts | graphs | Statistics and history charts: line, bar, stacked bar, area, state timeline, gauges — multi-series |
| Interactive | `toggle`, `slider`, `dropdown`, `button_group`, `input`, `spinbox`, `button` | Real controls that write back to Home Assistant. `button_group` is the control shown as **Button Group** in the editor |
| Nesting | `embedded_card` | Any other Lovelace card inside a field |

### Options

Every field type carries its own option set — an entity and how to display it, a
statistics period, fill colours and gradient direction, a control's write behaviour,
and so on. In the editor these appear as the field's **sections** (Value Source,
Display, Text Style, …); you never see options that don't apply to the type you
picked.

## Beyond cards: the other things on a canvas

- **Popover cards** — full detail panels that open *over* the canvas when a card,
  field or zone is tapped (the *Open Popover* action). They lay their fields out
  exactly as Mosaic cards do, with their own width, height and defaults.
- **Embedded cards** — any other Lovelace card (native or custom) positioned
  directly on the canvas as an element of its own.
- **Zones** — invisible (or tinted) clickable hotspots pinned to canvas
  coordinates. Tap / hold / double-tap actions with nothing visible drawn.
- **Flows** — animated lines with travelling dashes or particles, anchored to cards
  or free points, showing energy or data moving. An entity drives speed and
  direction.
- **Virtuals** — computed entities (add, subtract, mean, signed net, min/max,
  time-until countdowns) derived from other entities. A virtual is usable anywhere a
  real entity is — every entity picker in the editor offers them — with no Home
  Assistant helper needed.

**Actions** are available on cards, fields and zones as `tap_action`, `hold_action`
and `double_tap_action`: more-info, toggle, call a service, navigate, open a URL,
assist, expand the card, open a popover, and more.

## The defaults system

This is the concept that saves you the most time, and the one worth genuinely
understanding before you style anything.

### How a value resolves

Every visual property — a font size, a border colour, a fill — resolves
**most-specific-first** through the same chain:

```
1. the element's own setting        (this field / this card)
2. your Global Default              (Settings › Global Defaults)
3. Mosaic's shipped default         (how a fresh card looks out of the box)
4. your Home Assistant theme
5. a built-in fallback
```

The first tier that has a value wins. In practice:

- **Set nothing** and you get Mosaic's shipped look.
- **Set a Global Default** and every card and field follows it instantly —
  installation-wide.
- **Set it on one card or field** and only that element differs; everything else
  keeps following the global.

One subtlety worth knowing: for a property to follow your **HA theme**, every tier
above the theme must be empty — including Mosaic's shipped default. Mosaic
deliberately ships *no* value for a handful of properties (control sizing and
density among them) precisely so they inherit from your theme and your dashboard's
natural sizing.

### Global Defaults

**Settings › Global Defaults** is where tier 2 lives: defaults for each card type
(Mosaic, popover and embedded — each owns its own placement, spacing and box
style), value and label text styles, per-control styling, fonts and units, and
default fill colours for every Element Library shape.

![The Global Defaults panel]({{ "/assets/images/panel-defaults.png" | relative_url }})

### Overriding, and getting back

Wherever a card or field *can* override a global, the editor shows an
inherit/override switch — for example **"Use global card style"** on a card, or
**"Use global control style"** on a control field. Leave it on and the element
follows the global (edit the global once, everything updates). Switch it off and the
per-element controls appear.

![A control field overriding the global control style]({{ "/assets/images/control-style.png" | relative_url }})

Every screen that can hold overrides also offers **Clear overrides** — the one-click
way back to inheriting.

### Canvas defaults vs Global Defaults

Don't confuse the two Settings panels:

- **Canvas** (Settings › Canvas) configures the surface itself — placement mode,
  design-space size, the canvas box, and the background image set. These aren't
  styling defaults; they're the stage everything stands on.
- **Global Defaults** (Settings › Global Defaults) is the styling tier every card
  and field inherits from.

## Styling beyond the option surface

Two escape hatches exist for the cases no option list can anticipate. Both are
permanent, first-class features:

- **Custom colors & variables** — name a colour or a value once under Global
  Defaults (Custom Colors / Custom Variables) and reference it everywhere. Named
  colours are also offered inside every colour picker, so they're pickable rather
  than something you have to remember.
- **Additional CSS** — free-form CSS declarations available on boxes, text styles
  and each Element Library shape. Layers *cumulatively*: a global rule still applies
  when a card or field adds its own, with the more specific one winning on conflict.

If you find something you cannot restyle through the options, the custom variables
or Additional CSS — that is considered a gap in Mosaic's styling surface. Please
[file an issue](https://github.com/ratava/mosaic-canvas-card/issues).

## Positions and sizes in YAML

The visual editor writes all of this for you, but if you read or hand-edit the YAML:
positions are **fractions (0–1) of the canvas**, and widths and other lengths are
**pixels in design space**. A card at `x: 0.5` sits halfway across the canvas no
matter what screen it renders on.

```yaml
type: custom:mosaic-canvas
background:
  source: auto              # single | auto (sun) | day | night | entity | state
  images:
    day:   { "0": /local/mosaic/day.jpg }
    night: { "0": /local/mosaic/night.jpg }
canvas:
  width: 1000               # design space; defaults to the image's natural size
  height: 515
cards:
  - id: solar
    position: { x: 0.42, y: 0.19 }
    anchor: center
    fields:
      - type: label
        text: Solar
      - type: value
        entity: sensor.solar_power
```

Top-level keys, for orientation: `canvas`, `background`, `cards` (with
`cards[].fields`), `zones`, `flows`, `virtuals`, `embedded_cards`, `extended_cards` (the popover
cards — the key keeps its historical name), and `defaults` (the Global Defaults
tier). Everything under them is editable
visually — the editor is the reference.
