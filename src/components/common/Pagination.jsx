// src/components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentPage === 1
            ? 'text-[#B0BEC5] cursor-not-allowed'
            : 'text-[#455A64] hover:bg-[#F7F7F7]'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="w-10 h-10 rounded-lg text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
          >
            1
          </button>
          {startPage > 2 && (
            <span className="text-[#B0BEC5]">...</span>
          )}
        </>
      )}
      
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(
            'w-10 h-10 rounded-lg font-medium transition-colors',
            page === currentPage
              ? 'bg-[#26323B] text-white'
              : 'text-[#455A64] hover:bg-[#F7F7F7]'
          )}
        >
          {page}
        </button>
      ))}
      
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-[#B0BEC5]">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="w-10 h-10 rounded-lg text-[#455A64] hover:bg-[#F7F7F7] transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded-lg transition-colors',
          currentPage === totalPages
            ? 'text-[#B0BEC5] cursor-not-allowed'
            : 'text-[#455A64] hover:bg-[#F7F7F7]'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}