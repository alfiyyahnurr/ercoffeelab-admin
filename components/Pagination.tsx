'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50],
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const safeTotalPages = Math.max(1, totalPages);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (safeTotalPages <= 7) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(safeTotalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < safeTotalPages) {
          pages.push(i);
        }
      }

      if (currentPage < safeTotalPages - 2) pages.push('...');
      pages.push(safeTotalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="bg-white px-4 py-3.5 border-t border-[#E7E8F0] rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-source">
      {/* Left side: Items Counter & Items Per Page Selector */}
      <div className="flex flex-wrap items-center gap-4 text-[#6B7088]">
        <div>
          Menampilkan{' '}
          <strong className="font-bold text-[#181F4B] font-albert">
            {startItem.toLocaleString('id-ID')} - {endItem.toLocaleString('id-ID')}
          </strong>{' '}
          dari{' '}
          <strong className="font-bold text-[#181F4B] font-albert">
            {totalItems.toLocaleString('id-ID')}
          </strong>{' '}
          data
        </div>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="pl-3 pr-7 py-1.5 bg-[#F4F5F9] border border-[#E7E8F0] hover:border-[#C9A876] rounded-xl text-xs font-bold text-[#181F4B] focus:outline-none appearance-none cursor-pointer transition shadow-2xs"
              >
                {itemsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7088] pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Right side: Pagination Navigation Controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {/* First Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E7E8F0] bg-white text-[#181F4B] font-semibold transition hover:bg-[#F6F3EC] hover:border-[#C9A876] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7E8F0] disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5 text-[#6B7088]" />
          <span className="hidden md:inline">First</span>
        </button>

        {/* Previous Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl border border-[#E7E8F0] bg-white text-[#181F4B] transition hover:bg-[#F6F3EC] hover:border-[#C9A876] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7E8F0] disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4 text-[#6B7088]" />
        </button>

        {/* Page Number Buttons */}
        {pageNumbers.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`ellipse-${idx}`} className="px-2 text-[#A0A5BD] font-bold">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;

          return (
            <button
              key={`page-${p}`}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl font-bold font-albert text-xs transition cursor-pointer hover:scale-105 active:scale-95 ${
                isActive
                  ? 'bg-[#181F4B] text-[#C9A876] shadow-md border border-[#181F4B]'
                  : 'bg-white border border-[#E7E8F0] text-[#1E202B] hover:border-[#C9A876] hover:bg-[#F6F3EC]'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          disabled={currentPage === safeTotalPages}
          className="p-1.5 rounded-xl border border-[#E7E8F0] bg-white text-[#181F4B] transition hover:bg-[#F6F3EC] hover:border-[#C9A876] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7E8F0] disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-4 h-4 text-[#6B7088]" />
        </button>

        {/* Last Button */}
        <button
          onClick={() => onPageChange(safeTotalPages)}
          disabled={currentPage === safeTotalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E7E8F0] bg-white text-[#181F4B] font-semibold transition hover:bg-[#F6F3EC] hover:border-[#C9A876] disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-[#E7E8F0] disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
          title="Halaman Terakhir"
        >
          <span className="hidden md:inline">Last</span>
          <ChevronsRight className="w-3.5 h-3.5 text-[#6B7088]" />
        </button>
      </div>
    </div>
  );
}
