import Link from 'next/link';

interface AnnouncementBarProps {
  message: string;
  linkText: string;
  linkHref: string;
}

export function AnnouncementBar({ message, linkText, linkHref }: AnnouncementBarProps) {
  return (
    <div className="bg-navy py-1.5 text-center text-xs text-white">
      <p>
        {message}{' '}
        <Link href={linkHref} className="font-semibold underline hover:no-underline">
          {linkText}
        </Link>
      </p>
    </div>
  );
}


