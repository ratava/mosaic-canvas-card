---
title: "Editor Guide — Overview"
permalink: /editor/
---

Everything Mosaic can do is reachable from the visual editor. This page covers how
the editor itself works; the three pages that follow walk every screen of each tab:
[Cards]({{ "/editor/cards/" | relative_url }}) ·
[Elements]({{ "/editor/elements/" | relative_url }}) ·
[Settings]({{ "/editor/settings/" | relative_url }}).

Open it the usual Home Assistant way: edit the dashboard, then edit the Mosaic card.

## First run: the setup wizard and tour

The first time you add a Mosaic card, a short setup wizard offers to tailor the
starting configuration to your use case — answer its questions or **Skip setup** to
jump straight into the editor.

![The setup wizard]({{ "/assets/images/setup-wizard.png" | relative_url }})

When the wizard closes, an eight-step guided tour is offered. Each step *jumps the
editor to the screen it describes*, so you see the real thing rather than a picture
of it. Cancel any time; you can re-run the wizard later from the editor (the reset
option warns you exactly what it clears before doing anything).

![The guided tour offer]({{ "/assets/images/guided-tour.png" | relative_url }})

## The ribbon

The editor's home screen is a **ribbon**: a rail of three tabs on the left, and the
selected tab's panels listed beside it.

![The ribbon: tab rail, search box and the Cards tab's panels]({{ "/assets/images/editor-ribbon-root.png" | relative_url }})

| Tab | Panels |
|---|---|
| **Cards** | Mosaic Card · Popover Cards · Embedded External Cards |
| **Elements** | Animated Flow Lines · Clickable Zones · Virtual Entities |
| **Settings** | Canvas · Global Defaults · Templates · Config Health · About |

Tapping a panel drills in. From there, everything is either a **list of items**
(cards, fields, zones, flows…), a **sections menu** (the item's groups of settings),
or a **form** (the actual controls). The pattern repeats at every level, so once
you've edited one card you can edit anything.

## The breadcrumb

A breadcrumb at the top always shows where you are, and every crumb is tappable — 
jump straight back to any ancestor level. **Back** pops one level; **Done** returns
to the ribbon.

![Deep in the tree: Cards › Mosaic Cards › Room Selection › Options › Dining Room]({{ "/assets/images/editor-breadcrumb.png" | relative_url }})

## Undo / redo

The ↶ / ↷ buttons beside the breadcrumb undo and redo **every** change — form
edits, canvas drags, even external YAML edits. Ctrl+Z / Ctrl+Y work anywhere in the
editor (except while typing in a text box). Deleting anything shows an
"… removed — Undo" snackbar for an immediate way back.

## Every option explains itself

Hover any option's name — they carry a dotted underline — and a tooltip says what
the option does and what leaving it blank means. The **?** beside the undo buttons
is there to point this out. If a note sits permanently under a row instead of in a
tooltip, it's a warning worth reading before you change that setting.

## Image paths and the image picker

Every **Image path** field in the editor — the canvas background, day/night rows,
a card's background image, the setup wizard — has a picker button beside it.
It offers two sources:

- **Card library** — the background images that ship with the card, shown as
  thumbnails.
- **Media library** — browse your Home Assistant media share, including uploading
  a new image into it without leaving the editor.

You can still type or paste a `/local/…` path or URL directly; the picker is a
convenience, not a requirement.

![The image picker]({{ "/assets/images/image-picker.png" | relative_url }})

## Search

The box at the top of the ribbon searches **every screen in the editor**. Type what
you're looking for — a setting name, or just a word like "font" — and the results
list every screen that contains it, including per-card and per-field screens,
labelled with where they live. Tapping a result navigates straight there.

![Searching "font"]({{ "/assets/images/editor-search.png" | relative_url }})

If you ever wonder "where do I change X?", search is faster than browsing the tree.

## Lists and drag-reorder

Every data list — cards, fields, popover cards, zones, flows, virtuals, flow
points, graph series — reorders the same way: **drag the row**. On touch screens,
drag from the grip handle on the row's left edge. Alt+↑/↓ works from the keyboard.
Rows also carry duplicate and delete buttons, and a chevron that opens the item.

![A card's fields list]({{ "/assets/images/editor-fields-list.png" | relative_url }})

## The Mosaic Editor Window

Positioning happens visually. The **Open Mosaic Editor Window** button (top of the
editor) opens a fullscreen drag surface with the live card rendered inside it:

![The Mosaic Editor Window with a card selected]({{ "/assets/images/mosaic-editor-window.png" | relative_url }})

- **Drag** cards, zones, embedded cards and flow points anywhere. In Grid mode they
  snap as you drag.
- **Select** a card to get resize handles and a quick-panel of its most-used
  settings (width, gaps) in the bottom bar.
- **Multi-select** to align or distribute several cards at once.
- **+ Add Flow Line** and the undo/redo pair are in the bottom bar; **Close Window**
  returns to the menus.

The window shows the real card — live entity values, animations and all — so what
you see is exactly what the dashboard renders.

## The live preview

While you work in the menus, the right-hand pane always shows the live card. Every
change applies immediately, and nothing is saved to the dashboard until you hit
Home Assistant's own **Save** — Cancel discards the session, and the editor's
undo/redo covers you within it.
