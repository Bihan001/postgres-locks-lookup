import React, { useState } from 'react';
import { X, Circle } from 'lucide-react';
import { getAllLockNames, hasConflict, data, getAllCommandNames, commandsCanRunTogether } from '../data';

interface LockMatrixProps {
  onLockClick?: (lockName: string) => void;
  onCommandClick?: (commandName: string) => void;
  highlightedLocks?: string[];
  highlightedCommands?: string[];
  showOnlyHighlighted?: boolean;
  showTableLocks?: boolean;
  showRowLocks?: boolean;
  matrixType?: 'locks' | 'commands';
  selectedRow?: string | null;
  selectedColumn?: string | null;
  onRowColumnSelect?: (rowName: string | null, columnName: string | null) => void;
}

const LockMatrix: React.FC<LockMatrixProps> = ({ 
  onLockClick, 
  onCommandClick,
  highlightedLocks = [], 
  highlightedCommands = [],
  showOnlyHighlighted = false,
  showTableLocks = true,
  showRowLocks = true,
  matrixType = 'locks',
  selectedRow = null,
  selectedColumn = null,
  onRowColumnSelect
}) => {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  
  const allLocks = getAllLockNames();
  const allCommands = getAllCommandNames();
  
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

  const getItemsToShow = () => {
    if (matrixType === 'commands') {
      return showOnlyHighlighted && highlightedCommands.length > 0 
        ? highlightedCommands
        : allCommands;
    } else {
      const filteredLocks = filterLocks(allLocks);
      return showOnlyHighlighted && highlightedLocks.length > 0 
        ? filterLocks(highlightedLocks)
        : filteredLocks;
    }
  };

  const getAllItems = () => {
    return matrixType === 'commands' ? allCommands : filterLocks(allLocks);
  };

  const itemsToShow = getItemsToShow();
  const allItems = getAllItems();

  const handleItemClick = (itemName: string) => {
    if (matrixType === 'commands' && onCommandClick) {
      onCommandClick(itemName);
    } else if (matrixType === 'locks' && onLockClick) {
      onLockClick(itemName);
    }
  };

  const handleHeaderClick = (itemName: string, isRow: boolean) => {
    if (onRowColumnSelect) {
      if (isRow) {
        // Clicking a row header
        const newSelectedRow = selectedRow === itemName ? null : itemName;
        onRowColumnSelect(newSelectedRow, selectedColumn);
      } else {
        // Clicking a column header
        const newSelectedColumn = selectedColumn === itemName ? null : itemName;
        onRowColumnSelect(selectedRow, newSelectedColumn);
      }
    }
    handleItemClick(itemName);
  };

  const hasItemConflict = (item1: string, item2: string): boolean => {
    if (matrixType === 'commands') {
      return !commandsCanRunTogether(item1, item2);
    } else {
      return hasConflict(item1, item2);
    }
  };

  const getHighlightedItems = () => {
    return matrixType === 'commands' ? highlightedCommands : highlightedLocks;
  };



  return (
    <div className="bg-white rounded-lg shadow-lg">
      <table className="w-full border-collapse matrix-table">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2 text-left font-semibold min-w-[200px] matrix-row-header bg-gray-50">
              {matrixType === 'commands' ? 'Command' : 'Lock Type'}
            </th>
            {allItems.map(item => {
              const isSelected = selectedColumn === item;
              const isHovered = hoveredColumn === item;
              
              let headerClasses = 'border border-gray-300 matrix-header cursor-pointer transition-colors duration-150';
              
              if (isSelected) {
                headerClasses += ' bg-blue-200 text-blue-800';
              } else if (isHovered) {
                headerClasses += ' bg-blue-100';
              } else {
                headerClasses += ' bg-gray-50 hover:bg-blue-100';
              }
              
              return (
                <th 
                  key={item} 
                  className={headerClasses}
                  title={`Click to search for ${item}`}
                  onClick={() => handleHeaderClick(item, false)}
                  onMouseEnter={() => setHoveredColumn(item)}
                  onMouseLeave={() => setHoveredColumn(null)}
                >
                  {item}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {itemsToShow.map(rowItem => {
            const highlightedItems = getHighlightedItems();
            const isRowSelected = selectedRow === rowItem;
            const isRowHovered = hoveredRow === rowItem;
            const rowBgClass = highlightedItems.includes(rowItem) ? 'bg-blue-50' : '';
            
            return (
              <tr 
                key={rowItem} 
                className={`${rowBgClass} transition-colors duration-150`}
                onMouseEnter={() => setHoveredRow(rowItem)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <td 
                  className={`
                    border border-gray-300 p-2 font-medium matrix-row-header cursor-pointer transition-colors duration-150
                    ${isRowSelected 
                      ? 'bg-blue-200 text-blue-800' 
                      : isRowHovered
                      ? 'bg-blue-100'
                      : 'bg-gray-50 hover:bg-blue-100'
                    }
                  `.trim()}
                  onClick={() => handleHeaderClick(rowItem, true)}
                  title={`Click to search for ${rowItem}`}
                >
                  {rowItem}
                </td>
                {allItems.map(colItem => {
                  const conflict = hasItemConflict(rowItem, colItem);
                  const conflictText = matrixType === 'commands' 
                    ? (conflict ? 'cannot run together' : 'can run together')
                    : (conflict ? 'conflicts with' : 'is compatible with');
                  
                  const isInSelectedRow = selectedRow === rowItem;
                  const isInSelectedColumn = selectedColumn === colItem;
                  const isInHoveredRow = hoveredRow === rowItem;
                  const isInHoveredColumn = hoveredColumn === colItem;
                  const isIntersection = isInSelectedRow && isInSelectedColumn;
                  const isHoveredIntersection = isInHoveredRow && isInHoveredColumn;
                  
                  let cellClasses = 'border border-gray-300 p-1 text-center align-middle matrix-cell transition-colors duration-150';
                  
                  if (isIntersection) {
                    cellClasses += ' bg-blue-300';
                  } else if (isHoveredIntersection) {
                    cellClasses += ' bg-blue-200';
                  } else if (isInSelectedRow || isInSelectedColumn) {
                    cellClasses += ' bg-blue-100';
                  } else if (isInHoveredRow || isInHoveredColumn) {
                    cellClasses += ' bg-gray-100';
                  } else {
                    cellClasses += ' bg-white hover:bg-gray-50';
                  }
                  
                  return (
                    <td 
                      key={colItem} 
                      className={cellClasses}
                      title={`${rowItem} ${conflictText} ${colItem}`}
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