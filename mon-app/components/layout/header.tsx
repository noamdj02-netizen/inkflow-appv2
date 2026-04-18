import Link from 'next/link';

import { APP_NAME } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center">
        <Link href="/" className="font-bold">
          {APP_NAME}
        </Link>
        <nav className="ml-auto flex gap-4">
          <Link
            href="/about"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            À propos
          </Link>
        </nav>
      </div>
    </header>
  );
}
