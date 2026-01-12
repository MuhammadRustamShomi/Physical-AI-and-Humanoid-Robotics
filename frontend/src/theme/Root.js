import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';

export default function Root({ children }) {
  return (
    <>
      {children}
      <SpeedInsights />
    </>
  );
}
