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

// Dynamic data extraction from data.ts
const extractDataFromTS = () => {
  const dataPath = path.join(__dirname, '..', 'src', 'data.ts');
  const content = fs.readFileSync(dataPath, 'utf8');
  
  // Extract locksData object
  const locksDataMatch = content.match(/const locksData = ({[\s\S]*?}) as const;/);
  if (!locksDataMatch) {
    throw new Error('Could not extract locksData from data.ts');
  }
  
  // Extract commandsData object
  const commandsDataMatch = content.match(/const commandsData = ({[\s\S]*?}) as const;/);
  if (!commandsDataMatch) {
    throw new Error('Could not extract commandsData from data.ts');
  }
  
  // Extract relationshipsData object
  const relationshipsDataMatch = content.match(/const relationshipsData = ({[\s\S]*?}) as const;/);
  if (!relationshipsDataMatch) {
    throw new Error('Could not extract relationshipsData from data.ts');
  }
  
  // Safely evaluate the extracted objects
  let locksData, commandsData, relationshipsData;
  
  try {
    // Use Function constructor for safer evaluation than eval
    locksData = new Function('return ' + locksDataMatch[1])();
    commandsData = new Function('return ' + commandsDataMatch[1])();
    relationshipsData = new Function('return ' + relationshipsDataMatch[1])();
  } catch (error) {
    throw new Error('Failed to parse data from data.ts: ' + error.message);
  }
  
  // Process locks
  const locks = [];
  
  // Add table locks
  locksData.tableLocks.forEach(lockName => {
    locks.push({
      name: lockName,
      description: locksData.descriptions[lockName] || '',
      type: 'table'
    });
  });
  
  // Add row locks
  locksData.rowLocks.forEach(lockName => {
    locks.push({
      name: lockName,
      description: locksData.descriptions[lockName] || '',
      type: 'row'
    });
  });
  
  // Process commands
  const commands = Object.values(commandsData).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    locks: [...cmd.locks]
  }));
  
  return {
    locks,
    commands,
    conflicts: relationshipsData.conflicts
  };
};

const generateApiFiles = () => {
  console.log('🚀 Generating API files...');
  
  // Extract data from data.ts at runtime
  const DATA = extractDataFromTS();
  console.log(`📊 Extracted ${DATA.commands.length} commands and ${DATA.locks.length} locks from data.ts`);
  
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
    
    const commandFolder = path.join(commandDir, urlName);
    ensureDir(commandFolder);
    const filePath = path.join(commandFolder, 'index.json');
    fs.writeFileSync(filePath, JSON.stringify(commandData, null, 2));
    console.log(`  ✅ ${command.name} -> ${urlName}/index.json`);
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
    
    const lockFolder = path.join(lockDir, urlName);
    ensureDir(lockFolder);
    const filePath = path.join(lockFolder, 'index.json');
    fs.writeFileSync(filePath, JSON.stringify(lockData, null, 2));
    console.log(`  ✅ ${lock.name} -> ${urlName}/index.json`);
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
  
  // Generate mapping file in mappings folder
  const mappingsDir = path.join(apiDir, 'mappings');
  ensureDir(mappingsDir);
  
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
  
  fs.writeFileSync(path.join(mappingsDir, 'index.json'), JSON.stringify(mappings, null, 2));
  
  console.log('🗺️  Generated URL mappings');
  console.log(`✨ Generated ${DATA.commands.length} command files and ${DATA.locks.length} lock files`);
  console.log('🎉 API generation complete!');
};

// Run the script
generateApiFiles();