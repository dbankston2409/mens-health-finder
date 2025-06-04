import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface EditFieldInlineProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  type?: 'text' | 'url' | 'tel' | 'email';
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const EditFieldInline: React.FC<EditFieldInlineProps> = ({
  value,
  onChange,
  label,
  type = 'text',
  placeholder = 'Enter value',
  disabled = false,
  className = ''}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update local value when prop changes
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    // Focus the input when editing starts
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(currentValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
          {label}
        </label>
      )}
      
      {isEditing ? (
        <div className="flex items-center">
          <input
            ref={inputRef}
            type={type}
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="block w-full py-1.5 px-2 bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
            autoComplete="off"
          />
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleSave}
              className="p-1 rounded-full bg-green-50 dark:bg-green-800 text-green-600 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-700"
              title="Save"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded-full bg-red-50 dark:bg-red-800 text-red-600 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-700"
              title="Cancel"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div 
            className={`py-1.5 px-2 text-gray-700 dark:text-gray-200 text-sm ${
              !value ? 'italic text-gray-400 dark:text-gray-500' : ''
            } min-h-[28px] border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-md transition-colors flex-grow`}
          >
            {value || placeholder}
          </div>
          {!disabled && (
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EditFieldInline;