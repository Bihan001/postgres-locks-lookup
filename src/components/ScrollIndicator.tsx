import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface ScrollIndicatorProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ children, className = '' }) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1; // 1px tolerance
      
      setShowIndicator(canScroll && !isAtEnd);
    }
  };

  useEffect(() => {
    checkScrollability();
    
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  const handleScroll = () => {
    checkScrollability();
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={scrollRef}
        className="overflow-x-auto"
        onScroll={handleScroll}
      >
        {children}
      </div>
      
      {showIndicator && (
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent"></div>
          
          {/* Scroll indicator */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col items-center justify-center h-16 opacity-60">
            <div className="w-0.5 h-8 bg-gray-400 mb-1"></div>
            <ChevronRight className="w-3 h-3 text-gray-500" />
            <div className="w-0.5 h-8 bg-gray-400 mt-1"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollIndicator;