'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const THEME_CLASSES = ['theme-mixology', 'theme-legacy'];

export function ThemeBodyClass() {
  const pathname = usePathname();

  useEffect(() => {
    const themeClass = pathname.startsWith('/legacy') ? 'theme-legacy' : 'theme-mixology';
    const { classList } = document.body;

    THEME_CLASSES.forEach((existingClass) => {
      if (existingClass !== themeClass) {
        classList.remove(existingClass);
      }
    });

    classList.add(themeClass);
  }, [pathname]);

  return null;
}
