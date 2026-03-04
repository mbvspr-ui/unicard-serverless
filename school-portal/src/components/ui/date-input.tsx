import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [showCalendar, setShowCalendar] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const formatDateInput = (input: string): string => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    if (numbers.length === 0) return '';
    
    let formatted = '';
    
    // Day (01-31)
    if (numbers.length >= 1) {
      let day = numbers.substring(0, 2);
      const dayNum = parseInt(day);
      
      // Validate day
      if (dayNum > 31) {
        day = '31';
      } else if (numbers.length === 1 && dayNum > 3) {
        day = '0' + day;
      }
      
      formatted = day;
    }
    
    // Month (01-12)
    if (numbers.length >= 3) {
      formatted += '/';
      let month = numbers.substring(2, 4);
      const monthNum = parseInt(month);
      
      // Validate month
      if (monthNum > 12) {
        month = '12';
      } else if (numbers.length === 3 && monthNum > 1) {
        month = '0' + month;
      }
      
      formatted += month;
    }
    
    // Year (4 digits)
    if (numbers.length >= 5) {
      formatted += '/';
      const year = numbers.substring(4, 8);
      formatted += year;
    }
    
    return formatted;
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatDateInput(input);
    
    setDisplayValue(formatted);
    
    // Only update parent if we have a complete date
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      // Validate the date
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        onChange(formatted);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // YYYY-MM-DD
    if (isoDate) {
      const [year, month, day] = isoDate.split('-');
      const formatted = `${day}/${month}/${year}`;
      setDisplayValue(formatted);
      onChange(formatted);
    }
  };

  const convertToISODate = (ddmmyyyy: string): string => {
    if (!ddmmyyyy || ddmmyyyy.length !== 10) return '';
    const [day, month, year] = ddmmyyyy.split('/');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={displayValue}
          onChange={handleManualInput}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={cn(
            'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
            error ? 'border-red-500' : 'border-gray-300',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
        />
        
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker()}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          title="Open calendar"
        >
          <Calendar className="w-5 h-5 text-gray-500" />
        </button>
        
        <input
          ref={dateInputRef}
          type="date"
          onChange={handleCalendarChange}
          value={convertToISODate(displayValue)}
          disabled={disabled}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Type manually (DD/MM/YYYY) or click calendar icon
      </p>
    </div>
  );
};
