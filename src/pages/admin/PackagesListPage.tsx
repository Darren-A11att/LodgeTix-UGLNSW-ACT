import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { DataTable } from '../../components/admin/ui';
import ConfirmDialog from '../../components/admin/ui/ConfirmDialog';
import adminAPI from '../../lib/api/admin';
import { QueryParams } from '../../lib/api/admin/adminApiService';
import * as SupabaseTypes from '../../../supabase/supabase.types';

type DbPackage = SupabaseTypes.Database['public']['Tables']['packages']['Row'];

const PackagesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = React.useState<DbPackage[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [packageToDelete, setPackageToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  
  // Pagination state
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  // Search state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Fetch packages on component mount and when pagination/sort/search changes
  React.useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Build query params
        const params: QueryParams = {
          pagination: {
            page: pageIndex + 1,
            limit: pageSize
          },
          sort: {
            column: sortBy,
            ascending: sortDirection === 'asc'
          }
        };
        
        // Add search if provided
        if (searchQuery) {
          params.search = {
            columns: ['name', 'description'],
            query: searchQuery
          };
        }
        
        const response = await adminAPI.packages.getPackages(params);
        
        if (response.error) {
          setError(`Failed to fetch packages: ${response.error.message}`);
          return;
        }
        
        setPackages(response.data || []);
        setTotalCount(response.count || 0);
      } catch (err: any) {
        setError(`An unexpected error occurred: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPackages();
  }, [pageIndex, pageSize, sortBy, sortDirection, searchQuery]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
  };
  
  // Handle sort change
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortBy(column);
    setSortDirection(direction);
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPageIndex(0); // Reset to first page on new search
  };
  
  // Delete package
  const handleDeleteClick = (packageId: string) => {
    setPackageToDelete(packageId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!packageToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const response = await adminAPI.packages.deletePackage(packageToDelete);
      
      if (response.error) {
        setError(`Failed to delete package: ${response.error.message}`);
      } else {
        // Remove the deleted package from the list
        setPackages(packages.filter(pkg => pkg.id !== packageToDelete));
        
        if (totalCount > 0) {
          setTotalCount(totalCount - 1);
        }
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };
  
  // Table columns definition
  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessor: (pkg: DbPackage) => (
        <div className="font-medium text-gray-900">{pkg.name}</div>
      ),
      sortable: true
    },
    {
      id: 'description',
      header: 'Description',
      accessor: (pkg: DbPackage) => (
        <div className="truncate max-w-md">
          {pkg.description || 'No description provided'}
        </div>
      ),
      sortable: true
    },
    {
      id: 'parent_event_id',
      header: 'Parent Event',
      accessor: (pkg: DbPackage) => {
        if (!pkg.parent_event_id) {
          return <span className="text-gray-500">None</span>;
        }
        
        return (
          <Link 
            to={`/admin-portal/events/${pkg.parent_event_id}/view`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            View Event
          </Link>
        );
      },
      sortable: true
    },
    {
      id: 'created_at',
      header: 'Created',
      accessor: (pkg: DbPackage) => {
        const date = new Date(pkg.created_at);
        return date.toLocaleDateString();
      },
      sortable: true
    }
  ];
  
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Packages</h1>
          <Link
            to="/admin-portal/packages/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Package
          </Link>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <DataTable
          columns={columns}
          data={packages}
          totalItems={totalCount}
          loading={loading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          searchable={true}
          onSearch={handleSearch}
          actionColumn={{
            header: 'Actions',
            render: (pkg: DbPackage) => (
              <div className="flex justify-end space-x-3">
                <Link
                  to={`/admin-portal/packages/${pkg.id}/view`}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="View"
                >
                  <EyeIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  to={`/admin-portal/packages/${pkg.id}/edit`}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="Edit"
                >
                  <PencilIcon className="h-5 w-5" aria-hidden="true" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(pkg.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            )
          }}
        />
      </div>
      
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Package"
        message="Are you sure you want to delete this package? This action cannot be undone."
        confirmText="Delete"
        confirmType="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isProcessing={isDeleting}
      />
    </div>
  );
};

export default PackagesListPage;