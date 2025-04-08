
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (time: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  error?: boolean;
}

/**
 * Enhanced time input component that automatically formats HH:MM
 * and provides a better user experience for time entry
 */
const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, onBlur, className, error, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    // Initialize with colon format for better UX
    const [internalValue, setInternalValue] = useState(() => {
      // If we have a value, format it properly
      if (value) {
        return formatTimeDisplay(value);
      }
      // Start with a placeholder template that shows the colon
      return "__:__";
    });
    
    // Format time for display with placeholder underscores and colon
    function formatTimeDisplay(val: string): string {
      // Remove any non-digit characters
      const digits = val.replace(/\D/g, "").substring(0, 4);
      
      if (!digits.length) return "__:__";
      
      // Format with placeholders
      let result = "__:__".split('');
      
      // Fill in digits from left to right
      for (let i = 0; i < digits.length; i++) {
        if (i < 2) {
          result[i] = digits[i];
        } else if (i >= 2) {
          result[i + 1] = digits[i];
        }
      }
      
      return result.join('');
    }
    
    // Convert displayed value to actual value for the form
    function displayValueToActual(displayValue: string): string {
      // Extract digits
      const digits = displayValue.replace(/[^0-9]/g, "");
      
      if (digits.length <= 2) {
        return digits;
      }
      
      // Format as HH:MM
      const hours = digits.substring(0, 2);
      const minutes = digits.substring(2, 4);
      return `${hours}:${minutes}`;
    }
    
    // Replace underscore placeholders with actual digits
    function replaceAtPosition(value: string, position: number, char: string): string {
      const chars = value.split('');
      if (position === 2) position = 3; // Skip the colon
      chars[position] = char;
      return chars.join('');
    }

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const curPos = e.target.selectionStart || 0;
      const key = e.target.value.charAt(curPos - 1);
      
      // If user typed a digit
      if (/^\d$/.test(key)) {
        let newValue = internalValue;
        
        // Find where to place the digit (skipping the colon)
        let insertPos = curPos - 1;
        if (internalValue[insertPos] === ':') insertPos++;
        
        // If we're typing from left to right, find the next placeholder
        if (internalValue[insertPos] !== '_') {
          insertPos = internalValue.indexOf('_');
          if (insertPos === -1) insertPos = 0; // No placeholders left
        }
        
        // Replace at the correct position
        newValue = replaceAtPosition(newValue, insertPos, key);
        
        // Update internal state
        setInternalValue(newValue);
        
        // Calculate where cursor should go next
        let nextPos = insertPos + 1;
        if (nextPos === 2) nextPos = 3; // Skip colon
        setCursorPosition(nextPos);
        
        // Call parent onChange with the properly formatted time
        const actualValue = displayValueToActual(newValue);
        onChange(actualValue);
      } else if (e.target.value.length < internalValue.length) {
        // Handle deletion/backspace
        const deletePos = curPos;
        let newValue = internalValue;
        
        if (deletePos < newValue.length && newValue[deletePos] !== ':') {
          newValue = replaceAtPosition(newValue, deletePos, '_');
        } else if (deletePos > 0 && newValue[deletePos - 1] !== ':') {
          newValue = replaceAtPosition(newValue, deletePos - 1, '_');
        }
        
        setInternalValue(newValue);
        setCursorPosition(deletePos);
        
        // Call parent onChange
        const actualValue = displayValueToActual(newValue);
        onChange(actualValue);
      }
    };

    // Handle special keys for better navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input) return;
      
      const curPos = input.selectionStart || 0;
      
      // Skip over the colon when pressing arrow keys
      if (e.key === "ArrowRight" && curPos === 2 && internalValue.charAt(2) === ":") {
        e.preventDefault();
        input.setSelectionRange(3, 3);
      } else if (e.key === "ArrowLeft" && curPos === 3 && internalValue.charAt(2) === ":") {
        e.preventDefault();
        input.setSelectionRange(2, 2);
      } else if (e.key === "Backspace") {
        if (curPos > 0 && curPos < internalValue.length) {
          if (internalValue[curPos - 1] === ':') {
            e.preventDefault();
            input.setSelectionRange(curPos - 1, curPos - 1);
          } else if (internalValue[curPos - 1] !== '_') {
            e.preventDefault();
            const newValue = replaceAtPosition(internalValue, curPos - 1, '_');
            setInternalValue(newValue);
            setCursorPosition(curPos - 1);
            
            const actualValue = displayValueToActual(newValue);
            onChange(actualValue);
          }
        }
      } else if (e.key === "Delete") {
        if (curPos < internalValue.length) {
          if (internalValue[curPos] === ':') {
            e.preventDefault();
            input.setSelectionRange(curPos + 1, curPos + 1);
          } else if (internalValue[curPos] !== '_') {
            e.preventDefault();
            const newValue = replaceAtPosition(internalValue, curPos, '_');
            setInternalValue(newValue);
            setCursorPosition(curPos);
            
            const actualValue = displayValueToActual(newValue);
            onChange(actualValue);
          }
        }
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        
        let insertPos = curPos;
        if (internalValue[insertPos] === ':') insertPos++;
        
        // If we're at a position that already has a digit, move to the next placeholder
        if (internalValue[insertPos] !== '_') {
          insertPos = internalValue.indexOf('_');
          if (insertPos === -1) {
            // No placeholders left, replace at current position
            insertPos = curPos;
            if (insertPos >= 2) insertPos++; // Skip colon
          }
        }
        
        const newValue = replaceAtPosition(internalValue, insertPos, e.key);
        setInternalValue(newValue);
        
        // Move cursor to next position
        let nextPos = insertPos + 1;
        if (nextPos === 2) nextPos = 3; // Skip colon
        setCursorPosition(nextPos);
        
        const actualValue = displayValueToActual(newValue);
        onChange(actualValue);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (internalValue === "__:__") {
        setCursorPosition(0);
      }
    };

    // Handle external value changes
    useEffect(() => {
      if (value !== displayValueToActual(internalValue)) {
        setInternalValue(formatTimeDisplay(value));
      }
    }, [value]);

    // Position cursor after state update
    useEffect(() => {
      if (cursorPosition !== null && inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        setCursorPosition(null);
      }
    }, [internalValue, cursorPosition]);

    return (
      <Input
        ref={(node) => {
          // Handle both the forwarded ref and our internal ref
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          inputRef.current = node;
        }}
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={onBlur}
        className={cn(
          "input-time",
          error && "border-red-500 focus-visible:ring-red-500",
          className
        )}
        {...props}
      />
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };
