import React from 'react';
import { useTitleContext } from './title-context';

export function TitleDisplay() {
  const { title } = useTitleContext();
  return (
    <header>
      {/* { pathname !== "/" && (
        <nav className="sm:hidden" aria-label="Back">
          <Link to="/" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700">
            <ChevronLeftIcon className="-ml-1 mr-1 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
            Back
          </Link>
        </nav>
      )}
      <nav className="hidden sm:flex" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-4">
          {breadcrumbs.map((breadcrumb, idx) => (
            <li key={breadcrumb.href}>
              <div className="flex items-center">
                {idx != 0 && <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />}
                <Link to={breadcrumb.href} className={cn("text-sm font-medium text-gray-500 hover:text-gray-700", idx != 0 && 'ml-4')}>
                  {breadcrumb.name}
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </nav> */}
      <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        {title}
      </h1>
    </header>
  )
}
