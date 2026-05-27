import { createRootRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { AppLayout } from '../components/layout/AppLayout';

export const Route = createRootRoute({
  // The Auth Guard: Enforces deterministic security access across the pipeline
  beforeLoad: ({ location }) => {
    const session = useAuthStore.getState().session;
    
    // If no session exists, redirect to login unless already there
    if (!session && location.pathname !== '/login') {
      throw redirect({
        to: '/login' as any,
      });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});