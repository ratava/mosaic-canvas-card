// Tap / hold / double-tap detection for the card's action surfaces.
//
// `hold_action` and `double_tap_action` have been configurable, and correctly
// routed by the card's `onAction` dispatcher, since they were added — but every
// dispatch site called `onAction(..., 'tap')` and nothing else, so neither ever
// fired. This module is the missing link.

import { nothing } from 'lit';
import { directive, Directive, PartType, type ElementPart, type PartInfo } from 'lit/directive.js';
import type { TapActions } from './types';

export type GestureKind = 'tap' | 'hold' | 'double_tap';

/** Press duration that counts as a hold rather than a tap. */
export const HOLD_MS = 500;
/** Window in which a second tap counts as a double tap. */
export const DOUBLE_MS = 250;
/** Pointer travel above which the press was a drag, not a tap. */
export const MOVE_TOLERANCE_PX = 10;

export interface GestureConfig {
  /** Arm the hold timer. Left false, a long press is still just a tap. */
  hasHold: boolean;
  /**
   * Defer a tap by `DOUBLE_MS` to see whether a second one follows. Only set
   * this when a double-tap action actually exists: otherwise every tap on every
   * surface in the card would pay the delay to detect something nothing uses.
   */
  hasDouble: boolean;
  fire: (kind: GestureKind) => void;
}

export interface GestureBindings {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

/**
 * The press currently being measured.
 *
 * Module-level rather than per-binding because the bindings are rebuilt on every
 * render, and a card re-renders on every hass state tick — a hold started before
 * one would be dropped by it. Only one pointer gesture can be in flight at a
 * time, so a single slot is enough.
 *
 * `event` is what makes nesting work without `stopPropagation`. A pointerdown
 * bubbles innermost-first, so the inner surface claims the slot and every outer
 * handler sees its own event already claimed and bails. The inner pointerup then
 * clears the slot, so the outer's pointerup finds nothing and bails too. Leaving
 * propagation alone matters: the editor's card-drag machinery listens for
 * pointerdown on wrappers *outside* the rendered card, and stopping the event
 * here would make a card undraggable by any field on it.
 */
let inflight:
  | { event: PointerEvent; x: number; y: number; timer?: ReturnType<typeof setTimeout>; consumed: boolean }
  | undefined;

/** A tap held back to see whether it becomes a double tap. */
let pendingTap: { timer: ReturnType<typeof setTimeout>; target: EventTarget | null } | undefined;

function clearInflight(): void {
  if (inflight?.timer) clearTimeout(inflight.timer);
  inflight = undefined;
}

function clearPendingTap(): void {
  if (pendingTap) clearTimeout(pendingTap.timer);
  pendingTap = undefined;
}

export function gestures(cfg: GestureConfig): GestureBindings {
  const cancel = (): void => { clearInflight(); };

  return {
    onPointerDown: (e: PointerEvent): void => {
      // An inner surface already owns this press (see `inflight.event`).
      if (inflight?.event === e) return;
      // Secondary mouse buttons are a context menu, not a tap. Touch and pen
      // report button 0 for a normal press, so the check is mouse-only.
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      clearInflight();
      inflight = { event: e, x: e.clientX, y: e.clientY, consumed: false };
      if (!cfg.hasHold) return;
      inflight.timer = setTimeout(() => {
        if (!inflight) return;
        inflight.timer = undefined;
        // Mark before firing: the pointerup that ends this press must not also
        // register as a tap.
        inflight.consumed = true;
        clearPendingTap();
        cfg.fire('hold');
      }, HOLD_MS);
    },

    onPointerUp: (e: PointerEvent): void => {
      const press = inflight;
      // Claimed and cleared by the innermost surface; outer handlers see nothing.
      clearInflight();
      if (!press || press.consumed) return;
      // A press that travelled was a drag or a scroll.
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE_PX) return;

      const target = e.currentTarget;
      if (!cfg.hasDouble) { cfg.fire('tap'); return; }

      // Second tap on the same surface inside the window.
      if (pendingTap && pendingTap.target === target) {
        clearPendingTap();
        cfg.fire('double_tap');
        return;
      }
      clearPendingTap();
      pendingTap = {
        target,
        timer: setTimeout(() => { pendingTap = undefined; cfg.fire('tap'); }, DOUBLE_MS),
      };
    },

    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}

/** True when any of the three gestures has an action worth dispatching. */
export function hasAnyAction(a: TapActions | undefined): boolean {
  return !!(live(a?.tap_action) || live(a?.hold_action) || live(a?.double_tap_action));
}

function live(a: TapActions['tap_action']): boolean {
  return !!a && a.action !== 'none';
}

/** The action a gesture would run, or undefined when that gesture is unbound. */
export function actionFor(a: TapActions | undefined, kind: GestureKind): TapActions['tap_action'] {
  const cfg = kind === 'tap' ? a?.tap_action : kind === 'hold' ? a?.hold_action : a?.double_tap_action;
  return live(cfg) ? cfg : undefined;
}

/**
 * Gesture bindings for an action-carrying subject, or undefined when it has no
 * actions at all — so a surface with nothing bound attaches no listeners and
 * keeps its default cursor.
 */
export function actionGestures(
  subject: TapActions | undefined,
  dispatch: ((actions: TapActions, entity: string | undefined, kind: GestureKind) => void) | undefined,
): GestureBindings | undefined {
  if (!subject || !dispatch || !hasAnyAction(subject)) return undefined;
  return gestures({
    hasHold: !!actionFor(subject, 'hold'),
    hasDouble: !!actionFor(subject, 'double_tap'),
    fire: (kind) => {
      const cfg = actionFor(subject, kind);
      if (!cfg) return;
      dispatch(subject, cfg.entity, kind);
    },
  });
}

export type GestureDispatch = (actions: TapActions, entity: string | undefined, kind: GestureKind) => void;

/**
 * Element directive that wires all four pointer listeners in one binding, so a
 * dispatch site reads `<div ${actionGesture(field, onAction)}>` rather than
 * carrying four separate handlers through every branch that renders it.
 *
 * The listeners it attaches are stable trampolines that read through to the
 * current bindings. Re-rendering therefore swaps behaviour without touching the
 * DOM — which is the point, since a press in progress must survive the hass
 * state ticks that re-render the card underneath it.
 */
class ActionGestureDirective extends Directive {
  private _bindings?: GestureBindings;
  private _el?: Element;

  private readonly _down = (e: Event): void => this._bindings?.onPointerDown(e as PointerEvent);
  private readonly _up = (e: Event): void => this._bindings?.onPointerUp(e as PointerEvent);
  private readonly _leave = (): void => this._bindings?.onPointerLeave();
  private readonly _cancel = (): void => this._bindings?.onPointerCancel();

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('actionGesture can only be used as an element binding');
    }
  }

  override update(
    part: ElementPart,
    [subject, dispatch]: [TapActions | undefined, GestureDispatch | undefined],
  ): unknown {
    this._bindings = actionGestures(subject, dispatch);
    const el = part.element;
    if (this._el !== el) {
      // Listeners live on the element, so a removed element takes them with it;
      // only a directive re-pointed at a different element needs a detach.
      this._detach();
      this._el = el;
      el.addEventListener('pointerdown', this._down);
      el.addEventListener('pointerup', this._up);
      el.addEventListener('pointerleave', this._leave);
      el.addEventListener('pointercancel', this._cancel);
    }
    return this.render(subject, dispatch);
  }

  private _detach(): void {
    const el = this._el;
    if (!el) return;
    el.removeEventListener('pointerdown', this._down);
    el.removeEventListener('pointerup', this._up);
    el.removeEventListener('pointerleave', this._leave);
    el.removeEventListener('pointercancel', this._cancel);
  }

  // The parameters are what `directive()` reads the call signature from; the
  // work happens in update(), which has the element.
  render(_subject: TapActions | undefined, _dispatch: GestureDispatch | undefined): unknown {
    return nothing;
  }
}

export const actionGesture = directive(ActionGestureDirective);
