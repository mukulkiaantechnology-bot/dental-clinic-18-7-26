import { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';

export function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  searchKey,
  pageSize = 5
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtering
  const filteredData = data.filter((item) => {
    if (!searchKey || !searchQuery) return true;
    const value = item[searchKey];
    if (value === undefined || value === null) return false;
    return String(value).toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in text-left">
      {/* Search Bar */}
      {searchKey && (
        <div className="relative w-full max-w-sm flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground z-10" />
          <Input
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="pl-9 h-11 md:h-10 w-full text-sm"
          />
        </div>
      )}

      {/* Desktop & Tablet Table Layout */}
      <div className="w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-3.5 px-4 font-semibold ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, itemIdx) => (
                <tr
                  key={item.id || itemIdx}
                  className="hover:bg-muted/40 transition-colors duration-150"
                >
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      className={`py-3.5 px-4 font-medium text-foreground/90 ${
                        col.align === 'center'
                          ? 'text-center'
                          : col.align === 'right'
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-muted-foreground font-medium"
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex flex-col gap-4 md:hidden">
        {paginatedData.length > 0 ? (
          paginatedData.map((item, itemIdx) => (
            <div
              key={item.id || itemIdx}
              className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-3"
            >
              {columns.map((col, idx) => {
                const isActions = 
                  col.key === 'actions' || 
                  col.header.toLowerCase().includes('action') || 
                  col.header.toLowerCase().includes('trigger') ||
                  col.align === 'right';

                if (isActions) {
                  return (
                    <div key={idx} className="flex flex-col gap-2 border-b border-border/40 pb-2.5 last:border-0 last:pb-0 last:mb-0 text-left">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        {col.header}
                      </span>
                      <div className="text-xs font-bold text-foreground w-full">
                        {col.render ? col.render(item) : item[col.key]}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="flex justify-between items-start gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0 last:mb-0">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 flex-shrink-0">
                      {col.header}
                    </span>
                    <div className="text-xs font-bold text-foreground text-right break-all max-w-[200px]">
                      {col.render ? col.render(item) : item[col.key]}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground text-xs font-semibold bg-card border border-border rounded-xl">
            No records found.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between py-3 border-t border-border mt-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Page {currentPage} of {totalPages} ({filteredData.length} entries)
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-10 md:h-8 px-3 md:px-2 flex-1 sm:flex-none cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-10 md:h-8 px-3 md:px-2 flex-1 sm:flex-none cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default DataTable;
