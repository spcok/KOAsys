import React from 'react';
import { useLocation } from '@tanstack/react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// 1. Defined interface to resolve esbuild/TypeScript parsing collisions
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  
  // 2. Logic to isolate the Login view from the App Shell
  // This ensures the Sidebar and Header do not mount on the login page
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  // 3. Protected Application Shell
  return (
    <div className="flex h-screen bg-[#0A0B0E]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}