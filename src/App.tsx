import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import LockMatrix from './components/LockMatrix';
import SearchBar from './components/SearchBar';
import AccordionCard from './components/AccordionCard';
import LockInfoDisplay from './components/LockInfoDisplay';
import { searchItems, generateLockDescription } from './data';
import { Command, Lock } from './types';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Command | Lock)[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [autoExpandFromClick, setAutoExpandFromClick] = useState(false);
  const [showTableLocks, setShowTableLocks] = useState(true);
  const [showRowLocks, setShowRowLocks] = useState(true);
  const [selectedLock, setSelectedLock] = useState<string | null>(null);
  const [lockDescription, setLockDescription] = useState<string | null>(null);

  // Update search results when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchItems(searchQuery);
      setSearchResults(results);
      
      // Only auto-expand if the search was triggered by clicking a matrix name
      if (autoExpandFromClick) {
        const allIds = new Set(results.map(item => item.name));
        setExpandedCards(allIds);
        setAutoExpandFromClick(false); // Reset the flag
      } else {
        // For manual search, keep accordions closed by default
        setExpandedCards(new Set());
      }
    } else {
      setSearchResults([]);
      setExpandedCards(new Set());
    }
  }, [searchQuery, autoExpandFromClick]);

  const handleLockClick = (lockName: string) => {
    setAutoExpandFromClick(true);
    setSearchQuery(lockName);
    setSelectedLock(lockName);
    const description = generateLockDescription(lockName);
    setLockDescription(description);
  };

  const handleManualSearch = (query: string) => {
    setAutoExpandFromClick(false);
    setSearchQuery(query);
    // Don't show lock info for manual searches
    setSelectedLock(null);
    setLockDescription(null);
  };

  const handleCloseLockInfo = () => {
    setSelectedLock(null);
    setLockDescription(null);
  };

  const toggleCard = (itemName: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedCards(newExpanded);
  };

  // Filter items based on checkbox selections
  const filterItems = (items: (Command | Lock)[]) => {
    return items.filter(item => {
      if ('locks' in item) {
        // This is a command - always show if either lock type is enabled
        return showTableLocks || showRowLocks;
      } else {
        // This is a lock - filter by type
        const lock = item as Lock;
        if (lock.type === 'table') {
          return showTableLocks;
        } else {
          return showRowLocks;
        }
      }
    });
  };

  // Get all items when no search query, filtered by checkboxes
  const allItems = searchQuery.trim() 
    ? filterItems(searchResults) 
    : filterItems(searchItems('', true, true));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-3 mb-4">
            <Database className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">PostgreSQL Locks Lookup</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Explore PostgreSQL lock types, command relationships, and conflict matrices
          </p>
        </div>

        {/* Main Lock Conflict Matrix */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lock Conflict Matrix</h2>
          <p className="text-gray-600 mb-4">
            Red X indicates conflicts, green circles indicate compatibility. Click lock names to search.
          </p>
          <LockMatrix 
            onLockClick={handleLockClick} 
            showTableLocks={showTableLocks}
            showRowLocks={showRowLocks}
          />
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Search Commands & Locks</h2>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTableLocks}
                  onChange={(e) => setShowTableLocks(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 font-medium">Table Locks</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRowLocks}
                  onChange={(e) => setShowRowLocks(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-gray-700 font-medium">Row Locks</span>
              </label>
            </div>
          </div>
          <SearchBar 
            value={searchQuery} 
            onChange={handleManualSearch}
            placeholder="Search for commands or locks (e.g., 'SELECT', 'ACCESS EXCLUSIVE', 'vacuum')..."
          />
        </div>

        {/* Results Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery.trim() ? `Search Results (${allItems.length})` : 'All Commands & Locks'}
            </h2>
          </div>
          
          {/* Lock Information Display */}
          <LockInfoDisplay 
            lockName={selectedLock}
            description={lockDescription}
            onClose={handleCloseLockInfo}
          />
          
          {allItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No results found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allItems.map((item) => (
                <AccordionCard
                  key={item.name}
                  item={item}
                  isExpanded={expandedCards.has(item.name)}
                  onToggle={() => toggleCard(item.name)}
                  onLockClick={handleLockClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
          <p>PostgreSQL Locks Reference - Built with React & TypeScript</p>
        </div>
      </div>
    </div>
  );
}

export default App;