import React from 'react';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-container">
      <div className="max-width-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Header />
        <main style={{ flex: 1, paddingBottom: '48px', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
