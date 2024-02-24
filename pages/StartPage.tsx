import React, { useEffect } from 'react';

import { HeroIcon, cn } from '@/lib/utils';
import { useTitleContext } from '../components/title-context';

type StartPageProps = {
  apps: {
    title: string;
    description: string;
    href: string;
    Icon: HeroIcon;
    iconStyles: string;
  }[];
};

export function StartPage({ apps }: StartPageProps) {
  const { setTitle } = useTitleContext();
  useEffect(() => setTitle('Select an app'), []);
  return (
    <main
      className={cn(
        'divide-y divide-gray-200 rounded-lg',
        //'sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0', // grid for a greater number of apps
        'shadow', // careful: with grid, shadow only works as intended with an even number of apps
      )}
    >
      {apps.map((app, idx) => (
        <div
          key={app.title}
          className={cn(
            // Style specific cards specially to round the outer corners
            // For exactly 1 entry (list with or without grid from sm):
            //'rounded-lg shadow',
            // For list without grid from sm:
            idx == 0 && 'rounded-tl-lg rounded-tr-lg',
            idx == apps.length - 1 && 'rounded-bl-lg rounded-br-lg',
            // For exactly 2 entries (list with grid from sm):
            // idx == 0 && 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none sm:rounded-bl-lg',
            // idx == 1 && 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none sm:rounded-tr-lg',
            // For 4 or more entries (list with grid from sm):
            // idx == 0 && 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none',
            // idx == 1 && 'sm:rounded-tr-lg',
            // idx == apps.length - 2 && 'sm:rounded-bl-lg',
            // idx == apps.length - 1 && 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none',
            'group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500',
          )}
        >
          <div>
            <span
              className={cn(
                app.iconStyles,
                'inline-flex rounded-lg p-3 ring-4 ring-white',
              )}
            >
              <app.Icon className="h-8 w-8" aria-hidden="true" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              <a href={app.href} className="focus:outline-none">
                {/* Extend touch target to entire panel */}
                <span className="absolute inset-0" aria-hidden="true" />
                {app.title}
              </a>
            </h3>
            <p className="mt-2 text-sm text-gray-500">{app.description}</p>
          </div>
          <span
            className="pointer-events-none absolute right-6 top-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
            </svg>
          </span>
        </div>
      ))}
    </main>
  );
}
