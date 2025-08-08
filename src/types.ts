export interface Lock {
  name: string;
  description: string;
  type: 'table' | 'row';
}

export interface Command {
  name: string;
  description: string;
  locks: string[];
}

export interface LockConflicts {
  [lockName: string]: string[];
}

export interface CommandLocks {
  [commandName: string]: string[];
}

export interface DataStructure {
  locks: Lock[];
  commands: Command[];
  conflicts: LockConflicts;
  acquires: CommandLocks;
}