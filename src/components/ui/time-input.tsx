
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
    const [internalValue, setInternalValue] = useState(formatTimeValue(value));

    // Format time to always include the colon
    function formatTimeValue(val: string): string {
      // Remove any non-digit characters
      const digits = val.replace(/\D/g, "");
      
      // Handle empty case
      if (!digits.length) return "";
      
      // If we have 1 or 2 digits, it's just the hour portion
      if (digits.length <= 2) {
        return digits;
      }
      
      // Extract hours and minutes
      const hours = digits.substring(0, 2);
      const minutes = digits.substring(2, 4);
      
      return `${hours}:${minutes}`;
    }

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newInputValue = e.target.value;
      const curPos = e.target.selectionStart;
      
      // Store cursor position for restoration
      setCursorPosition(curPos);
      
      // Remove all non-digits first
      const digitsOnly = newInputValue.replace(/\D/g, "");
      
      // Format and limit to 4 digits (HHMM)
      const limitedDigits = digitsOnly.substring(0, 4);
      
      // Format the time with colon
      const formattedTime = formatTimeValue(limitedDigits);
      
      // Update internal state
      setInternalValue(formattedTime);
      
      // Call parent onChange with the raw HH:MM format
      if (formattedTime.includes(":")) {
        onChange(formattedTime);
      } else if (formattedTime.length >= 3) {
        const hours = formattedTime.substring(0, 2);
        const minutes = formattedTime.substring(2);
        onChange(`${hours}:${minutes}`);
      } else {
        onChange(formattedTime);
      }
    };

    // Handle special keys for better navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const input = inputRef.current;
      if (!input) return;
      
      const curPos = input.selectionStart || 0;
      
      // When user is at the colon position and presses right arrow, skip over the colon
      if (e.key === "ArrowRight" && curPos === 2 && internalValue.charAt(2) === ":") {
        e.preventDefault();
        input.setSelectionRange(3, 3);
      }
      
      // When user is right after the colon and presses left arrow, skip over the colon
      if (e.key === "ArrowLeft" && curPos === 3 && internalValue.charAt(2) === ":") {
        e.preventDefault();
        input.setSelectionRange(2, 2);
      }
      
      // Automatically add colon when typing the 3rd digit
      if (/^\d$/.test(e.key) && curPos === 2 && internalValue.length === 2) {
        e.preventDefault();
        const newValue = `${internalValue}:${e.key}`;
        setInternalValue(newValue);
        onChange(newValue);
        setTimeout(() => {
          input.setSelectionRange(4, 4);
        }, 0);
      }
    };

    // Position cursor correctly after re-render
    useEffect(() => {
      if (cursorPosition !== null && inputRef.current) {
        // Adjust cursor position if we've added a colon
        let adjustedPosition = cursorPosition;
        if (internalValue.includes(":") && cursorPosition > 2) {
          // If cursor was after where we added the colon, increment position
          adjustedPosition = Math.min(cursorPosition + 1, internalValue.length);
        }
        inputRef.current.setSelectionRange(adjustedPosition, adjustedPosition);
        setCursorPosition(null);
      }
    }, [internalValue, cursorPosition]);

    // Handle new values from parent
    useEffect(() => {
      const formattedExternalValue = formatTimeValue(value);
      if (formattedExternalValue !== internalValue) {
        setInternalValue(formattedExternalValue);
      }
    }, [value]);

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
        placeholder="HH:MM"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
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
