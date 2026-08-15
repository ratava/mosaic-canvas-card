---
title: "Editor Guide — Cards tab"
permalink: /editor/cards/
---

The Cards tab holds the three panels for things that display content: **Mosaic
Card**, **Popover Cards** and **Embedded External Cards**. Read the
[editor overview]({{ "/editor/" | relative_url }}) first if you haven't — the
navigation, search, undo and drag-reorder behaviour described there applies to every
screen below.

## Mosaic Cards

The main panel. Its root is the list of every card on your canvas, with field
counts, duplicate/delete buttons and **+ Mosaic Card** to add one.

![The Mosaic Cards list]({{ "/assets/images/panel-mosaic-cards.png" | relative_url }})

### A card's sections

Opening a card shows its sections menu, with the card's **Fields** list beneath it:

![A card's sections and fields]({{ "/assets/images/card-sections.png" | relative_url }})

| Section | Contains |
|---|---|
| **Card Defaults** | Name, anchor, alignment, field placement, size, gaps |
| **Card Style** | Transparent switch, background, border, glow — with the **Use global card style** inherit switch (see [Core Concepts]({{ "/concepts/" | relative_url }})) |
| **Text Styles** | Value & label text style for this card |
| **Card Visibility** | Show / hide the card by condition |
| **Actions** | Tap · hold · double-tap actions |
| **Background Image** | An image behind this card's fields — fixed, or swapped by an entity's state |

### Field placement: Flow or Grid

**Field placement** on Card Defaults chooses how the card lays its fields out:

- **Flow** (default) — fields stack in order, in one to eight columns.
- **Grid** — the card becomes a grid of cells. Choose how many cells across and
  down the card has and give the card a height for the rows to divide; each field
  then gets a **Row** and **Column** on its header, with an optional span across
  neighbouring cells.

Switching a card between the two keeps both layouts, so it is always reversible —
unlike the canvas's own [Placement Mode]({{ "/editor/settings/" | relative_url }}#canvas),
which places *cards on the canvas* and is a different setting entirely. Config
Health flags a field placed outside the card's cells, or two fields sharing a
cell.

![Card Defaults in Grid placement]({{ "/assets/images/card-grid-placement.png" | relative_url }})

### Background Image

An image drawn behind the card's fields, under the card box. Leave the entity
blank for a single fixed image. Pick an entity and the section grows a **Rules**
list — each rule pairs one state value with the image to show for it, and the
**Image path** at the top becomes the fallback shown when no rule matches. Every
image path has the [image picker]({{ "/editor/" | relative_url }}#image-paths-and-the-image-picker)
beside it.

![A card background swapped by entity state]({{ "/assets/images/card-bg-rules.png" | relative_url }})

### Fields

**+ Field** adds a field; the type dropdown offers label, value, icon, the
interactive controls, blank, rule and embedded card. The **Element Library** picker
is how a field becomes an SVG shape or a graph:

![The Element Library picker]({{ "/assets/images/element-picker.png" | relative_url }})

Opening a field shows its header (type, display name, column and optional column
span — plus a row when the card uses Grid placement) and the sections *for that
type* — a value field and a thermometer field show different menus.

![A value field's sections]({{ "/assets/images/field-sections.png" | relative_url }})

Sections you'll meet, by field type:

- **Value fields** — Value Source (entity, virtual entity or time-until), Value
  Label, HA Statistics, Display (unit, decimals, hide-below), Text Style, Actions.

  ![The Value Source form]({{ "/assets/images/field-value-source.png" | relative_url }})

  The **HA Statistics** section is worth knowing about: pick a period and statistic
  and the value displays an aggregate (mean, difference, max, …) instead of the live
  state.

- **Label / icon fields** — content, icon picker, styling, actions.

- **SVG fields** (Element Library shapes) — Source, Range (min/max), Colors (fill,
  gradients), Size, value Thresholds, plus shape-specific sections (gauge settings,
  thermometer settings).

- **Graph fields** — Graph settings (type, hours, axes, legend) and **Series**, a
  drag-list of the entities plotted:

  ![The Series list]({{ "/assets/images/graph-series.png" | relative_url }})

  Each series is its own screen — entity, label, colour, and per-series statistics
  (period and type). This is the deepest drill-down in the editor; the breadcrumb
  will happily take you back out.

  ![A single series]({{ "/assets/images/graph-series-item.png" | relative_url }})

- **Control fields** (toggle, slider, dropdown, button group, input, spinbox, button) —
  the control's source and write behaviour, its Options (for button groups and dropdowns), Labels
  around the control, Text Style, and **Control Style**:

  ![A button group control's sections]({{ "/assets/images/control-button-group.png" | relative_url }})

  Control Style is inherit-by-default: leave **Use global control style** on and the
  field follows Settings › Global Defaults › Control Default. Switch it off to style
  this one control's container, active and inactive states.

  ![Control Style with the inherit switch off]({{ "/assets/images/control-style.png" | relative_url }})

  The **Variant** dropdown in the field header applies a saved preset of control
  appearance and behaviour. A control's own **Variant** section saves the field as
  a reusable variant of your own — a button group's manual options travel with it,
  keeping their labels, icons and layout but not their entities — or updates the
  variant the field already uses, in place. Manage the collection under
  Settings › Global Defaults › Control Default › **Variant Builder**, and move
  variants between installations as packs under Settings › Templates.

## Popover Cards

Popover cards are the detail panels that open over the canvas via an *Open Popover*
action (from any card, field or zone). The panel root lists them; each popover card
has its own defaults — columns, width and height as a percentage of the canvas,
gaps — its Card Style, Text Styles, and a fields list that works exactly like a
mosaic card's:

![A popover card]({{ "/assets/images/panel-popover.png" | relative_url }})

A popover lays its fields out **exactly as a Mosaic card does** — the card's Align
places every field, columns size to their content and are spaced by Column gap,
and column spans and docked fields all work. The only differences: a popover has
its own width and height, it pops up over the other cards, and it has no
background image.

A popover's **Card Style** and **Text Styles** open with a *Use global* switch, so
every popover follows **Popover Card Defaults** — which lives under
[Settings › Global Defaults]({{ "/editor/settings/" | relative_url }}#global-defaults),
alongside the other card-type defaults — until you deliberately turn the switch
off and style that one popover.

## Embedded External Cards

Put any other Lovelace card — native or custom — on the canvas as a positioned
element. Each embedded card has four sections: **Card Config** (pick the card type
from a searchable list, then configure it with its own native editor or YAML),
**Position & Size**, **Card Style** and **Card Visibility**.

![An embedded card's sections]({{ "/assets/images/panel-embedded.png" | relative_url }})

**Card Style** frames the embedded card like everything else on the canvas — the
same background, border, radius, padding, glow and blur a Mosaic card has, with
**Transparent** deciding whether the third-party card's own background shows
inside the frame. Because an embedded card is two surfaces, it has two CSS boxes:
**Additional CSS** under the frame styles the element Mosaic draws (anything
sizing, moving or layering the whole card goes there), while **Card CSS** is
applied to the embedded card itself, so a `--ha-card-…` override or a font change
lands where the name says it does.

**Card Visibility** shows or hides the card on an entity's state, exactly as on a
Mosaic card.

Both the frame and the CSS have a global starting point — **Embedded Card
Default** under Settings › Global Defaults covers every embedded card until one
unticks **Use global card style** or **Use global transparency**.

There is also an `embedded_card` **field type** for nesting an external card inside
a mosaic card's field stack — use the panel here when the card should stand alone on
the canvas, and the field type when it should live inside one of your cards.

---

Next: the [Elements tab]({{ "/editor/elements/" | relative_url }}) — flows, zones
and virtual entities.
