import React from 'react';
import { X, Circle } from 'lucide-react';
import { getAllLockNames, hasConflict, data } from '../data';

interface LockMatrixProps {
  onLockClick?: (lockName: string) => void;
  highlightedLocks?: string[];
  showOnlyHighlighted?: boolean;
  showTableLocks?: boolean;
  showRowLocks?: boolean;
}

const LockMatrix: React.FC<LockMatrixProps> = ({ 
  onLockClick, 
  highlightedLocks = [], 
  showOnlyHighlighted = false,
  showTableLocks = true,
  showRowLocks = true
}) => {
  const allLocks = getAllLockNames();
  
  const isRowLock = (lockName: string): boolean => {
    return data.locks.find(lock => lock.name === lockName)?.type === 'row';
  };

  // Filter locks based on checkbox selections
  const filterLocks = (locks: string[]) => {
    return locks.filter(lock => {
      const isRow = isRowLock(lock);
      return isRow ? showRowLocks : showTableLocks;
    });
  };

  const filteredLocks = filterLocks(allLocks);
  const locksToShow = showOnlyHighlighted && highlightedLocks.length > 0 
    ? filterLocks(highlightedLocks)
    : filteredLocks;

  const handleLockClick = (lockName: string) => {
    if (onLockClick) {
      onLockClick(lockName);
    }
  };



  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
      <table className="w-full border-collapse matrix-table">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold min-w-[200px] matrix-row-header">
              Lock Type
            </th>
            {filteredLocks.map(lock => (
              <th 
                key={lock} 
                className="border border-gray-300 matrix-header"
                title={`Click to search for ${lock}`}
                onClick={() => handleLockClick(lock)}
              >
                {lock}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {locksToShow.map(rowLock => {
            const rowBgClass = highlightedLocks.includes(rowLock) ? 'bg-blue-50' : '';
            
            return (
              <tr key={rowLock} className={rowBgClass}>
                <td 
                  className="border border-gray-300 p-2 font-medium matrix-row-header"
                  onClick={() => handleLockClick(rowLock)}
                  title={`Click to search for ${rowLock}`}
                >
                  {rowLock}
                </td>
                {filteredLocks.map(colLock => {
                  const conflict = hasConflict(rowLock, colLock);
                  
                  return (
                    <td 
                      key={colLock} 
                      className="border border-gray-300 p-1 text-center align-middle matrix-cell"
                      title={`${rowLock} ${conflict ? 'conflicts with' : 'is compatible with'} ${colLock}`}
                    >
                      {conflict ? (
                        <X className="w-5 h-5 text-red-500 mx-auto" />
                      ) : (
                        <Circle className="w-2 h-2 text-green-500 mx-auto fill-current" />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LockMatrix;