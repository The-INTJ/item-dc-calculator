import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROFILE } from '../lib/fixtures/weather';
import { GrassProfileForm } from './GrassProfileForm';

afterEach(cleanup);
describe('lawn profile editing', () => {
  it('lets commas be typed naturally and only normalizes on save', () => {
    const save = vi.fn();
    render(<GrassProfileForm profile={PROFILE} onSave={save} />);
    const input = screen.getByRole('textbox', { name: 'Weeds · comma separated' });
    fireEvent.change(input, { target: { value: 'clover, ' } });
    expect((input as HTMLInputElement).value).toBe('clover, ');
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: 'clover, Dandelion, clover' } });
    fireEvent.submit(screen.getByRole('form', { name: 'Lawn profile' }));
    expect(save.mock.calls[0][0].weedTypes).toEqual(['clover', 'dandelion']);
  });
  it('cannot overwrite a weather location changed while this form was open', () => {
    const save = vi.fn();
    render(<GrassProfileForm profile={PROFILE} onSave={save} />);
    fireEvent.submit(screen.getByRole('form', { name: 'Lawn profile' }));
    expect(save.mock.calls[0][0]).not.toHaveProperty('location');
    expect(save.mock.calls[0][0]).not.toHaveProperty('locationName');
  });
});
