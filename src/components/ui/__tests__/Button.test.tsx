import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a button element by default', () => {
    render(<Button>Click me</Button>);
    const el = screen.getByRole('button', { name: 'Click me' }) as HTMLButtonElement;
    expect(el.tagName).toBe('BUTTON');
    expect(el.type).toBe('button');
  });

  it('applies the variant and size classes', () => {
    render(
      <Button variant="primary" size="sm">
        Go
      </Button>,
    );
    const el = screen.getByRole('button', { name: 'Go' });
    expect(el.className).toContain('btn');
    expect(el.className).toContain('btn--primary');
    expect(el.className).toContain('btn--sm');
  });

  it('defaults to secondary variant when none specified', () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole('button').className).toContain('btn--secondary');
  });

  it('adds btn--block when block is true', () => {
    render(<Button block>Wide</Button>);
    expect(screen.getByRole('button').className).toContain('btn--block');
  });

  it('renders as a Next.js link when href is provided', () => {
    render(
      <Button href="/contests/abc" variant="on-dark">
        Display mode
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Display mode' }) as HTMLAnchorElement;
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/contests/abc');
    expect(link.className).toContain('btn--on-dark');
  });

  it('forwards onClick handlers', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Tap</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('appends extra className', () => {
    render(<Button className="contest-hero__cta">Fancy</Button>);
    const el = screen.getByRole('button');
    expect(el.className).toContain('btn--secondary');
    expect(el.className).toContain('contest-hero__cta');
  });

  it('respects an explicit type=submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect((screen.getByRole('button') as HTMLButtonElement).type).toBe('submit');
  });
});
