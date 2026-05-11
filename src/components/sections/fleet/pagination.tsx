'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange,
}: PaginationProps) {
  const showingFrom = (currentPage - 1) * resultsPerPage + 1;
  const showingTo = Math.min(currentPage * resultsPerPage, totalResults);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      {/* Results count */}
      <p className="text-sm text-slate-500">
        Showing {showingTo} out of {totalResults} results
      </p>

      {/* Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            type="button"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              page === currentPage
                ? 'border border-slate-900 bg-border-light text-slate-900'
                : page === '...'
                  ? 'cursor-default text-slate-400'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Last page"
        >
          <ChevronDoubleRightIcon />
        </button>
      </div>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronDoubleRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M6 5l7 7-7 7" />
    </svg>
  );
}
