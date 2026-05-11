import { StarRating } from './star-rating';

interface TestimonialCardProps {
  rating: number;
  quote: string;
  content: string;
  author: string;
  location: string;
  date: string;
}

export function TestimonialCard({ rating, quote, content, author, location, date }: TestimonialCardProps) {
  return (
    <div className="flex w-full flex-col lg:max-w-70">
      <StarRating rating={rating} />
      <blockquote className="mt-4">
        <p className="text-base font-semibold leading-none tracking-tight-2 text-white">&ldquo;{quote}&rdquo;</p>
      </blockquote>
      <p className="body-text mt-4 text-slate-300">
        {content}
      </p>
      <div className="mt-6">
        <p className="text-xs font-semibold text-white">{author}</p>
        <p className="text-xs text-slate-400">
          {location} • {date}
        </p>
      </div>
    </div>
  );
}
