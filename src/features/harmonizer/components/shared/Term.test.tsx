import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { content } from '../../content';
import { Term } from './Term';

// Vitest runs without `globals: true`, so RTL's automatic cleanup never hooks in.
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
});

/** The wrap span (hover surface) around a rendered trigger. */
function wrapOf(trigger: HTMLElement): HTMLElement {
  const wrap = trigger.parentElement;
  if (!(wrap instanceof HTMLElement)) throw new Error('term wrap missing');
  return wrap;
}

function hoverIn(target: HTMLElement) {
  fireEvent.pointerOver(target, { relatedTarget: document.body });
}

function hoverOut(target: HTMLElement) {
  fireEvent.pointerOut(target, { relatedTarget: document.body });
}

describe('Term', () => {
  it('opens after the hover delay, not before', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });

    hoverIn(wrapOf(trigger));
    act(() => vi.advanceTimersByTime(249));
    expect(screen.queryByRole('group')).toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('group')).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('grace period lets the pointer travel onto the panel; leaving closes', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });
    const wrap = wrapOf(trigger);

    hoverIn(wrap);
    act(() => vi.advanceTimersByTime(250));
    const panel = screen.getByRole('group');

    // Crossing the 4px gap: leave fires, but re-entering the panel within the
    // grace window keeps the tip open.
    hoverOut(wrap);
    act(() => vi.advanceTimersByTime(100));
    expect(screen.getByRole('group')).toBeTruthy();
    hoverIn(panel);
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByRole('group')).toBeTruthy();

    // Actually leaving lets the grace expire and the tip closes.
    hoverOut(panel);
    act(() => vi.advanceTimersByTime(150));
    expect(screen.queryByRole('group')).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('click pins the tip open through pointer leave', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });

    fireEvent.click(trigger);
    expect(screen.getByRole('group')).toBeTruthy();

    hoverOut(wrapOf(trigger));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('group')).toBeTruthy();

    // A second activation closes the pinned tip (toggletip contract).
    fireEvent.click(trigger);
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('Escape closes and returns focus to the trigger', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });

    fireEvent.click(trigger);
    expect(screen.getByRole('group')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('group')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('outside pointerdown closes a pinned tip', () => {
    render(<Term termId="tonic" />);
    fireEvent.click(screen.getByRole('button', { name: 'tonic' }));
    expect(screen.getByRole('group')).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('only one tip is open at a time (tip-channel)', () => {
    render(
      <>
        <Term termId="tonic" />
        <Term termId="beat" />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'tonic' }));
    expect(screen.getAllByRole('group')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'beat' }));
    const panels = screen.getAllByRole('group');
    expect(panels).toHaveLength(1);
    expect(within(panels[0]).getByText(/steady pulse/)).toBeTruthy();
  });

  it('a nested term replaces the panel content in place; back returns', () => {
    render(<Term termId="dominant" />);
    const trigger = screen.getByRole('button', { name: 'dominant' });
    fireEvent.click(trigger);

    const panel = screen.getByRole('group');
    expect(within(panel).getByText(/strongest pull toward home/)).toBeTruthy();
    expect(within(panel).queryByRole('button', { name: content.glossary.back })).toBeNull();

    // The definition's [chord] reference is a link that swaps content in place.
    fireEvent.click(within(panel).getByRole('button', { name: 'chord' }));
    const swapped = screen.getByRole('group');
    expect(swapped.id).toBe(trigger.getAttribute('aria-controls'));
    expect(within(swapped).getByText(/Three or more pitches/)).toBeTruthy();
    expect(within(swapped).queryByText(/strongest pull toward home/)).toBeNull();

    fireEvent.click(within(swapped).getByRole('button', { name: content.glossary.back }));
    expect(within(screen.getByRole('group')).getByText(/strongest pull toward home/)).toBeTruthy();
    expect(
      within(screen.getByRole('group')).queryByRole('button', { name: content.glossary.back }),
    ).toBeNull();
  });

  it('honors the aria-expanded / aria-controls contract', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBeTruthy();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('group').id).toBe(trigger.getAttribute('aria-controls'));
  });

  it('activating a Term inside a clickable parent does not activate the parent', () => {
    const onParentClick = vi.fn();
    const onParentKeyDown = vi.fn();
    render(
      <div
        role="button"
        aria-label="select card"
        tabIndex={0}
        onClick={onParentClick}
        onKeyDown={onParentKeyDown}
      >
        <Term termId="tonic" />
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'tonic' });

    fireEvent.click(trigger);
    expect(screen.getByRole('group')).toBeTruthy();
    expect(onParentClick).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it('keyboard focus previews after the same delay; leaving the wrap closes', () => {
    render(<Term termId="tonic" />);
    const trigger = screen.getByRole('button', { name: 'tonic' });

    act(() => trigger.focus());
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByRole('group')).toBeTruthy();

    fireEvent.focusOut(wrapOf(trigger), { relatedTarget: document.body });
    expect(screen.queryByRole('group')).toBeNull();
  });
});
