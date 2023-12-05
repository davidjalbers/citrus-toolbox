import React from 'react';
import { Button } from '@/components/ui/Button';

import { productName } from '@/package.json';

export const App = () => {
  return (
    <>
      <h1>{productName}</h1>
      <p>Welcome to your Electron application.</p>
      <Button>Click me!</Button>
    </>
  );
};
