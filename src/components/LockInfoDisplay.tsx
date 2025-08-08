import React from 'react';
import { Info, X } from 'lucide-react';

interface LockInfoDisplayProps {
  lockName: string | null;
  description: string | null;
  onClose: () => void;
}

const LockInfoDisplay: React.FC<LockInfoDisplayProps> = ({ 
  lockName, 
  description, 
  onClose 
}) => {
  if (!lockName || !description) return null;

  // Parse markdown-style bold text for rendering
  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <span key={index} className="font-semibold text-blue-700">
            {content}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              Lock Information: {lockName}
            </h3>
            <p className="text-blue-800 leading-relaxed">
              {renderDescription(description)}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-3 p-1 hover:bg-blue-100 rounded-full transition-colors flex-shrink-0"
          title="Close lock information"
        >
          <X className="w-4 h-4 text-blue-600" />
        </button>
      </div>
    </div>
  );
};

export default LockInfoDisplay;