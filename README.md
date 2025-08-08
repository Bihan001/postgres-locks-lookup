# PostgreSQL Locks Lookup

Application for exploring PostgreSQL lock types, command relationships, and conflict matrices.

## Features

- **Interactive Lock Conflict Matrix**: Visual matrix showing which PostgreSQL locks conflict with each other
- **Search Functionality**: Case-insensitive substring search for commands and locks
- **Accordion Cards**: Expandable cards for each command and lock with individual conflict matrices
- **Click-to-Search**: Click any lock name in the matrix to search for it automatically

## Getting Started

### Prerequisites

- Node.js (v22.14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd postgres-locks-lookup
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Usage

### Lock Conflict Matrix

The main matrix shows all PostgreSQL locks and their conflicts:
- **Red X**: Locks conflict with each other
- **Green Circle**: Locks are compatible
- **Click any lock name** to search for it

### Search

Use the search bar to find specific commands or locks:
- Case-insensitive substring matching
- Searches both names and descriptions

### Accordion Cards

Each command and lock has an expandable card showing:
- **Commands**: Display the locks they acquire as pills
- **Locks**: Show their type (table/row lock)
- **Individual Matrix**: When expanded, shows conflicts for that specific item

## Data Sources

The application uses three main data files:

- **data.ts/locksData**: Defines all PostgreSQL lock types with descriptions
- **data.ts/commandsData**: Lists SQL commands and their lock requirements
- **data.ts/relationshipsData**: Maps lock conflicts and command-lock relationships

## Technologies

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the application
5. Submit a pull request

## Authors

- [@Bihan001](https://github.com/Bihan001)

## License

This project is open source and available under the MIT License.
