import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/solid';
import { ALL_TAGS, VALIDATION_TAGS } from '../../../../utils/hooks/useValidationQueue';

interface TagManagerProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  className?: string;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  useEffect(() => {
    if (inputValue.trim()) {
      const filteredSuggestions = ALL_TAGS.filter(
        tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !tags.includes(tag)
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, tags]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onAddTag(inputValue.trim());
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (tag: string) => {
    onAddTag(tag);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getTagColor = (tag: string) => {
    if (tag === 'verified') {
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 border-green-200 dark:border-green-700';
    } else if (VALIDATION_TAGS.includes(tag)) {
      return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200 border-red-200 dark:border-red-700';
    } else if (tag === 'premium-candidate' || tag === 'featured') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
    } else if (tag === 'spam-lead') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map(tag => (
            <div
              key={tag}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
            >
              {tag}
              <button
                onClick={() => onRemoveTag(tag)}
                className="ml-1.5 text-opacity-70 hover:text-opacity-100"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm italic">
            No tags added
          </div>
        )}
      </div>

      {/* Add Tag Input */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <TagIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Add tag..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleAddTag}
            disabled={!inputValue.trim()}
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
          >
            <ul className="py-1">
              {suggestions.map(suggestion => (
                <li key={suggestion}>
                  <button
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${getTagColor(suggestion)}`}
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManager;