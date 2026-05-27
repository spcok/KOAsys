// src/routes/login.tsx
import { createFileRoute } from '@tanstack/react-router';
import { Login } from '../features/auth/Login';

export const Route = createFileRoute('/login')({
  component: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0B0E]">
      <Login />
    </div>
  ),
});