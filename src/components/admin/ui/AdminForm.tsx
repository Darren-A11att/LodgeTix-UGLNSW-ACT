import * as React from 'react';
import { useNavigate } from 'react-router-dom';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'datetime-local' | 'checkbox' | 'radio' | 'file' | 'hidden';
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  readOnly?: boolean;
  options?: Array<{ label: string; value: any }>;
  rows?: number;
  cols?: number;
}

interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
}

interface AdminFormProps {
  title: string;
  description?: string;
  sections: FormSection[];
  initialValues?: Record<string, any>;
  isLoading?: boolean;
  error?: string;
  submitButtonText?: string;
  cancelButtonText?: string;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  backTo?: string;
}

const AdminForm: React.FC<AdminFormProps> = ({
  title,
  description,
  sections,
  initialValues = {},
  isLoading = false,
  error,
  submitButtonText = 'Save',
  cancelButtonText = 'Cancel',
  onSubmit,
  onCancel,
  backTo
}) => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = React.useState<Record<string, any>>(initialValues);
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  
  // Update form values when initialValues change
  React.useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);
  
  const handleChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    setHasChanges(true);
    
    // Clear error for this field if it exists
    if (formErrors[fieldId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    // Flatten all fields from all sections
    const allFields = sections.flatMap(section => section.fields);
    
    allFields.forEach(field => {
      if (field.required && !formValues[field.id]) {
        errors[field.id] = `${field.label} is required`;
        isValid = false;
      }
    });
    
    setFormErrors(errors);
    return isValid;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formValues);
      setHasChanges(false);
    } catch (err) {
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backTo) {
      navigate(backTo);
    }
  };
  
  const renderField = (field: FormField) => {
    const fieldValue = formValues[field.id] ?? field.defaultValue ?? '';
    const fieldError = formErrors[field.id] || field.error;
    
    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'datetime-local':
        return (
          <input
            id={field.id}
            name={field.id}
            type={field.type}
            value={fieldValue}
            onChange={e => handleChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className={`mt-1 block w-full border ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || isLoading || isSubmitting}
            readOnly={field.readOnly}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            id={field.id}
            name={field.id}
            value={fieldValue}
            onChange={e => handleChange(field.id, e.target.value)}
            rows={field.rows || 3}
            className={`mt-1 block w-full border ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || isLoading || isSubmitting}
            readOnly={field.readOnly}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.id}
            name={field.id}
            value={fieldValue}
            onChange={e => handleChange(field.id, e.target.value)}
            className={`mt-1 block w-full border ${
              fieldError ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
            required={field.required}
            disabled={field.disabled || isLoading || isSubmitting}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="mt-1 flex items-center">
            <input
              id={field.id}
              name={field.id}
              type="checkbox"
              checked={!!fieldValue}
              onChange={e => handleChange(field.id, e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              disabled={field.disabled || isLoading || isSubmitting}
            />
            <span className="ml-2 text-gray-700">
              {field.placeholder || field.label}
            </span>
          </div>
        );
      
      case 'radio':
        return (
          <div className="mt-1">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center mb-2">
                <input
                  id={`${field.id}-${option.value}`}
                  name={field.id}
                  type="radio"
                  value={option.value}
                  checked={fieldValue === option.value}
                  onChange={() => handleChange(field.id, option.value)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  disabled={field.disabled || isLoading || isSubmitting}
                />
                <label
                  htmlFor={`${field.id}-${option.value}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <input
            id={field.id}
            name={field.id}
            type="file"
            onChange={e => handleChange(field.id, e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            required={field.required}
            disabled={field.disabled || isLoading || isSubmitting}
          />
        );
      
      case 'hidden':
        return (
          <input
            id={field.id}
            name={field.id}
            type="hidden"
            value={fieldValue}
          />
        );
      
      default:
        return null;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 space-y-6">
            {sections.map((section, index) => (
              <div key={index}>
                {section.title && (
                  <div className="border-b border-gray-200 pb-3 mb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {section.description}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="space-y-6">
                  {section.fields.map(field => (
                    <div key={field.id}>
                      {field.type !== 'hidden' && field.type !== 'checkbox' && (
                        <label
                          htmlFor={field.id}
                          className="block text-sm font-medium text-gray-700"
                        >
                          {field.label}
                          {field.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                      )}
                      
                      {renderField(field)}
                      
                      {(field.helperText || formErrors[field.id] || field.error) && (
                        <p
                          className={`mt-2 text-sm ${
                            formErrors[field.id] || field.error
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {formErrors[field.id] || field.error || field.helperText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            type="button"
            onClick={handleCancel}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading || isSubmitting}
          >
            {cancelButtonText}
          </button>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={!hasChanges || isLoading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Saving...
              </>
            ) : (
              submitButtonText
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AdminForm;