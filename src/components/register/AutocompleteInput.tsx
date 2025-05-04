import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Plus, Loader2 } from "lucide-react";

// Define a more flexible base type - essentially any object
// This avoids implying an index signature needed by Record<string, unknown>
export type BaseOption = object; 

// Update the generic constraint to use BaseOption
interface AutocompleteInputProps<T extends BaseOption> { 
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: T | null) => void; // Allow selecting null if input cleared/no match
  onCreateNew?: (value: string) => void;
  options: T[];
  // Make these mandatory for proper generic handling
  getOptionLabel: (option: T) => string; 
  getOptionValue: (option: T) => string | number; // Value can be string or number
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  filterOptions?: (options: T[], query: string) => T[];
  renderOption?: (option: T) => React.ReactNode;
  formatSelected?: (option: T) => string;
  allowCreate?: boolean;
  createNewText?: string;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
  error?: string | null;
}

// Update the function signature constraint
function AutocompleteInput<T extends BaseOption>({
  id,
  name,
  value,
  onChange = (val: string) => { console.warn(`AutocompleteInput (${id}/${name}): Missing onChange handler`, val); },
  onSelect,
  onCreateNew,
  options,
  getOptionLabel,
  getOptionValue, // Remove default, must be provided
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  filterOptions,
  renderOption,
  formatSelected,
  allowCreate = false,
  createNewText = "Create",
  onFocus,
  isLoading = false,
  error = null,
}: AutocompleteInputProps<T>): React.ReactElement {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<T[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the main container

  // Sync input value if parent value changes
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setInputValue(value);
    }
  }, [value]);

  // Filter options based on input, handle loading state
  // Using useRef to avoid infinite loops but still access updated props
  const optionsRef = useRef(options);
  const isLoadingRef = useRef(isLoading);
  const allowCreateRef = useRef(allowCreate);
  const getOptionLabelRef = useRef(getOptionLabel);
  
  // Update refs when props change
  useEffect(() => {
    optionsRef.current = options;
    isLoadingRef.current = isLoading;
    allowCreateRef.current = allowCreate;
    getOptionLabelRef.current = getOptionLabel;
  }, [options, isLoading, allowCreate, getOptionLabel]);
  
  // Memoized filter function to avoid recomputing on every render
  const updateFilteredOptions = useCallback(() => {
    const currentOptions = optionsRef.current;
    const currentIsLoading = isLoadingRef.current;
    const currentAllowCreate = allowCreateRef.current;
    const currentGetOptionLabel = getOptionLabelRef.current;
    
    // If loading is finished, use the provided options directly.
    // If loading is ongoing OR input is empty, clear options.
    if (!currentIsLoading && inputValue.trim() !== "") {
      try {
        // Make a defensive copy of options first
        const validOptions = currentOptions.filter(opt => opt !== null && typeof opt === 'object');
        
        // Directly use the options passed from the parent 
        // as they should already be filtered by the backend search
        setFilteredOptions(validOptions.slice(0, 10)); // Apply limit
        
        // Safely check for exact match with proper null/undefined handling
        const exactMatch = validOptions.some(
          (option) => {
            try {
              const label = currentGetOptionLabel(option).toLowerCase();
              return label === inputValue.toLowerCase();
            } catch (err) {
              return false;
            }
          }
        );
        
        setShowCreateOption(
          currentAllowCreate && !exactMatch && inputValue.trim().length > 0,
        );
      } catch (err) {
        console.error('Error processing options in AutocompleteInput:', err);
        setFilteredOptions([]);
        setShowCreateOption(false);
      }
    } else { // Covers isLoading or empty inputValue
      setFilteredOptions([]);
      setShowCreateOption(false);
    }
    
    setHighlightedIndex(-1); // Reset highlight on options change
  }, [inputValue]); // Only depend on inputValue to avoid loops
  
  // Run the filter operation when inputValue changes
  useEffect(() => {
    updateFilteredOptions();
  }, [updateFilteredOptions, inputValue]);
  
  // Also update filtered options when options or loading state changes
  useEffect(() => {
    updateFilteredOptions();
  }, [options, isLoading]);

  // Handle outside click to close dropdown (Refined)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click is outside the entire component container
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Call onChange directly (it's guaranteed to be a function now)
    onChange(newValue); 
    
    // Explicitly ensure dropdown is shown after input change
    if (!showDropdown) {
        setShowDropdown(true); 
    }
    
    // If the text value becomes empty or doesn't match any option label, trigger onSelect with null
    if (newValue.trim() === '' || !options.some(opt => getOptionLabel(opt) === newValue)) {
       if (onSelect && typeof onSelect === 'function') {
          onSelect(null); 
       }
    }
  };

  const handleSelect = (option: T) => {
    const selectedValue = formatSelected
      ? formatSelected(option)
      : getOptionLabel(option);
    setInputValue(selectedValue);
    onChange(selectedValue); // Notify parent of final text value

    if (onSelect) {
      onSelect(option); // Notify parent of selected *object*
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

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < totalOptions - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (showCreateOption) {
        handleCreateNew();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!isLoading) {
        setShowDropdown(true);
    }
    if (onFocus) {
        onFocus(event);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    if(onSelect) {
      onSelect(null); // Notify selection cleared
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Determine input classes based on state
  const inputClasses = `
    w-full px-4 py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 
    ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:ring-primary/50'}
    ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        {inputValue && !isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="text-slate-400 hover:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Clear input"
            >
              <X className="h-5 w-5" />
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
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {(() => { // IIFE for logging
          const shouldShow = showDropdown && !isLoading && (filteredOptions.length > 0 || showCreateOption);
          // Remove detailed logging for dropdown visibility check
          // if (showDropdown) { 
          //   console.log(`[AutocompleteInput ${id}] Dropdown Check: ...`);
          // }
          return shouldShow && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <ul className="list-none p-0 m-0 w-full">
                  {filteredOptions.map((option, index) => {
                    const optionLabel = getOptionLabel(option);
                    const optionValue = getOptionValue(option);
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <li
                        key={String(optionValue)}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`px-4 py-2 cursor-pointer ${isHighlighted ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}
                      >
                        {renderOption ? renderOption(option) : optionLabel}
                      </li>
                    );
                  })}

                  {showCreateOption && (
                    <li
                      onClick={handleCreateNew}
                      onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                      className={`px-4 py-2 cursor-pointer flex items-center ${highlightedIndex === filteredOptions.length ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100'}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {createNewText} "{inputValue}"
                    </li>
                  )}
                </ul>
              </div>
          );
      })()}
      {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

export default AutocompleteInput;
