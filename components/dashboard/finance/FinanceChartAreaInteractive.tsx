import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatEuroPrivacy } from '@/contexts/StudioPrivacyContext';

export interface FinanceChartMonthPoint {
  month: string;
  revenue: number;
  cash: number;
  total: number;
}

const chartConfig = {
  revenue: {
    label: 'RDV',
    color: 'var(--chart-1)',
  },
  cash: {
    label: 'Espèces',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

type TimeRange = '6m' | '3m' | '1m';

/** Graphique area — structure [dashboard-01 ChartAreaInteractive](https://ui.shadcn.com/view/new-york-v4/dashboard-01). */
export interface FinanceChartAreaInteractiveProps {
  monthlyData: FinanceChartMonthPoint[];
  privacyMode?: boolean;
}

export function FinanceChartAreaInteractive({
  monthlyData,
  privacyMode = false,
}: FinanceChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('6m');

  const filteredData = React.useMemo(() => {
    const slice = timeRange === '6m' ? 6 : timeRange === '3m' ? 3 : 1;
    return monthlyData.slice(-slice).map((row) => ({
      month: row.month,
      revenue: row.revenue,
      cash: row.cash,
    }));
  }, [monthlyData, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Encaissements</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">Total sur les derniers mois</span>
          <span className="@[540px]/card:hidden">Derniers mois</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v as TimeRange)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="6m">6 mois</ToggleGroupItem>
            <ToggleGroupItem value="3m">3 mois</ToggleGroupItem>
            <ToggleGroupItem value="1m">1 mois</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Période du graphique"
            >
              <SelectValue placeholder="6 mois" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="6m" className="rounded-lg">
                6 mois
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                3 mois
              </SelectItem>
              <SelectItem value="1m" className="rounded-lg">
                1 mois
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="relative">
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillFinanceRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillFinanceCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cash)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-cash)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    formatter={(value, name) => [
                      privacyMode
                        ? '••••'
                        : formatEuroPrivacy(Number(value), false).replace(/\s/g, '\u00a0'),
                      name === 'revenue' ? 'RDV' : 'Espèces',
                    ]}
                  />
                }
              />
              <Area
                dataKey="cash"
                type="natural"
                fill="url(#fillFinanceCash)"
                stroke="var(--color-cash)"
                stackId="a"
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillFinanceRevenue)"
                stroke="var(--color-revenue)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
          {privacyMode ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/80 backdrop-blur-[2px]">
              <span className="text-sm font-medium text-muted-foreground">Graphique masqué</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
