import React from 'react';
import { ChevronDown, ChevronRight, Database, Lock } from 'lucide-react';
import { Command, Lock as LockType } from '../types';
import { generateCommandDescription, generateLockDescription } from '../data';

interface AccordionCardProps {
  item: Command | LockType;
  isExpanded: boolean;
  onToggle: () => void;
}

const isCommand = (item: Command | LockType): item is Command => {
  return 'locks' in item;
};

const AccordionCard: React.FC<AccordionCardProps> = ({ 
  item, 
  isExpanded, 
  onToggle
}) => {
  const itemIsCommand = isCommand(item);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {itemIsCommand ? (
              <Database className="w-5 h-5 text-blue-600" />
            ) : (
              <Lock className="w-5 h-5 text-green-600" />
            )}
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              {itemIsCommand && item.locks.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.locks.map(lock => (
                    <span 
                      key={lock}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {lock}
                    </span>
                  ))}
                </div>
              )}
              {!itemIsCommand && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {(item as LockType).type} lock
                </span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {item.description && (
          <p className="text-gray-600 text-sm mt-2 ml-8">{item.description}</p>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="prose prose-sm max-w-none">
            {itemIsCommand ? (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: generateCommandDescription(item.name)?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || 'No description available.' 
                }}
              />
            ) : (
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: generateLockDescription(item.name)?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || 'No description available.' 
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccordionCard;