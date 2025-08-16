
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { Insight } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Link href={insight.link} className="block h-full">
      <Card className={cn("h-40 flex flex-col justify-between p-4 group", insight.color)}>
        <div>
          <insight.icon className="h-6 w-6 text-foreground/80 mb-2" />
          <h3 className="font-bold text-md leading-tight text-foreground/90">{insight.title}</h3>
        </div>
        <div className="flex justify-end">
            <ArrowRight className="h-5 w-5 text-foreground/70 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  );
}
