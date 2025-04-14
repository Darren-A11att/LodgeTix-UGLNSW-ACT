import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus } from 'lucide-react';

interface AutocompleteInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: any) => void;
  onCreateNew?: (value: string) => void;
  options: any[];
  getOptionLabel: (option: any) => string;
  getOptionValue?: (option: any) => string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  filterOptions?: (options: any[], query: string) => any[];
  renderOption?: (option: any) => React.ReactNode;
  formatSelected?: (option: any) => string;
  allowCreate?: boolean;
  createNewText?: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  onSelect,
  onCreateNew,
  options,
  getOptionLabel,
  getOptionValue = (option) => getOptionLabel(option),
  placeholder = '',
  className = '',
  required = false,
  disabled = false,
  filterOptions,
  renderOption,
  formatSelected,
  allowCreate = false,
  createNewText = "Create"
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<any[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredOptions([]);
      setShowCreateOption(false);
      return;
    }

    let filtered;
    if (filterOptions) {
      filtered = filterOptions(options, inputValue);
    } else {
      filtered = options.filter(option => 
        getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.abbreviation && option.abbreviation.toLowerCase().includes(inputValue.toLowerCase()))
      );
    }

    // Check if we should show create option
    const exactMatch = filtered.some(option => 
      getOptionLabel(option).toLowerCase() === inputValue.toLowerCase()
    );
    
    setShowCreateOption(allowCreate && !exactMatch && inputValue.trim().length > 0);
    setFilteredOptions(filtered.slice(0, 10)); // Limit to 10 options for performance
    setHighlightedIndex(-1);
  }, [inputValue, options, filterOptions, getOptionLabel, allowCreate]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = (option: any) => {
    const selectedValue = formatSelected ? formatSelected(option) : getOptionLabel(option);
    setInputValue(selectedValue);
    onChange(selectedValue);
    
    if (onSelect) {
      onSelect(option);
    }
    
    setShowDropdown(false);
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew(inputValue);
    }
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard navigation
    const totalOptions = filteredOptions.length + (showCreateOption ? 1 : 0);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < totalOptions - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCreateOption) {
        handleCreateNew();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        {inputValue && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 ${inputValue ? 'pr-10' : 'pr-4'} py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      
      {showDropdown && (filteredOptions.length > 0 || showCreateOption) && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-slate-200"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={getOptionValue(option)}
              onClick={() => handleSelect(option)}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                index === highlightedIndex ? 'bg-primary/10 text-primary' : 'text-slate-900'
              } hover:bg-primary/10 hover:text-primary`}
            >
              {renderOption ? renderOption(option) : (
                <div>
                  <div className="font-medium">{getOptionLabel(option)}</div>
                  {option.country && (
                    <div className="text-xs text-slate-500">{option.country}</div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Create New Option */}
          {showCreateOption && (
            <div
              onClick={handleCreateNew}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                highlightedIndex === filteredOptions.length ? 'bg-green-100 text-green-800' : 'text-green-800'
              } hover:bg-green-100 flex items-center border-t border-slate-100`}
            >
              <Plus className="h-4 w-4 mr-2 text-green-600" />
              <div className="font-medium">
                {createNewText} "{inputValue}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;