import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </footer>
  );
}
