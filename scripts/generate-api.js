import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to convert command name to URL-safe format
const toUrlFormat = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[()]/g, '')
    .replace(/\//g, '-')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/:/g, '')
    .replace(/\+/g, 'plus')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Create directory if it doesn't exist
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Hard-coded data from data.ts
const DATA = {
  locks: [
    { name: "ACCESS SHARE", description: "Read-only table lock acquired by SELECT and COPY TO; only conflicts with ACCESS EXCLUSIVE.", type: "table" },
    { name: "ROW SHARE", description: "Table lock for SELECT ... FOR * variants; allows reads but conflicts with EXCLUSIVE and ACCESS EXCLUSIVE.", type: "table" },
    { name: "ROW EXCLUSIVE", description: "Table lock acquired by DML (INSERT/UPDATE/DELETE/MERGE/COPY FROM); conflicts with SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, ACCESS EXCLUSIVE.", type: "table" },
    { name: "SHARE UPDATE EXCLUSIVE", description: "Allows reads and writes but blocks schema changes and VACUUM FULL; conflicts with itself and stronger locks.", type: "table" },
    { name: "SHARE", description: "Acquired by CREATE INDEX; blocks concurrent data modifications but not itself.", type: "table" },
    { name: "SHARE ROW EXCLUSIVE", description: "Blocks writes; allows SELECT FORs; conflicts with itself and stronger locks.", type: "table" },
    { name: "EXCLUSIVE", description: "Similar to ACCESS EXCLUSIVE but allows ACCESS SHARE readers (e.g., REFRESH MATERIALIZED VIEW CONCURRENTLY).", type: "table" },
    { name: "ACCESS EXCLUSIVE", description: "Strongest table lock; conflicts with all other table locks. Acquired by operations like VACUUM FULL, TRUNCATE, many ALTERs.", type: "table" },
    { name: "FOR KEY SHARE", description: "Row lock: weakest; allows updates to non-unique columns; conflicts with FOR UPDATE.", type: "row" },
    { name: "FOR SHARE", description: "Row lock: shared; prevents DML on the row; conflicts with NO KEY UPDATE and UPDATE.", type: "row" },
    { name: "FOR NO KEY UPDATE", description: "Row lock acquired by UPDATE on non-unique columns; weaker than FOR UPDATE.", type: "row" },
    { name: "FOR UPDATE", description: "Row lock: strongest; prevents UPDATE/DELETE/SELECT FOR UPDATE by other transactions.", type: "row" }
  ],
  
  commands: [
    { name: "SELECT", description: "Read data from table; acquires ACCESS SHARE table lock.", locks: ["ACCESS SHARE"] },
    { name: "COPY TO", description: "Export data to file; acquires ACCESS SHARE table lock.", locks: ["ACCESS SHARE"] },
    { name: "SELECT FOR UPDATE", description: "Locks selected rows to prevent concurrent modifications; also takes ROW SHARE table lock.", locks: ["ROW SHARE"] },
    { name: "SELECT FOR NO KEY UPDATE", description: "Locks selected rows for update of non-key columns; takes ROW SHARE table lock.", locks: ["ROW SHARE"] },
    { name: "SELECT FOR SHARE", description: "Locks selected rows to prevent modifications; takes ROW SHARE table lock.", locks: ["ROW SHARE"] },
    { name: "SELECT FOR KEY SHARE", description: "Locks selected rows to prevent key modifications; takes ROW SHARE table lock.", locks: ["ROW SHARE"] },
    { name: "DELETE", description: "Remove rows; takes ROW EXCLUSIVE table lock and row locks.", locks: ["ROW EXCLUSIVE"] },
    { name: "INSERT", description: "Insert rows; takes ROW EXCLUSIVE table lock.", locks: ["ROW EXCLUSIVE"] },
    { name: "MERGE", description: "Merge rows based on conditions; takes ROW EXCLUSIVE table lock.", locks: ["ROW EXCLUSIVE"] },
    { name: "COPY FROM", description: "Import data from file; takes ROW EXCLUSIVE table lock.", locks: ["ROW EXCLUSIVE"] },
    { name: "VACUUM", description: "Maintains storage; allows reads and writes; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ANALYZE", description: "Collect statistics about table contents; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "CREATE INDEX CONCURRENTLY", description: "Build index allowing writes; SHARE UPDATE EXCLUSIVE on phases.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "CREATE STATISTICS", description: "Create extended statistics; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "COMMENT ON", description: "Add or modify comments on database objects; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "REINDEX CONCURRENTLY", description: "Rebuild indexes with minimal blocking; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE VALIDATE CONSTRAINT", description: "Validate a check constraint; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET WITHOUT CLUSTER", description: "Remove clustering information; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET STATISTICS", description: "Set statistics target for a column; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET TABLESPACE", description: "Move table to different tablespace; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE CLUSTER ON", description: "Set clustering index for table; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET FILLFACTOR", description: "Set table fillfactor parameter; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER INDEX RENAME", description: "Rename an index; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "CREATE INDEX", description: "Build index blocking writes; SHARE lock.", locks: ["SHARE"] },
    { name: "CREATE TRIGGER", description: "Create a trigger on table; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "REFRESH MATERIALIZED VIEW CONCURRENTLY", description: "Concurrent refresh; EXCLUSIVE.", locks: ["EXCLUSIVE"] },
    { name: "DROP TABLE", description: "Remove table completely; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "TRUNCATE", description: "Remove all rows; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "REINDEX", description: "Rebuild indexes; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "CLUSTER", description: "Reorder table based on index; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "VACUUM FULL", description: "Rewrites table to compact storage; requires ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "REFRESH MATERIALIZED VIEW", description: "Refreshes view; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE ADD COLUMN", description: "Add column to table; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE DROP COLUMN", description: "Remove column from table; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET DATA TYPE", description: "Change column data type; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE RENAME", description: "Rename table; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE ADD CONSTRAINT", description: "Add table constraint; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE DROP CONSTRAINT", description: "Remove table constraint; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET STORAGE", description: "Set column storage type; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET COMPRESSION", description: "Set column compression method; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE ALTER CONSTRAINT", description: "Modify table constraint; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER INDEX SET TABLESPACE", description: "Move index to different tablespace; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER INDEX ATTACH PARTITION", description: "Attach index partition; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER INDEX SET FILLFACTOR", description: "Set index fillfactor; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "DROP INDEX", description: "Remove index; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "UPDATE (NO KEYS)", description: "UPDATE operation on non-key columns; takes ROW EXCLUSIVE table lock.", locks: ["ROW EXCLUSIVE"] },
    { name: "UPDATE (KEYS)", description: "UPDATE operation on key columns; takes ROW EXCLUSIVE table lock.", locks: ["ROW EXCLUSIVE"] },
    { name: "DROP INDEX CONCURRENTLY", description: "Drop index concurrently; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET/DROP DEFAULT", description: "Set or drop column default value; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET TOAST", description: "Set TOAST storage parameters; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET SEQUENCE", description: "Set sequence for column; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE SET N_DISTINCT", description: "Set n_distinct statistics for column; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE SET AUTOVACUUUM", description: "Set autovacuum parameters; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE RESET STORAGE", description: "Reset storage parameters; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE INHERIT PARENT", description: "Add table inheritance; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE ENABLE/DISABLE TRIGGER", description: "Enable or disable triggers; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "ALTER TABLE ENABLE/DISABLE RULE", description: "Enable or disable rules; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "ALTER TABLE ENABLE/DISABLE ROW LEVEL SECURITY", description: "Enable or disable row level security; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE DROP EXPRESSION", description: "Drop generated expression column; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE DETACH PARTITION (PARENT)", description: "Detach partition - parent table lock; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE DETACH PARTITION (TARGET/DEFAULT)", description: "Detach partition - target table lock; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE DETACH PARTITION CONCURRENTLY (PARENT)", description: "Detach partition concurrently - parent table; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE DETACH PARTITION CONCURRENTLY (TARGET/DEFAULT)", description: "Detach partition concurrently - target table; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE ATTACH PARTITION (PARENT)", description: "Attach partition - parent table lock; SHARE UPDATE EXCLUSIVE.", locks: ["SHARE UPDATE EXCLUSIVE"] },
    { name: "ALTER TABLE ATTACH PARTITION (TARGET/DEFAULT)", description: "Attach partition - target table lock; ACCESS EXCLUSIVE.", locks: ["ACCESS EXCLUSIVE"] },
    { name: "ALTER TABLE ADD FOREIGN KEY NOT VALID (PARENT)", description: "Add foreign key not valid - parent table; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "ALTER TABLE ADD FOREIGN KEY NOT VALID (CHILD)", description: "Add foreign key not valid - child table; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "ALTER TABLE ADD FOREIGN KEY (PARENT)", description: "Add foreign key - parent table lock; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] },
    { name: "ALTER TABLE ADD FOREIGN KEY (CHILD)", description: "Add foreign key - child table lock; SHARE ROW EXCLUSIVE.", locks: ["SHARE ROW EXCLUSIVE"] }
  ],
  
  conflicts: {
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
  }
};

const generateApiFiles = () => {
  console.log('🚀 Generating API files...');
  
  // Create API directories
  const projectRoot = path.resolve(__dirname, '..');
  const publicDir = path.join(projectRoot, 'public');
  const apiDir = path.join(publicDir, 'api');
  const commandDir = path.join(apiDir, 'command');
  const lockDir = path.join(apiDir, 'lock');
  
  ensureDir(commandDir);
  ensureDir(lockDir);
  
  console.log(`📁 Created directories in ${publicDir}/api/`);
  
  // Helper functions
  const getCommandsForLock = (lockName) => {
    return DATA.commands.filter(cmd => cmd.locks.includes(lockName));
  };
  
  const getConflictingLocks = (lockName) => {
    return DATA.conflicts[lockName] || [];
  };
  
  const getConflictingCommandsForLock = (lockName) => {
    const conflictingLocks = getConflictingLocks(lockName);
    const conflictingCommands = new Set();
    
    conflictingLocks.forEach(conflictLock => {
      const commandsUsingConflictLock = getCommandsForLock(conflictLock);
      commandsUsingConflictLock.forEach(cmd => conflictingCommands.add(cmd.name));
    });
    
    return Array.from(conflictingCommands);
  };
  
  const getConflictingCommandsForCommand = (commandName) => {
    const command = DATA.commands.find(cmd => cmd.name === commandName);
    if (!command) return [];
    
    const conflictingCommands = new Set();
    
    command.locks.forEach(lockName => {
      const conflictingLocks = getConflictingLocks(lockName);
      conflictingLocks.forEach(conflictLock => {
        const commandsUsingConflictLock = getCommandsForLock(conflictLock);
        commandsUsingConflictLock.forEach(cmd => {
          if (cmd.name !== commandName) {
            conflictingCommands.add(cmd.name);
          }
        });
      });
    });
    
    return Array.from(conflictingCommands);
  };
  
  // Generate command JSON files
  console.log('⚙️  Generating command files...');
  DATA.commands.forEach(command => {
    const urlName = toUrlFormat(command.name);
    const conflictingLocks = new Set();
    const conflictingCommands = getConflictingCommandsForCommand(command.name);
    
    command.locks.forEach(lockName => {
      const lockConflicts = getConflictingLocks(lockName);
      lockConflicts.forEach(lock => conflictingLocks.add(lock));
    });
    
    const commandData = {
      name: command.name,
      description: command.description,
      locks: command.locks,
      conflicts: {
        locks: Array.from(conflictingLocks),
        commands: conflictingCommands
      }
    };
    
    const filePath = path.join(commandDir, `${urlName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(commandData, null, 2));
    console.log(`  ✅ ${command.name} -> ${urlName}.json`);
  });
  
  // Generate lock JSON files
  console.log('🔒 Generating lock files...');
  DATA.locks.forEach(lock => {
    const urlName = toUrlFormat(lock.name);
    const commandsUsingLock = getCommandsForLock(lock.name);
    const conflictingLocks = getConflictingLocks(lock.name);
    const conflictingCommands = getConflictingCommandsForLock(lock.name);
    
    const lockData = {
      name: lock.name,
      description: lock.description,
      type: lock.type,
      commands: commandsUsingLock.map(cmd => cmd.name),
      conflicts: {
        locks: conflictingLocks,
        commands: conflictingCommands
      }
    };
    
    const filePath = path.join(lockDir, `${urlName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(lockData, null, 2));
    console.log(`  ✅ ${lock.name} -> ${urlName}.json`);
  });
  
  // Generate index files
  const commandIndex = {
    commands: DATA.commands.map(cmd => ({
      name: cmd.name,
      url: toUrlFormat(cmd.name),
      description: cmd.description
    }))
  };
  
  const lockIndex = {
    locks: DATA.locks.map(lock => ({
      name: lock.name,
      url: toUrlFormat(lock.name),
      description: lock.description,
      type: lock.type
    }))
  };
  
  fs.writeFileSync(path.join(commandDir, 'index.json'), JSON.stringify(commandIndex, null, 2));
  fs.writeFileSync(path.join(lockDir, 'index.json'), JSON.stringify(lockIndex, null, 2));
  
  console.log('📋 Generated index files');
  
  // Generate mapping file
  const mappings = {
    commands: {},
    locks: {}
  };
  
  DATA.commands.forEach(cmd => {
    mappings.commands[toUrlFormat(cmd.name)] = cmd.name;
  });
  
  DATA.locks.forEach(lock => {
    mappings.locks[toUrlFormat(lock.name)] = lock.name;
  });
  
  fs.writeFileSync(path.join(apiDir, 'mappings.json'), JSON.stringify(mappings, null, 2));
  
  console.log('🗺️  Generated URL mappings');
  console.log(`✨ Generated ${DATA.commands.length} command files and ${DATA.locks.length} lock files`);
  console.log('🎉 API generation complete!');
};

// Run the script
generateApiFiles();