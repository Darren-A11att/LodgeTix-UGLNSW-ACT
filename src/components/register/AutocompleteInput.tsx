import React, { useState, useEffect, useRef } from "react";
import { Search, X, Plus } from "lucide-react";

// Define a type for option objects
export type AutocompleteOption = Record<string, unknown>;

interface AutocompleteInputProps<T extends AutocompleteOption> {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: T) => void;
  onCreateNew?: (value: string) => void;
  options: T[];
  getOptionLabel: (option: T) => string;
  getOptionValue?: (option: T) => string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  filterOptions?: (options: T[], query: string) => T[];
  renderOption?: (option: T) => React.ReactNode;
  formatSelected?: (option: T) => string;
  allowCreate?: boolean;
  createNewText?: string;
}

function AutocompleteInput<T extends AutocompleteOption>({
  id,
  name,
  value,
  onChange,
  onSelect,
  onCreateNew,
  options,
  getOptionLabel,
  getOptionValue = (option) => getOptionLabel(option),
  placeholder = "",
  className = "",
  required = false,
  disabled = false,
  filterOptions,
  renderOption,
  formatSelected,
  allowCreate = false,
  createNewText = "Create",
}: AutocompleteInputProps<T>): React.ReactElement {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<T[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredOptions([]);
      setShowCreateOption(false);
      return;
    }

    let filtered;
    if (filterOptions) {
      filtered = filterOptions(options, inputValue);
    } else {
      filtered = options.filter(
        (option) =>
          getOptionLabel(option)
            .toLowerCase()
            .includes(inputValue.toLowerCase()) ||
          (option.abbreviation as string)?.toLowerCase().includes(inputValue.toLowerCase()),
      );
    }

    // Check if we should show create option
    const exactMatch = filtered.some(
      (option) =>
        getOptionLabel(option).toLowerCase() === inputValue.toLowerCase(),
    );

    setShowCreateOption(
      allowCreate && !exactMatch && inputValue.trim().length > 0,
    );
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = (option: T) => {
    const selectedValue = formatSelected
      ? formatSelected(option)
      : getOptionLabel(option);
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

  const handleClear = () => {
    setInputValue("");
    onChange("");
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
              aria-label="Clear input"
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
          className={`w-full pl-10 ${inputValue ? "pr-10" : "pr-4"} py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      {/* Custom dropdown for better UI control */}
      {showDropdown && (filteredOptions.length > 0 || showCreateOption) && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-slate-200"
        >
          <ul className="list-none p-0 m-0 w-full">
            {filteredOptions.map((option, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={getOptionValue(option)}
                  onClick={() => handleSelect(option)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelect(option);
                    }
                  }}
                  tabIndex={0}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                    isHighlighted
                      ? "bg-primary/10 text-primary"
                      : "text-slate-900"
                  } hover:bg-primary/10 hover:text-primary`}
                >
                  {renderOption ? renderOption(option) : (
                    <div>
                      <div className="font-medium">{getOptionLabel(option)}</div>
                      {typeof option.country === 'string' && (
                        <div className="text-xs text-slate-500">
                          {option.country}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}

            {/* Create New Option */}
            {showCreateOption && (
              <li
                onClick={handleCreateNew}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCreateNew();
                  }
                }}
                tabIndex={0}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-green-800 hover:bg-green-100 flex items-center border-t border-slate-100"
              >
                <Plus className="h-4 w-4 mr-2 text-green-600" />
                <div className="font-medium">
                  {createNewText} "{inputValue}"
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default AutocompleteInput;
