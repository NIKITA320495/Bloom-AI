
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Article } from '@/lib/types';

export function BlogCard({ article }: { article: Article }) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Card className="overflow-hidden group h-full flex flex-col text-left bg-glass">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="woman meditating"
          />
        </div>
        <CardContent className="p-3 flex-grow">
          <h3 className="font-semibold font-headline text-sm leading-tight">
            {article.title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  );
}

    