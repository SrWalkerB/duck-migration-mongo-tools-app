import { NavLink } from 'react-router-dom';
import { Database, ArrowRightLeft, History, Bird, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

const navItems = [
  { to: '/connections', labelKey: 'sidebar.connections', icon: Database },
  { to: '/migration', labelKey: 'sidebar.newMigration', icon: ArrowRightLeft },
  { to: '/history', labelKey: 'sidebar.history', icon: History },
  { to: '/settings', labelKey: 'sidebar.settings', icon: Settings },
] as const;

export function Sidebar() {
  const { t } = useLanguage();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-card border-r border-border">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Bird className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground tracking-tight">
          {t('sidebar.title')}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navItems.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-muted-foreground">
          {t('sidebar.footerTagline')}
        </p>
      </div>
    </aside>
  );
}
