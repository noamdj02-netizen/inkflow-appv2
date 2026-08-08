import { useEffect, useRef } from 'react';
import { BadgeCheck, LayoutGrid, ScanLine } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VITRINE_STEPS = [
  { label: 'Scannez le QR', Icon: ScanLine },
  { label: 'Choisissez votre flash', Icon: LayoutGrid },
  { label: "Réservez & payez l'acompte", Icon: BadgeCheck },
] as const;

/** Carte shadcn — QR vitrine (structure maia : carte + QR centré + légende étapes). */
export interface FinanceVitrineQrCardProps {
  vitrineUrl: string;
  studioName: string;
  className?: string;
}

export function FinanceVitrineQrCard({
  vitrineUrl,
  studioName,
  className,
}: FinanceVitrineQrCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !vitrineUrl) return;
    QRCodeLib.toCanvas(canvasRef.current, vitrineUrl, {
      width: 160,
      margin: 1,
      color: { dark: '#0d0d0d', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(() => {});
  }, [vitrineUrl]);

  return (
    <Card
      className={cn(
        'rounded-md border-border bg-card ring-1 ring-border/80 shadow-none',
        className
      )}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-sm font-semibold text-foreground">QR code vitrine</CardTitle>
        <CardDescription className="text-xs">
          Partagez ce code en studio — vos clients accèdent à la vitrine InkFlow.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-4">
        <div className="rounded-md border border-border bg-background p-3">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`QR code vitrine ${studioName}`}
            className="block size-40"
          />
        </div>
        <div className="w-full space-y-1 text-center">
          <p className="truncate text-sm font-medium text-foreground">{studioName}</p>
          <p className="text-xs text-muted-foreground">Choisissez, réservez et payez en ligne</p>
        </div>
        <ul className="flex w-full flex-col gap-2 border-t border-border pt-4">
          {VITRINE_STEPS.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
