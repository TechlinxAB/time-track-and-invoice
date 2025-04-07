
import { useState, useEffect } from "react";

// Custom hook to detect and log slow renders
export const usePerformanceMonitor = (componentName: string, threshold = 16) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > threshold) {
        console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName, threshold]);
};

// Debounce function to limit how often a function can be called
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};
