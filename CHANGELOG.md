# Changelog

All notable changes to Mosaic Canvas Card. Newest first.

Entries are written for people using the card, not people reading its source. Anything
a user cannot notice — refactors, tooling, documentation — is deliberately absent.
Issue links point at the public tracker; work driven by the private tracker is
described by its effect rather than by its ticket.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## 0.95 — 2026-10-26

### Added

- A graph now has a Graph Data screen carrying the window it covers, how often a data point is sampled inside that window — every 5 minutes upward — and the calculation applied to each sample, set once for the chart instead of on every series. Existing graphs keep the window and the resolution they were already drawing at, and a series can still override the calculation on its own.
- Statistics graphs gain a filled line — **Statistics — Line (Stacked)** — the statistics equivalent of the filled history chart, with its own Fill opacity. The history one is now named **History — Line Stacked** to match.
- The Last day window is offered wherever a statistics period is picked — a value field's HA Statistics and a statistic virtual, not just a graph.
- An icon field can take its glyph from its entity's state: tick **Use state value** in the Icon section and a weather entity reading `partlycloudy` shows that condition's icon, with no per-state rule to write. **Alt icon prefix** points the lookup at another icon set, for installs that have added Iconify collections through an integration such as Custom Icons. Per-state rules still override both.
- Selecting a single card in the mosaic editor now offers a Height field alongside Width, so a card can be sized both ways without leaving the canvas. On a card grid it also gains a Rows box next to Span, for sizing by grid rows.

### Changed

- The card's source code is now published in the repository, and release files are built from it automatically, so what HACS installs can be reviewed and rebuilt by anyone.
- A graph's x-axis is now captioned with the window it covers — "Last day", "Last 7 days" — under the time values, and the unit labels the y-axis instead of floating above the top gridline, unless a y-axis title of your own is set. Series names in the legend sit centred under the chart.
- Column gap and Row gap now apply to any multi-card selection in the mosaic editor, so cards can be re-spaced without grouping them first. The Distribute buttons drop their "(grp)" label for the same reason — they never needed a group either.
- Icon fields drop the HA Statistics and Display sections, which had nothing an icon could use, and gain a **Visibility** section holding the one setting that applies — hide below a value, which now works on icon fields.
- The Count stat type is now named "Count (recorder records)" and says what it actually counts: how many statistics records Home Assistant holds for the window, which varies with the window's length.

### Fixed

- Graphs now draw the axis line along the bottom as well as up the left, so the Axis line colour applies to both. Axis labels and the values along the axes are separately colourable — Axis labels covers the two axis captions, and a new Axis ticks colours the numbers, dates and bar names, following Axis labels until it is set.
- Number fields in the mosaic editor's bottom bar — the column and row gap boxes, and the single-card width, height and gap boxes — keep focus while you type. They no longer lose the caret mid-value each time the dashboard's entities update.

## 0.92 — 2026-08-23

### Fixed

- The card appears once in the Lovelace card picker again, instead of a second identical tile showing up after the card editor has been opened.

## 0.91 — 2026-08-21

### Added

- Graphs gained a great deal of control: the axis range, gridline count, decimals, unit and title; line shape (straight, smoothed or stepped), point markers and latest-value labels; bar value labels; and a new horizontal bar chart, which gives long category names a whole row instead of squeezing them under a narrow bar. Gauges gained tick marks, a configurable sweep, a caption, and their own colour bands screen, which previously could only be set by hand-editing YAML.
- Each graph can now set its own refresh rate rather than every graph on the dashboard sharing one, so a week-long chart need not re-query as often as a live gauge.
- Value fields can show an icon beside the value — the entity's own icon by default, or a picked override — and label fields can show a picked icon with their text. The icon sits left of the text by default, or right, above or below it.
- Icon fields can be linked to an entity to show its state-aware icon, and carry state rules that swap the icon by entity value — the same way a Mosaic card's background changes by state.
- Icon fields now honor the Align setting, placing the glyph left, centre or right in the field — the same way label and value text aligns.
- Every box style — Mosaic cards, popovers, embedded cards, the canvas and controls — gains a Shadow option with adjustable blur, spread and colour, in two forms: a directional drop shadow with offsets, or an even halo around the whole box.
- A history graph series (Line, Area, or State timeline) can now use "Raw value (no aggregation)" as its Stat type, showing each bucket's own last reading instead of an averaged, summed, or extreme value.

### Changed

- Graphs now draw a proper axis: gridlines land on round numbers instead of arbitrary fractions of the data, how many of them appear suits the chart's height and label size, and decimals stay consistent down the whole axis. Line and area charts scale to their data rather than always starting at zero, so a sensor that only moves between 18 and 24 fills the chart, and a reading a hair below zero no longer drags the axis negative. The legend now sits wherever you put it — above, below, left or right — wraps as needed and works on bar charts too; hovering a line reports every series' value at that moment; and readouts follow each entity's own display precision.
- State timelines finally work for the entities they were meant for — a door sensor, a thermostat mode, who is home — instead of only numeric ones, and you can pin a colour to any state by name, show the state names in the chart, name the entity being plotted, and give unavailable its own colour.
- Graphs load faster and cost Home Assistant far less. A dashboard used to fetch everything twice on every page load and then throw the first copy away, and asked Home Assistant for each entity separately even when a dozen of them wanted the same thing; they are now asked for together, which roughly halved the time a busy dashboard takes to fill in. Nothing polls at all while the card is off-screen or its tab is in the background — coming back refreshes only if the data has gone stale, so scrolling past a dashboard no longer re-queries everything each time. A graph waiting for its first data now says so instead of claiming there is none.
- The Time Until layout list reorders by dragging its grip handle — the same as every other list in the editor, including on touch screens — instead of the old up/down arrow buttons. Alt+↑/↓ still works from the keyboard.
- A field's list entry now shows its column (and, in grid mode, row) as a range when it spans more than one cell — e.g. "C2-4" or "R7-9" — instead of just the starting track. In grid mode the row badge always shows, even for a field left to auto-place.
- The card box screens are tidier: Border Color sits under its Border toggle, shadow colour leads the shadow rows, and the border and shadow settings appear only while their feature is switched on.
- Grid mode cards can now have up to 20 rows, up from 8.
- The graph field's "Graph Chrome" section is now called "Graph Style".

### Fixed

- A history graph series's own Stat period (Yesterday, Last week, Last N days, etc.) now actually shifts the plotted window instead of being silently ignored in favour of the live window — including with the Raw value type. Raw value now also actually returns data over a rolling window (it needs 5-minute resolution, which Home Assistant only keeps for roughly the last 10 days). A history series can also now use "Change" as its Stat type, plotting how much a cumulative meter entity advanced during each bucket. Line, Area, and State timeline graphs now show a proper time scale on the x axis at any window length — State timeline previously had none at all.
- The visual editor no longer slows down on busy Home Assistant instances — it redraws only when an entity it actually shows changes, and it opens noticeably faster once a dashboard is being edited.
- The color picker popup no longer closes itself when clicking or releasing a drag on the color area or hue slider, and it now opens attached to its swatch instead of drifting off-screen or losing its lower controls past the panel edge. Double-clicking the color area confirms the selected color and closes the popup.
- A field's Align setting is now honoured in grid mode, positioning its text or icon across the full cell width whether or not the field spans multiple columns.
- Changing a field's type now drops the settings the new type has no use for — previously they stayed in the YAML invisibly and Config Health flagged them as not editable. A change that would discard an options list asks first.

### Removed

- The box Glow setting is removed — its halo was fixed-size. The Shadow option's box form is its adjustable replacement. A config that still sets glow in YAML gets a Config Health entry with a one-click Remove.

---

## 0.90 — 2026-08-14

### Breaking

- The backgrounds that ship with the card have been renamed to say which house they show — the overview set is now the brick house, and the plain house set is the white house. **A card pointing at one of the old filenames will show no background** until you re-pick its image from the picker.

### Added

- A Mosaic card can now place its fields on a grid instead of stacking them in list order. Switch **Field placement** to Grid on Card Defaults, choose how many cells across and down the card has, give the card a height for the rows to divide, then set the row and column each field sits in — with an optional span across neighbouring cells. Switching a card between the two placements keeps both layouts, so it is always reversible, and Config Health flags a field placed outside the card's cells or sharing a cell with another.
- The canvas background now offers a choice of method: a single fixed image, the day/night sets, or one image per state of an entity you pick. Choosing a method shows only that method's settings, and the day/night sets keep their sun or mode entity and their EV count variants. The state method has no default image — a state with no rule shows no background. Setup offers the same three methods, and the Energy Dashboard branch now sets the EV count and all of its day and night images on one page instead of splitting them across two.
- A Mosaic card's background image can change with an entity's state: pick an entity on **Background Image**, then add rules pairing a state value with the image to show for it. Cards without an entity keep their single fixed background.
- Image path fields now have a picker. Choose one of the backgrounds that ship with the card, or browse the Home Assistant media library — including uploading a new image into it without leaving the editor. Every image path on the canvas background screen, day/night rows included, has one beside it.

### Changed

- Every card type now owns its field spacing outright. A Mosaic card's placement, column and row counts and all three gaps are together on **Mosaic Card Defaults**; a popover's stay on **Popover Card Defaults**; **Layout & Fonts** keeps only the fonts and units that really do apply everywhere. Changing one card type's spacing no longer moves another's, and dashboards keep the spacing they already had.

### Fixed

- A button group option with no entity of its own that opens a popover on tap is no longer flagged as a config error; it now shows as inactive and stays tappable.

## 0.89 — 2026-08-12

### Added

- Settings has a new **About** section showing the card version, with links to the project repository, the documentation and the Ko-fi support page. The version line above the editor has moved there.

### Fixed

- Setting a corner radius on the canvas now shapes the card's outer corners too — a radius of 0 gives genuinely square corners instead of being clipped to the theme's rounding. Leave it unset to keep the theme's radius.

## 0.88 — 2026-08-11

### Breaking

- Popover cards now lay their fields out exactly as Mosaic cards do. **Align** finally
  reaches a popover's columns, so fields sit left, centre or right instead of always
  stretching the full column width; columns size to their content and are spaced by
  **Column gap** rather than the field gap; empty columns take no room; and column spans
  and docked fields work on a popover for the first time. **Popovers will look different
  after updating** — a control that filled its column now sits at the card's alignment, and
  a popover relying on evenly split columns may need its widths or Column gap set once.

### Changed

- A field's own **Align** now only sets its text. Where the field sits in its column follows
  the card's **Align**, on every field and on both card types — previously a field that
  spanned columns placed itself, which on a control meant it was placed by the setting that
  positions its label rows.

### Fixed

- Element library graphics now load on whatever address you reach Home Assistant on. A card
  set up on your local address kept asking that address for its SVGs, so the same dashboard
  opened through the Nabu Casa remote URL, a reverse proxy or the companion app showed those
  fields empty. A graphic that genuinely fails now says so in the browser console instead of
  leaving a blank space.

---

## 0.87 — 2026-08-10

### Breaking

- Popover cards no longer inherit the Mosaic card box style. Popover Card Defaults has
  moved to **Settings ▸ Global Defaults**, alongside the renamed **Mosaic Card Defaults**,
  and each surface now has its own dimming setting. **Popovers that relied on the
  inherited style will look different and need setting up once** on their own screen.
- **Existing Additional CSS on an embedded card has become Card CSS**, and is now applied
  to the embedded card itself rather than to the element holding it. Anything in it that
  positioned, sized or layered the whole card needs moving up to **Additional CSS** under
  Frame.

### Added

- Editor options explain themselves. Hover any option's name and a tooltip says what it
  does and what leaving it blank means, marked by a dotted underline, with a **?** beside
  the undo buttons pointing it out. Notes that used to sit permanently under a row have
  moved into those tooltips, so the screens are shorter, and the ones that stayed are the
  warnings worth stopping for.
- Embedded cards can be framed and hidden like everything else on the canvas. **Card
  Style** on an embedded card offers the same background, border, radius, padding, glow
  and blur a Mosaic card has, and **Card Visibility** shows or hides the card on an
  entity's state. The frame is drawn around the card, so **Transparent** still decides
  whether the card's own background shows inside it.
- **Embedded Card Default** under Global Defaults sets the starting point for every
  embedded card — the frame, **Transparent** and **Card CSS** alike. A card follows the
  global until you untick **Use global card style** or **Use global transparency** on it,
  so setting them once covers every embedded card on the canvas.
- A button group with manual options can now be saved as a reusable variant, from a
  **Variant** section of its own — its options travel with it, keeping their labels, icons
  and layout but not their entities, so you point a new copy at your own entities. A field
  already using a custom variant can update that variant in place rather than only saving
  a new one, and switching a field to a variant that brings no options of its own now
  warns before clearing the list.
- Icon position on a button group or dropdown option cell now offers **No Icon**, which
  leaves the icon out — the only way to drop it on an option that drives its own entity,
  since those otherwise always show that entity's state icon. Settable per option or for a
  whole control.
- **Popover Card Defaults** has a *Copy styling from Mosaic Card Defaults* button, which
  brings the whole box style across in one go — background and gradient, border colour,
  border, width, radius, padding, glow, additional CSS and blur. It asks first, and it
  copies values rather than linking the two, so changing your Mosaic cards later leaves
  popovers alone.

### Changed

- Every colour that can fade into a second one now has a **Gradient** checkbox beside it,
  so the gradient rows only appear when you want them, and each gradient has its own
  angle. Control gradients left without an angle still follow the control-wide **Gradient
  angle**, and an SVG that ships its own gradient keeps its own direction.
- A popover's **Card Style** and **Text Styles** screens now open with a *Use global*
  switch, so a popover follows Popover Card Defaults until you deliberately turn the
  switch off and style that one popover.
- An embedded card now has two CSS boxes instead of one, because it has two surfaces.
  **Additional CSS** under Frame styles the frame Mosaic draws — that is where anything
  sizing, moving or layering the whole element goes. **Card CSS** is applied to the
  embedded card itself, so a `--ha-card-…` override or a font change finally lands where
  the name says it does. Both have a global twin on **Embedded Card Default**, and a
  card's own declarations are added after the global ones rather than replacing them, so
  the card wins where the two name the same property.
- An overlay's corners now follow the card's own **Border radius** instead of a separate
  **Corner radius** setting, which has been removed — the panel behind a popup has no
  colour of its own, so a second radius only clipped the corners you had already set.
- The field **Type** dropdown is now listed alphabetically.

### Fixed

- Popover cards and expanded cards now render at the same scale as the mosaic canvas
  behind them, so a field styled to look right on the canvas looks the same in a popover
  instead of much smaller. One that can't fit at that scale shrinks until it does.
- Pressing Escape in the colour picker now cancels — the colour returns to what it was
  when you opened the picker, and the card editor stays open instead of closing behind it.
  Clicking outside the picker still keeps the colour you were trying.

---

## 0.85 — 2026-08-05

### Changed

- The **Selector** control is now called **Button Group**. Existing cards need
  `type: selector` changed to `type: button_group`, and any hand-written `selector_*`
  style keys changed to `button_group_*`.

---

## 0.81 — 2026-08-04

### Fixed

- **Done** in a field editor returns to the card editor instead of dropping you back to
  the home menu
  ([#3](https://github.com/ratava/mosaic-canvas-card/issues/3)).

---

## 0.80 — 2026-08-03

Pre-release. Entries below were reconstructed from the issue tracker after the fact —
they are grouped by theme rather than itemised, and this is the last release written
retrospectively.

### Added

- Editor-wide search and quick-jump across every navigation screen.
- Undo/redo for editor changes, with an undo prompt on destructive actions.
- A Config Health screen that reports dangling references and dead entity bindings.
- One-click duplicate on item-card rows, and touch-capable drag reordering.
- Double-click an element in the expanded mosaic editor to close it and jump straight to
  that element's config screen.
- Recent-screen jump chips on the ribbon root, and small sections now render inline as
  expansion panels instead of costing a navigation hop.
- Per-section "modified" badges and a per-section **Clear overrides** action.
- Entity-aware placeholders: name, unit, decimals and range hints are suggested from the
  entity's current state.
- Editor rows for settings that previously required hand-written YAML — embedded card
  X/Y position, flow endpoint offsets, and option icon style.
- A warning before entering Grid placement mode, which re-lays out the card one way.
- An **Include entities** option when exporting a template.
- A short tutorial after the initial setup wizard.

### Changed

- Card and editor styling migrated to CSS custom properties with Home Assistant theme
  fallbacks, so the card follows your theme instead of fighting it.

### Fixed

- Remote SVG content is sanitized before rendering. Two separate injection paths were
  closed.
- Unavailable entities show a no-data state instead of rendering a confident zero.
- Statistics read correctly: cumulative sums, sub-hour periods with no data, and
  daylight-saving boundaries were all producing wrong numbers.
- Virtual fields no longer compute against shifted operands when one input is
  unavailable.
- Value fields honour the Global Defaults power unit instead of always auto-scaling.
- Clearing a value in the editor no longer resurrects a deprecated legacy setting.
- Editor selection and navigation state stays correct after external edits, reorders and
  deletions.
- Live updates no longer freeze virtuals, graphs and embedded cards, or thrash the layout
  on every state change.
- Position tools in the expanded editor: zone pixel inputs, alignment precision, and grid
  drag membership.
- Theme and contrast fixes, including an unreadable setup wizard in light themes.
- Flow line midpoints can be selected and dragged again.

---

## 0.60 — 2026-07-26

### Added

- Control fields: Dropdown, Selector, Input, Button, SpinBox, Slider and Toggle.
- Embed a third-party Home Assistant card as a field.
- Group layout controls.

### Changed

- Extensive ribbon menu revisions.

---

## 0.50 — 2026-07-20

### Added

- The ribbon editor menu, replacing the accordion editor.

---

## 0.20 — 2026-07-19

First tagged release.
