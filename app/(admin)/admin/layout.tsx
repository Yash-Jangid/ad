'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { Navbar } from '@/components/templates/Navbar';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { useAuthStore } from '@/lib/stores/authStore';
import { ROUTES } from '@/lib/constants/routes';

// ── Admin role levels that can access the admin panel ─────────────────────────
// Mirrors the backend ROLE_LEVELS hierarchy used in the middleware cookie guard.
const ADMIN_LEVEL_THRESHOLD = 700; // ADMIN level is 700+ in the backend

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Client-side guard: middleware handles server-side, this handles hydrated state.
  const hasAccess = user ? (user.role?.level ?? 0) >= ADMIN_LEVEL_THRESHOLD : true; // true = allow while loading

  if (user && !hasAccess) {
    router.replace(ROUTES.user.dashboard);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3">
        <Icon icon={Shield} size={24} className="text-error" />
        <Text variant="small" color="secondary">Access denied. Redirecting…</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMobileMenuToggle={() => {}} isMobileMenuOpen={false} />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Admin sidebar */}
        <aside className="hidden lg:flex flex-col w-52 border-r border-border bg-background-secondary px-3 py-4 gap-1">
          <Text variant="caption" color="tertiary" className="px-3 mb-2 uppercase tracking-widest font-semibold">
            Admin
          </Text>
          {[
            { href: ROUTES.admin.matches,   label: 'Matches'    },
            { href: ROUTES.admin.users,     label: 'Users'      },
            { href: ROUTES.admin.auditLogs, label: 'Audit Logs' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-background-tertiary hover:text-text-primary transition-colors"
            >
              {label}
            </a>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8" aria-label="Admin content">
          {children}
        </main>
      </div>
    </div>
  );
}
