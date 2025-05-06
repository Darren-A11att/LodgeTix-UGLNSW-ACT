import * as React from 'react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/20/solid';

interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalItems?: number;
  loading?: boolean;
  keyField?: keyof T;
  
  // Pagination
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (newPage: number) => void;
  
  // Sorting
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  
  // Selection
  selectable?: boolean;
  selectedRows?: any[];
  onSelectionChange?: (selectedIds: any[]) => void;
  
  // Search
  searchable?: boolean;
  onSearch?: (query: string) => void;
  
  // Actions
  actionColumn?: {
    header?: string;
    render: (row: T) => React.ReactNode;
  };
}

function DataTable<T>({
  columns,
  data,
  totalItems,
  loading = false,
  keyField = 'id' as keyof T,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  sortBy,
  sortDirection = 'asc',
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  searchable = false,
  onSearch,
  actionColumn
}: DataTableProps<T>): JSX.Element {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selected, setSelected] = React.useState<any[]>(selectedRows);
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 
    Math.ceil(data.length / pageSize);
  
  // Update selected state when prop changes
  React.useEffect(() => {
    setSelected(selectedRows);
  }, [selectedRows]);
  
  // Handle row selection
  const handleRowSelect = (row: T) => {
    if (!selectable || !onSelectionChange) return;
    
    const id = row[keyField];
    const isSelected = selected.includes(id);
    let newSelected: any[];
    
    if (isSelected) {
      newSelected = selected.filter(item => item !== id);
    } else {
      newSelected = [...selected, id];
    }
    
    setSelected(newSelected);
    onSelectionChange(newSelected);
  };
  
  // Handle select all rows
  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return;
    
    if (selected.length === data.length) {
      setSelected([]);
      onSelectionChange([]);
    } else {
      const allIds = data.map(row => row[keyField]);
      setSelected(allIds);
      onSelectionChange(allIds);
    }
  };
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  // Handle sorting
  const handleSort = (columnId: string) => {
    if (!onSort) return;
    
    const newDirection = 
      sortBy === columnId && sortDirection === 'asc' ? 'desc' : 'asc';
    
    onSort(columnId, newDirection);
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };
  
  return (
    <div className="w-full overflow-hidden bg-white shadow-sm rounded-lg">
      {/* Search */}
      {searchable && onSearch && (
        <div className="px-4 py-3 border-b border-gray-200">
          <form onSubmit={handleSearchSubmit} className="flex">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search..."
              />
            </div>
            <button
              type="submit"
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Search
            </button>
          </form>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Checkbox column */}
              {selectable && (
                <th scope="col" className="w-12 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              
              {/* Data columns */}
              {columns.map(column => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.sortable && onSort ? (
                    <button
                      className="group inline-flex items-center"
                      onClick={() => handleSort(column.id)}
                    >
                      {column.header}
                      <span className="ml-2 flex-none rounded text-gray-400">
                        {sortBy === column.id ? (
                          sortDirection === 'desc' ? (
                            <ArrowDownIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <ArrowUpIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )
                        ) : (
                          <div className="h-4 w-4 invisible group-hover:visible group-focus:visible">
                            <ArrowUpIcon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              
              {/* Actions column */}
              {actionColumn && (
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {actionColumn.header || 'Actions'}
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actionColumn ? 1 : 0)}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  <div className="flex justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-indigo-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actionColumn ? 1 : 0)}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No records found
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={String(row[keyField])}
                  className={`hover:bg-gray-50 ${
                    selectable && selected.includes(row[keyField])
                      ? 'bg-indigo-50'
                      : ''
                  }`}
                >
                  {/* Checkbox cell */}
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        checked={selected.includes(row[keyField])}
                        onChange={() => handleRowSelect(row)}
                      />
                    </td>
                  )}
                  
                  {/* Data cells */}
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                  
                  {/* Actions cell */}
                  {actionColumn && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {actionColumn.render(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {onPageChange && (
        <nav
          className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min((pageIndex + 1) * pageSize, totalItems || data.length)}
              </span>{' '}
              of <span className="font-medium">{totalItems || data.length}</span> results
            </p>
          </div>
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                pageIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex === totalPages - 1}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                pageIndex === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Next
              <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default DataTable;