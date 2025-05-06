import * as React from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export interface DetailField {
  label: string;
  value: React.ReactNode;
  type?: 'text' | 'image' | 'date' | 'currency' | 'email' | 'phone' | 'url' | 'boolean' | 'list' | 'custom';
}

export interface DetailSection {
  title?: string;
  fields: DetailField[];
}

interface DetailViewProps {
  title: string;
  subtitle?: string;
  sections: DetailSection[];
  loading?: boolean;
  error?: string;
  backTo?: string;
  backLabel?: string;
  editPath?: string;
  onDelete?: () => void;
  customActions?: React.ReactNode;
}

const DetailView: React.FC<DetailViewProps> = ({
  title,
  subtitle,
  sections,
  loading = false,
  error,
  backTo,
  backLabel = 'Back',
  editPath,
  onDelete,
  customActions
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  const renderFieldValue = (field: DetailField) => {
    if (field.value === null || field.value === undefined) {
      return <span className="text-gray-400">—</span>;
    }
    
    switch (field.type) {
      case 'image':
        return (
          <img
            src={field.value as string}
            alt={field.label}
            className="h-24 w-auto object-cover rounded-md"
          />
        );
      
      case 'date':
        return (
          <time dateTime={field.value as string}>
            {new Date(field.value as string).toLocaleString()}
          </time>
        );
      
      case 'currency':
        return (
          <span>
            ${typeof field.value === 'number'
              ? field.value.toFixed(2)
              : field.value}
          </span>
        );
      
      case 'email':
        return (
          <a
            href={`mailto:${field.value}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {field.value}
          </a>
        );
      
      case 'phone':
        return (
          <a
            href={`tel:${field.value}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {field.value}
          </a>
        );
      
      case 'url':
        return (
          <a
            href={field.value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-900"
          >
            {field.value}
          </a>
        );
      
      case 'boolean':
        return field.value ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            No
          </span>
        );
      
      case 'list':
        if (Array.isArray(field.value)) {
          return field.value.length > 0 ? (
            <ul className="list-disc list-inside">
              {field.value.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">No items</span>
          );
        }
        return <span>{field.value}</span>;
      
      case 'custom':
        return field.value;
      
      default:
        return <span>{field.value}</span>;
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            
            {[1, 2, 3].map(i => (
              <div key={i} className="mb-6">
                <div className="h-5 bg-gray-200 rounded w-1/6 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="grid grid-cols-3 gap-4">
                      <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                      <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-start">
          <div>
            {backTo && (
              <Link
                to={backTo}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                {backLabel}
              </Link>
            )}
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          
          <div className="flex">
            {customActions}
            
            {editPath && (
              <Link
                to={editPath}
                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PencilIcon className="-ml-0.5 mr-1 h-4 w-4" />
                Edit
              </Link>
            )}
            
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="-ml-0.5 mr-1 h-4 w-4" />
                Delete
              </button>
            )}
            
            {onDelete && showDeleteConfirm && (
              <div className="ml-3 flex">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={sectionIndex > 0 ? 'mt-8' : ''}>
            {section.title && (
              <h4 className="text-base font-medium text-gray-900 mb-4">
                {section.title}
              </h4>
            )}
            
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {renderFieldValue(field)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailView;