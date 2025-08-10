import { DataStructure, Lock, Command } from './types';

// Complete 69 PostgreSQL commands - CORRECTED with exact website data
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
  "SELECT": { "name": "SELECT", "description": "Read data from table; acquires ACCESS SHARE table lock.", "locks": ["ACCESS SHARE"] },
  "COPY TO": { "name": "COPY TO", "description": "Export data to file; acquires ACCESS SHARE table lock.", "locks": ["ACCESS SHARE"] },
  "SELECT FOR UPDATE": { "name": "SELECT FOR UPDATE", "description": "Locks selected rows to prevent concurrent modifications; also takes ROW SHARE table lock.", "locks": ["ROW SHARE"] },
  "SELECT FOR NO KEY UPDATE": { "name": "SELECT FOR NO KEY UPDATE", "description": "Locks selected rows for update of non-key columns; takes ROW SHARE table lock.", "locks": ["ROW SHARE"] },
  "SELECT FOR SHARE": { "name": "SELECT FOR SHARE", "description": "Locks selected rows to prevent modifications; takes ROW SHARE table lock.", "locks": ["ROW SHARE"] },
  "SELECT FOR KEY SHARE": { "name": "SELECT FOR KEY SHARE", "description": "Locks selected rows to prevent key modifications; takes ROW SHARE table lock.", "locks": ["ROW SHARE"] },
  "DELETE": { "name": "DELETE", "description": "Remove rows; takes ROW EXCLUSIVE table lock and row locks.", "locks": ["ROW EXCLUSIVE"] },
  "INSERT": { "name": "INSERT", "description": "Insert rows; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "MERGE": { "name": "MERGE", "description": "Merge rows based on conditions; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "COPY FROM": { "name": "COPY FROM", "description": "Import data from file; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "VACUUM": { "name": "VACUUM", "description": "Maintains storage; allows reads and writes; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ANALYZE": { "name": "ANALYZE", "description": "Collect statistics about table contents; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE INDEX CONCURRENTLY": { "name": "CREATE INDEX CONCURRENTLY", "description": "Build index allowing writes; SHARE UPDATE EXCLUSIVE on phases.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE STATISTICS": { "name": "CREATE STATISTICS", "description": "Create extended statistics; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "COMMENT ON": { "name": "COMMENT ON", "description": "Add or modify comments on database objects; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "REINDEX CONCURRENTLY": { "name": "REINDEX CONCURRENTLY", "description": "Rebuild indexes with minimal blocking; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE VALIDATE CONSTRAINT": { "name": "ALTER TABLE VALIDATE CONSTRAINT", "description": "Validate a check constraint; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET WITHOUT CLUSTER": { "name": "ALTER TABLE SET WITHOUT CLUSTER", "description": "Remove clustering information; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET STATISTICS": { "name": "ALTER TABLE SET STATISTICS", "description": "Set statistics target for a column; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET TABLESPACE": { "name": "ALTER TABLE SET TABLESPACE", "description": "Move table to different tablespace; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE CLUSTER ON": { "name": "ALTER TABLE CLUSTER ON", "description": "Set clustering index for table; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET FILLFACTOR": { "name": "ALTER TABLE SET FILLFACTOR", "description": "Set table fillfactor parameter; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER INDEX RENAME": { "name": "ALTER INDEX RENAME", "description": "Rename an index; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "CREATE INDEX": { "name": "CREATE INDEX", "description": "Build index blocking writes; SHARE lock.", "locks": ["SHARE"] },
  "CREATE TRIGGER": { "name": "CREATE TRIGGER", "description": "Create a trigger on table; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "REFRESH MATERIALIZED VIEW CONCURRENTLY": { "name": "REFRESH MATERIALIZED VIEW CONCURRENTLY", "description": "Concurrent refresh; EXCLUSIVE.", "locks": ["EXCLUSIVE"] },
  "DROP TABLE": { "name": "DROP TABLE", "description": "Remove table completely; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "TRUNCATE": { "name": "TRUNCATE", "description": "Remove all rows; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "REINDEX": { "name": "REINDEX", "description": "Rebuild indexes; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "CLUSTER": { "name": "CLUSTER", "description": "Reorder table based on index; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "VACUUM FULL": { "name": "VACUUM FULL", "description": "Rewrites table to compact storage; requires ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "REFRESH MATERIALIZED VIEW": { "name": "REFRESH MATERIALIZED VIEW", "description": "Refreshes view; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ADD COLUMN": { "name": "ALTER TABLE ADD COLUMN", "description": "Add column to table; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DROP COLUMN": { "name": "ALTER TABLE DROP COLUMN", "description": "Remove column from table; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET DATA TYPE": { "name": "ALTER TABLE SET DATA TYPE", "description": "Change column data type; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE RENAME": { "name": "ALTER TABLE RENAME", "description": "Rename table; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ADD CONSTRAINT": { "name": "ALTER TABLE ADD CONSTRAINT", "description": "Add table constraint; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DROP CONSTRAINT": { "name": "ALTER TABLE DROP CONSTRAINT", "description": "Remove table constraint; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET STORAGE": { "name": "ALTER TABLE SET STORAGE", "description": "Set column storage type; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET COMPRESSION": { "name": "ALTER TABLE SET COMPRESSION", "description": "Set column compression method; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ALTER CONSTRAINT": { "name": "ALTER TABLE ALTER CONSTRAINT", "description": "Modify table constraint; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER INDEX SET TABLESPACE": { "name": "ALTER INDEX SET TABLESPACE", "description": "Move index to different tablespace; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER INDEX ATTACH PARTITION": { "name": "ALTER INDEX ATTACH PARTITION", "description": "Attach index partition; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER INDEX SET FILLFACTOR": { "name": "ALTER INDEX SET FILLFACTOR", "description": "Set index fillfactor; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "DROP INDEX": { "name": "DROP INDEX", "description": "Remove index; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "UPDATE (NO KEYS)": { "name": "UPDATE (NO KEYS)", "description": "UPDATE operation on non-key columns; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "UPDATE (KEYS)": { "name": "UPDATE (KEYS)", "description": "UPDATE operation on key columns; takes ROW EXCLUSIVE table lock.", "locks": ["ROW EXCLUSIVE"] },
  "DROP INDEX CONCURRENTLY": { "name": "DROP INDEX CONCURRENTLY", "description": "Drop index concurrently; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET/DROP DEFAULT": { "name": "ALTER TABLE SET/DROP DEFAULT", "description": "Set or drop column default value; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET TOAST": { "name": "ALTER TABLE SET TOAST", "description": "Set TOAST storage parameters; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET SEQUENCE": { "name": "ALTER TABLE SET SEQUENCE", "description": "Set sequence for column; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE SET N_DISTINCT": { "name": "ALTER TABLE SET N_DISTINCT", "description": "Set n_distinct statistics for column; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE SET AUTOVACUUUM": { "name": "ALTER TABLE SET AUTOVACUUUM", "description": "Set autovacuum parameters; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE RESET STORAGE": { "name": "ALTER TABLE RESET STORAGE", "description": "Reset storage parameters; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE INHERIT PARENT": { "name": "ALTER TABLE INHERIT PARENT", "description": "Add table inheritance; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ENABLE/DISABLE TRIGGER": { "name": "ALTER TABLE ENABLE/DISABLE TRIGGER", "description": "Enable or disable triggers; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ENABLE/DISABLE RULE": { "name": "ALTER TABLE ENABLE/DISABLE RULE", "description": "Enable or disable rules; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ENABLE/DISABLE ROW LEVEL SECURITY": { "name": "ALTER TABLE ENABLE/DISABLE ROW LEVEL SECURITY", "description": "Enable or disable row level security; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DROP EXPRESSION": { "name": "ALTER TABLE DROP EXPRESSION", "description": "Drop generated expression column; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DETACH PARTITION (PARENT)": { "name": "ALTER TABLE DETACH PARTITION (PARENT)", "description": "Detach partition - parent table lock; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE DETACH PARTITION (TARGET/DEFAULT)": { "name": "ALTER TABLE DETACH PARTITION (TARGET/DEFAULT)", "description": "Detach partition - target table lock; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE DETACH PARTITION CONCURRENTLY (PARENT)": { "name": "ALTER TABLE DETACH PARTITION CONCURRENTLY (PARENT)", "description": "Detach partition concurrently - parent table; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE DETACH PARTITION CONCURRENTLY (TARGET/DEFAULT)": { "name": "ALTER TABLE DETACH PARTITION CONCURRENTLY (TARGET/DEFAULT)", "description": "Detach partition concurrently - target table; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE ATTACH PARTITION (PARENT)": { "name": "ALTER TABLE ATTACH PARTITION (PARENT)", "description": "Attach partition - parent table lock; SHARE UPDATE EXCLUSIVE.", "locks": ["SHARE UPDATE EXCLUSIVE"] },
  "ALTER TABLE ATTACH PARTITION (TARGET/DEFAULT)": { "name": "ALTER TABLE ATTACH PARTITION (TARGET/DEFAULT)", "description": "Attach partition - target table lock; ACCESS EXCLUSIVE.", "locks": ["ACCESS EXCLUSIVE"] },
  "ALTER TABLE ADD FOREIGN KEY NOT VALID (PARENT)": { "name": "ALTER TABLE ADD FOREIGN KEY NOT VALID (PARENT)", "description": "Add foreign key not valid - parent table; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ADD FOREIGN KEY NOT VALID (CHILD)": { "name": "ALTER TABLE ADD FOREIGN KEY NOT VALID (CHILD)", "description": "Add foreign key not valid - child table; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ADD FOREIGN KEY (PARENT)": { "name": "ALTER TABLE ADD FOREIGN KEY (PARENT)", "description": "Add foreign key - parent table lock; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] },
  "ALTER TABLE ADD FOREIGN KEY (CHILD)": { "name": "ALTER TABLE ADD FOREIGN KEY (CHILD)", "description": "Add foreign key - child table lock; SHARE ROW EXCLUSIVE.", "locks": ["SHARE ROW EXCLUSIVE"] }
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
    "ACCESS EXCLUSIVE": ["ACCESS SHARE", "ROW SHARE", "ROW EXCLUSIVE", "SHARE UPDATE EXCLUSIVE", "SHARE", "SHARE ROW EXCLUSIVE", "EXCLUSIVE", "ACCESS EXCLUSIVE"],
    "FOR KEY SHARE": ["FOR UPDATE"],
    "FOR SHARE": ["FOR NO KEY UPDATE", "FOR UPDATE"],
    "FOR NO KEY UPDATE": ["FOR SHARE", "FOR NO KEY UPDATE", "FOR UPDATE"],
    "FOR UPDATE": ["FOR KEY SHARE", "FOR SHARE", "FOR NO KEY UPDATE", "FOR UPDATE"]
  },
  "acquires": {
    "SELECT": ["ACCESS SHARE"],
    "COPY TO": ["ACCESS SHARE"],
    "SELECT FOR UPDATE": ["ROW SHARE"],
    "SELECT FOR NO KEY UPDATE": ["ROW SHARE"],
    "SELECT FOR SHARE": ["ROW SHARE"],
    "SELECT FOR KEY SHARE": ["ROW SHARE"],
    "DELETE": ["ROW EXCLUSIVE"],
    "INSERT": ["ROW EXCLUSIVE"],
    "MERGE": ["ROW EXCLUSIVE"],
    "COPY FROM": ["ROW EXCLUSIVE"],
    "VACUUM": ["SHARE UPDATE EXCLUSIVE"],
    "ANALYZE": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE INDEX CONCURRENTLY": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE STATISTICS": ["SHARE UPDATE EXCLUSIVE"],
    "COMMENT ON": ["SHARE UPDATE EXCLUSIVE"],
    "REINDEX CONCURRENTLY": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE VALIDATE CONSTRAINT": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET WITHOUT CLUSTER": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET STATISTICS": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET TABLESPACE": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE CLUSTER ON": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET FILLFACTOR": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER INDEX RENAME": ["SHARE UPDATE EXCLUSIVE"],
    "CREATE INDEX": ["SHARE"],
    "CREATE TRIGGER": ["SHARE ROW EXCLUSIVE"],
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
    "ALTER TABLE RENAME": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE ADD CONSTRAINT": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE DROP CONSTRAINT": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET STORAGE": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET COMPRESSION": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE ALTER CONSTRAINT": ["ACCESS EXCLUSIVE"],
    "ALTER INDEX SET TABLESPACE": ["ACCESS EXCLUSIVE"],
    "ALTER INDEX ATTACH PARTITION": ["ACCESS EXCLUSIVE"],
    "ALTER INDEX SET FILLFACTOR": ["ACCESS EXCLUSIVE"],
    "DROP INDEX": ["ACCESS EXCLUSIVE"],
    "UPDATE (NO KEYS)": ["ROW EXCLUSIVE"],
    "UPDATE (KEYS)": ["ROW EXCLUSIVE"],
    "DROP INDEX CONCURRENTLY": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET/DROP DEFAULT": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET TOAST": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET SEQUENCE": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE SET N_DISTINCT": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE SET AUTOVACUUUM": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE RESET STORAGE": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE INHERIT PARENT": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE ENABLE/DISABLE TRIGGER": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ENABLE/DISABLE RULE": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ENABLE/DISABLE ROW LEVEL SECURITY": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE DROP EXPRESSION": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE DETACH PARTITION (PARENT)": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE DETACH PARTITION (TARGET/DEFAULT)": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE DETACH PARTITION CONCURRENTLY (PARENT)": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE DETACH PARTITION CONCURRENTLY (TARGET/DEFAULT)": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE ATTACH PARTITION (PARENT)": ["SHARE UPDATE EXCLUSIVE"],
    "ALTER TABLE ATTACH PARTITION (TARGET/DEFAULT)": ["ACCESS EXCLUSIVE"],
    "ALTER TABLE ADD FOREIGN KEY NOT VALID (PARENT)": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ADD FOREIGN KEY NOT VALID (CHILD)": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ADD FOREIGN KEY (PARENT)": ["SHARE ROW EXCLUSIVE"],
    "ALTER TABLE ADD FOREIGN KEY (CHILD)": ["SHARE ROW EXCLUSIVE"]
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

// Check if two commands can run together (their locks don't conflict)
export const commandsCanRunTogether = (command1: string, command2: string): boolean => {
  const cmd1 = data.commands.find(cmd => cmd.name === command1);
  const cmd2 = data.commands.find(cmd => cmd.name === command2);
  
  if (!cmd1 || !cmd2) return false;
  
  // Check if any lock from command1 conflicts with any lock from command2
  for (const lock1 of cmd1.locks) {
    for (const lock2 of cmd2.locks) {
      if (hasConflict(lock1, lock2)) {
        return false;
      }
    }
  }
  
  return true;
};

export const getAllCommandNames = (): string[] => {
  return data.commands.map(cmd => cmd.name);
};

export const getCommandByName = (commandName: string): Command | undefined => {
  return data.commands.find(cmd => cmd.name === commandName);
};

// Get all commands that conflict with a given command
export const getConflictingCommands = (commandName: string): string[] => {
  const allCommands = getAllCommandNames();
  return allCommands.filter(otherCommand => 
    otherCommand !== commandName && !commandsCanRunTogether(commandName, otherCommand)
  );
};

export const generateCommandDescription = (commandName: string): string | null => {
  const command = getCommandByName(commandName);
  if (!command) return null;

  let description = `**${command.name}** is a PostgreSQL command. `;
  
  if (command.description) {
    description += command.description + " ";
  }
  
  // Locks used by this command
  if (command.locks.length > 0) {
    if (command.locks.length === 1) {
      description += `This command requires the **${command.locks[0]}** lock. `;
    } else {
      const lastLock = command.locks[command.locks.length - 1];
      const otherLocks = command.locks.slice(0, -1);
      description += `This command requires **${otherLocks.join(', ')}** and **${lastLock}** locks. `;
    }
    
    // Explain why the lock is needed
    const lockReasons = command.locks.map(lockName => {
      const lock = getLockByName(lockName);
      if (lock && lock.description) {
        return `**${lockName}** is required because ${lock.description.toLowerCase()}`;
      }
      return `**${lockName}** is required for this operation`;
    });
    
    if (lockReasons.length === 1) {
      description += lockReasons[0] + ".";
    } else {
      description += lockReasons.join("; ") + ".";
    }
  }
  
  return description;
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