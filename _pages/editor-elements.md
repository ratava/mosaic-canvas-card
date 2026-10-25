---
title: "Editor Guide — Elements tab"
permalink: /editor/elements/
---

The Elements tab holds the three panels for things that live on the canvas without
being cards: **Animated Flow Lines**, **Clickable Zones** and **Virtual Entities**.

## Animated Flow Lines

Flows are animated lines — dashes, dots, a fluid stream or particles — travelling
between points on the canvas, typically showing energy moving (solar → battery,
grid → house). An entity's value drives the animation: its magnitude sets the speed
and its sign can set the direction.

![A flow's sections and points]({{ "/assets/images/panel-flows.png" | relative_url }})

Each flow has three sections and a points list:

| Section | Contains |
|---|---|
| **Flow Defaults** | Name, the driving entity, minimum display power (below which the flow hides), invert direction |
| **Speed** | The slowest / fastest value range mapped to animation speed |
| **Line Style** | Dashes / dots / fluid / particles, colours, width, curve |

**Points** define the path. A point is either anchored to a **card** (it follows the
card if you move it) or **free** (fixed canvas coordinates). Add as many as the path
needs; drag rows to reorder them along the line. Points are also draggable directly
in the [Mosaic Editor Window]({{ "/editor/" | relative_url }}#the-mosaic-editor-window),
which is usually the easier way to shape a path.

## Clickable Zones

A zone is a clickable region pinned to canvas coordinates — invisible by default,
optionally tinted while you position it. Use zones to make parts of the *image
itself* tappable: the garage door in the photo, a room, an appliance.

![A zone's sections]({{ "/assets/images/panel-zones.png" | relative_url }})

Two sections: **Zone Defaults** (name, position, anchor, size, overlay tint) and
**Actions** (tap · hold · double-tap — the same action set as cards and fields, so a
zone can toggle an entity, navigate, open a popover, and so on).

## Virtual Entities

Virtuals are computed helper entities — no Home Assistant helper required, no YAML
templates. Define one here and it becomes pickable **anywhere in Mosaic an entity
is**: every entity picker offers your virtuals alongside real entities.

![The Virtual Entities panel]({{ "/assets/images/panel-virtuals.png" | relative_url }})

Operations include arithmetic across a list of input entities (add, subtract, mean,
signed net, min/max) and **Time Until** — a countdown derived from a rate and a
level, the engine behind "Full in 57m" / "Empty in 35m" readouts on tank and battery
displays.

A virtual's screen holds its **Inputs** list (the entities it computes from), value
settings (unit, decimals), and for Time Until virtuals the countdown's specific
settings and optional extra triggers that force a recompute.
