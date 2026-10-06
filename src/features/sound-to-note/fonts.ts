import { Archivo, Instrument_Sans, JetBrains_Mono } from 'next/font/google';

/**
 * Archivo at 125% width stands in for the logo's wide, heavy wordmark (the
 * real face is unidentified); the `wdth` axis is what makes it read as the logo.
 */
const display = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--stn-font-display',
  display: 'swap',
});

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--stn-font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--stn-font-mono',
  display: 'swap',
});

/** Class names that define the three font variables on the site wrapper. */
export const stnFontVariables = `${display.variable} ${body.variable} ${mono.variable}`;
