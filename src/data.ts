import { DataStructure, Lock, Command } from './types';

// Import data directly as JS objects
const locksData = {
  "tableLocks": [
    "ACCESS SHARE",
    "ROW SHARE",
    "ROW EXCLUSIVE",
    "SHARE UPDATE EXCLUSIVE",
    "SHARE",
    "SHARE ROW EXCLUSIVE",
    "EXCLUSIVE",
    "ACCESS EXCLUSIVE"
  ],
  "rowLocks": [
    "FOR KEY SHARE",
    "FOR SHARE",
    "FOR NO KEY UPDATE",
    "FOR UPDATE"
  ],
  "descriptions": {
    "ACCESS SHARE": "Read-only table lock acquired by SELECT and COPY TO; only conflicts with ACCESS EXCLUSIVE.",
    "ROW SHARE": "Table lock for SELECT ... FOR * variants; allows reads but conflicts with EXCLUSIVE and ACCESS EXCLUSIVE.",
    "ROW EXCLUSIVE": "Table lock acquired by DML (INSERT/UPDATE/DELETE/MERGE/COPY FROM); conflicts with SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE.",
    "SHARE UPDATE EXCLUSIVE": "Allows reads and writes but blocks schema changes and VACUUM FULL; conflicts with itself and stronger locks.",
    "SHARE": "Acquired by CREATE INDEX; blocks concurrent data modifications but not itself.",
    "SHARE ROW EXCLUSIVE": "Blocks writes; allows SELECT FORs; conflicts with itself and stronger locks.",
    "EXCLUSIVE": "Similar to ACCESS EXCLUSIVE but allows ACCESS SHARE readers (e.g., REFRESH MATERIALIZED VIEW CONCURRENTLY).",
    "ACCESS EXCLUSIVE": "Strongest table lock; conflicts with all other table locks. Acquired by operations like VACUUM FULL, TRUNCATE, many ALTERs.",
    "FOR KEY SHARE": "Row lock: weakest; allows updates to non-unique columns; conflicts with FOR UPDATE.",
    "FOR SHARE": "Row lock: shared; prevents DML on the row; conflicts with NO KEY UPDATE and UPDATE.",
    "FOR NO KEY UPDATE": "Row lock acquired by UPDATE on non-unique columns; weaker than FOR UPDATE.",
    "FOR UPDATE": "Row lock: strongest; prevents UPDATE/DELETE/SELECT FOR UPDATE by other transactions."
  }
} as const;

const commandsData = {
  "SELECT": { "name": "SELECT", "description": "Read data; acquires ACCESS SHARE table lock.", "locks": ["ACCESS SHARE"] },
  "COPY TO": { "name": "COPY TO", "description": "", "locks": ["ACCESS SHARE"] },
  "SELECT FOR UPDATE": { "name": "SELECT FOR UPDATE", "description": "Locks selected rows to prevent concurrent modifications; also takes ROW SHARE table lock.", "locks": ["ROW SHARE"] },
  "SELECT FOR NO KEY SHARE": { "name": "SELECT FOR NO KEY SHARE", "description": "", "locks": ["ROW SHARE"] },
  "SELECT FOR SHARE": { "name": "SELECT FOR SHARE", "description": "", "locks": ["ROW SHARE"] },
  "SELECT FOR KEY SHARE": { "name": "SELECT FOR KEY SHARE", "description": "", "locks": ["ROW SHARE"] },
  "UPDATE": { "name": "UPDATE", "description": "Modify rows; takes ROW EXCLUSIVE table lock and row locks.", "locks": ["ROW EXCLUSIVE"] },
  "DELETE": { "name": "DELETE", "description": "Remove rows; takes ROW EXCLUSIVE table lock and row locks.", "locks": ["ROW EXCLUSIVE"] },
  "INSERT": { "name": "INSERT", "description": "Insert rows; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "MERGE": { "name": "MERGE", "description": "", "locks": ["ROW EXCLUSIVE"] },
  "COPY FROM": { "name": "COPY FROM", "description": "", "locks": ["ROW EXCLUSIVE"] },
  "CREATE INDEX": { "name": "CREATE INDEX", "description": "Build index blocking writes; SHARE lock.", "locks": ["SHARE"] },
  "VACUUM": { "name": "VACUUM", "description": "Maintains storage; allows reads and writes; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "REINDEX CONCURRENTLY": { "name": "REINDEX CONCURRENTLY", "description": "Rebuild indexes with minimal blocking; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE STATISTICS": { "name": "CREATE STATISTICS", "description": "", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE INDEX CONCURRENTLY": { "name": "CREATE INDEX CONCURRENTLY", "description": "Build index allowing writes; SHARE UPDATE EXCLUSIVE on phases.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "COMMENT ON": { "name": "COMMENT ON", "description": "", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ANALYZE": { "name": "ANALYZE", "description": "", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE TRIGGER": { "name": "CREATE TRIGGER", "description": "", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ADD FOREIGN KEY": { "name": "ALTER TABLE ADD FOREIGN KEY", "description": "", "locks": ["SHARE ROW EXCLUSIVE"] },
  "REFRESH MATERIALIZED VIEW CONCURRENTLY": { "name": "REFRESH MATERIALIZED VIEW CONCURRENTLY", "description": "Concurrent refresh; EXCLUSIVE.", "locks": ["EXCLUSIVE"] },
  "DROP TABLE": { "name": "DROP TABLE", "description": "", "locks": ["ACCESS EXCLUSIVE"] },
  "TRUNCATE": { "name": "TRUNCATE", "description": "Remove all rows; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "REINDEX": { "name": "REINDEX", "description": "Rebuild indexes; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "CLUSTER": { "name": "CLUSTER", "description": "", "locks": ["ACCESS EXCLUSIVE"] },
  "VACUUM FULL": { "name": "VACUUM FULL", "description": "Rewrites table to compact storage; requires ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "REFRESH MATERIALIZED VIEW": { "name": "REFRESH MATERIALIZED VIEW", "description": "Refreshes view; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ADD COLUMN": { "name": "ALTER TABLE ADD COLUMN", "description": "", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DROP COLUMN": { "name": "ALTER TABLE DROP COLUMN", "description": "", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET DATA TYPE": { "name": "ALTER TABLE SET DATA TYPE", "description": "", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE RENAME": { "name": "ALTER TABLE RENAME", "description": "", "locks": ["ACCESS EXCLUSIVE"] }
} as const;

const relationshipsData = {
  "conflicts": {
    "ACCESS SHARE": ["ACCESS EXCLUSIVE"],
    "ROW SHARE": ["EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "ROW EXCLUSIVE": ["SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "SHARE UPDATE EXCLUSIVE": ["SHARE UPDATE EXCLUSIVE", "SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "SHARE": ["ROW EXCLUSIVE", "SHARE UPDATE EXCLUSIVE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "SHARE ROW EXCLUSIVE": ["ROW EXCLUSIVE", "SHARE UPDATE EXCLUSIVE", "SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "EXCLUSIVE": ["ROW SHARE", "ROW EXCLUSIVE", "SHARE UPDATE EXCLUSIVE", "SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "ACCESS EXCLUSIVE": ["ACCESS SHARE", "ROW SHARE", "ROW EXCLUSIVE", "SHARE UPDATE EXCLUSIVE", "SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"]
  },
  "acquires": {
    "SELECT": ["ACCESS SHARE"],
    "COPY TO": ["ACCESS SHARE"],
    "SELECT FOR UPDATE": ["ROW SHARE"],
    "SELECT FOR NO KEY SHARE": ["ROW SHARE"],
    "SELECT FOR SHARE": ["ROW SHARE"],
    "SELECT FOR KEY SHARE": ["ROW SHARE"],
    "UPDATE": ["ROW EXCLUSIVE"],
    "DELETE": ["ROW EXCLUSIVE"],
    "INSERT": ["ROW EXCLUSIVE"],
    "MERGE": ["ROW EXCLUSIVE"],
    "COPY FROM": ["ROW EXCLUSIVE"],
    "CREATE INDEX": ["SHARE"],
    "VACUUM": ["SHARE UPDATE EXCLUSIVE"],
    "REINDEX CONCURRENTLY": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE STATISTICS": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE INDEX CONCURRENTLY": ["SHARE UPDATE EXCLUSIVE"],
    "COMMENT ON": ["SHARE UPDATE EXCLUSIVE"],
    "ANALYZE": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE TRIGGER": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ADD FOREIGN KEY": ["SHARE ROW EXCLUSIVE"],
    "REFRESH MATERIALIZED VIEW CONCURRENTLY": ["EXCLUSIVE"],
    "DROP TABLE": ["ACCESS EXCLUSIVE"],
    "TRUNCATE": ["ACCESS EXCLUSIVE"],
    "REINDEX": ["ACCESS EXCLUSIVE"],
    "CLUSTER": ["ACCESS EXCLUSIVE"],
    "VACUUM FULL": ["ACCESS EXCLUSIVE"],
    "REFRESH MATERIALIZED VIEW": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE ADD COLUMN": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE DROP COLUMN": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET DATA TYPE": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE RENAME": ["ACCESS EXCLUSIVE"]
  }
} as const;

// Process the locks data
const processLocks = (): Lock[] => {
  const locks: Lock[] = [];
  
  // Add table locks
  locksData.tableLocks.forEach(lockName => {
    locks.push({
      name: lockName,
      description: locksData.descriptions[lockName as keyof typeof locksData.descriptions] || '',
      type: 'table'
    });
  });
  
  // Add row locks
  locksData.rowLocks.forEach(lockName => {
    locks.push({
      name: lockName,
      description: locksData.descriptions[lockName as keyof typeof locksData.descriptions] || '',
      type: 'row'
    });
  });
  
  return locks;
};

// Process the commands data
const processCommands = (): Command[] => {
  return Object.values(commandsData).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    locks: [...cmd.locks] // Convert readonly array to mutable array
  }));
};

// Main data export
export const data: DataStructure = {
  locks: processLocks(),
  commands: processCommands(),
  conflicts: Object.fromEntries(
    Object.entries(relationshipsData.conflicts).map(([key, value]) => [key, [...value]])
  ),
  acquires: Object.fromEntries(
    Object.entries(relationshipsData.acquires).map(([key, value]) => [key, [...value]])
  )
};

// Utility functions
export const getAllLockNames = (): string[] => {
  return data.locks.map(lock => lock.name);
};

export const getConflicts = (lockName: string): string[] => {
  return data.conflicts[lockName] || [];
};

export const hasConflict = (lock1: string, lock2: string): boolean => {
  const conflicts1 = getConflicts(lock1);
  const conflicts2 = getConflicts(lock2);
  return conflicts1.includes(lock2) || conflicts2.includes(lock1);
};

export const getCommandsForLock = (lockName: string): Command[] => {
  return data.commands.filter(cmd => cmd.locks.includes(lockName));
};

export const searchItems = (query: string, includeCommands = true, includeLocks = true): (Command | Lock)[] => {
  const results: (Command | Lock)[] = [];
  const searchTerm = query.toLowerCase();
  
  if (includeCommands) {
    data.commands.forEach(cmd => {
      if (cmd.name.toLowerCase().includes(searchTerm) || 
          cmd.description.toLowerCase().includes(searchTerm)) {
        results.push(cmd);
      }
    });
  }
  
  if (includeLocks) {
    data.locks.forEach(lock => {
      if (lock.name.toLowerCase().includes(searchTerm) || 
          lock.description.toLowerCase().includes(searchTerm)) {
        results.push(lock);
      }
    });
  }
  
  return results;
};

export const getLockByName = (lockName: string): Lock | undefined => {
  return data.locks.find(lock => lock.name === lockName);
};

export const getCommandsThatUseLock = (lockName: string): Command[] => {
  return data.commands.filter(cmd => cmd.locks.includes(lockName));
};

export const getConflictingLocks = (lockName: string): string[] => {
  return getConflicts(lockName);
};

export const generateLockDescription = (lockName: string): string | null => {
  const lock = getLockByName(lockName);
  if (!lock) return null;

  const commandsUsingLock = getCommandsThatUseLock(lockName);
  const conflictingLocks = getConflictingLocks(lockName);
  
  // Get all commands that use the conflicting locks
  const conflictingCommands = new Set<string>();
  conflictingLocks.forEach(conflictLock => {
    const commandsUsingConflictLock = getCommandsThatUseLock(conflictLock);
    commandsUsingConflictLock.forEach(cmd => conflictingCommands.add(cmd.name));
  });
  
  const conflictingCommandsList = Array.from(conflictingCommands);
  
  // Build the description
  let description = `**${lock.name}** is a ${lock.type} lock. `;
  
  if (lock.description) {
    description += lock.description + " ";
  }
  
  // Commands that use this lock
  if (commandsUsingLock.length > 0) {
    const commandNames = commandsUsingLock.map(cmd => cmd.name);
    if (commandNames.length === 1) {
      description += `The **${commandNames[0]}** command acquires this lock. `;
    } else if (commandNames.length <= 3) {
      const lastCommand = commandNames.pop();
      description += `The **${commandNames.join(', ')}** and **${lastCommand}** commands acquire this lock. `;
    } else {
      description += `**${commandNames.length}** commands acquire this lock, including **${commandNames.slice(0, 3).join(', ')}** and others. `;
    }
  }
  
  // Conflicting commands
  if (conflictingCommandsList.length > 0) {
    if (conflictingCommandsList.length === 1) {
      description += `This lock conflicts with the **${conflictingCommandsList[0]}** command.`;
    } else if (conflictingCommandsList.length <= 4) {
      const lastCommand = conflictingCommandsList[conflictingCommandsList.length - 1];
      const otherCommands = conflictingCommandsList.slice(0, -1);
      description += `This lock conflicts with the **${otherCommands.join(', ')}** and **${lastCommand}** commands.`;
    } else {
      description += `This lock conflicts with **${conflictingCommandsList.length}** commands, including **${conflictingCommandsList.slice(0, 4).join(', ')}** and others.`;
    }
  } else {
    description += "This lock doesn't conflict with any commands.";
  }
  
  return description;
};