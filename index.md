---
title: "Mosaic Canvas Card"
layout: single
permalink: /
---

**Mosaic Canvas Card** is a Home Assistant dashboard card that turns a background
image into a layout surface. Place text, icons, SVG gauges, charts and real
interactive controls anywhere on the image by dragging them; the whole layout scales
as one piece on any screen, from phone to wall panel.

![A finished Mosaic dashboard]({{ "/assets/images/hero-dashboard.png" | relative_url }})

## What it does

- **Freeform layout over a photo or render** — position cards anywhere on the image,
  in free pixel (Precision) mode or snapped to a grid.
- **Live backgrounds** — day/night image sets swapped by sun position, an entity, or
  pinned; extra image variants per EV count; or a different image per entity state.
  Pick images from the shipped set or your Home Assistant media library.
- **A visual element library** — thermometers, batteries, four tank shapes, an
  inverter and arc gauges, plus statistics and history graphs.
- **Real interactive controls** — toggles, sliders, dropdowns, button groups, inputs,
  spinboxes and buttons that write back to Home Assistant and are fully stylable.
- **Animated flow lines** — energy or data movement traced between the things you
  have placed, speed and direction driven by an entity.
- **Popover cards, clickable zones, embedded cards and virtual entities** — detail
  panels, invisible hotspots, any other Lovelace card on the canvas, and computed
  helper values with no Home Assistant helper required.
- **A full visual editor** — everything above is configured by drag, drill-down
  menus and live preview. YAML remains first-class for power users.

## Where to start

1. [Install the card]({{ "/installation/" | relative_url }}) via HACS or manually.
2. Read [Core Concepts]({{ "/concepts/" | relative_url }}) — five minutes that make
   everything else in the editor obvious.
3. Follow the [Editor Guide]({{ "/editor/" | relative_url }}) as you build your
   first canvas. A setup wizard and a guided tour run the first time you add the
   card.

> **Status:** pre-release. In daily use and feature-complete enough to build real
> dashboards with; the configuration schema may still change between versions.

Release notes live on the
[GitHub Releases page](https://github.com/ratava/mosaic-canvas-card/releases).
