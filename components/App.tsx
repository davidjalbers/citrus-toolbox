import React from 'react';
// import { BrowserRouter, Route, Routes } from 'react-router-dom';
// import { DocumentChartBarIcon } from '@heroicons/react/24/solid';

// import { StartPage } from '@/pages/StartPage';
import { PSMatcherPage } from '@/pages/PSMatcherPage';
import { TitleDisplay } from '@/components/title-display';
import { TitleProvider } from '@/components/title-context';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from './ErrorBoundary';

// const apps = [
//   {
//     title: 'P+S Matcher',
//     description:
//       'Based on a file with privacy form submissions, automatically filter participants who have consented to the use of their data from a file with survey submissions.',
//     href: '/ps-matcher',
//     Icon: DocumentChartBarIcon,
//     iconStyles: 'bg-teal-600 text-teal-50',
//   },
// ];

export const App = () => {
  return (
    <div className={cn('bg-slate-100 w-full h-full p-8 flex flex-col gap-6')}>
      {/* <BrowserRouter> */}
        <TitleProvider>
          <TitleDisplay />
          <ErrorBoundary>
            <PSMatcherPage />
            {/* <Routes>
              <Route path="/" element={<StartPage apps={apps} />} />
            </Routes> */}
          </ErrorBoundary>
        </TitleProvider>
      {/* </BrowserRouter> */}
    </div>
  );
};
