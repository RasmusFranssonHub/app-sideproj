# app-sideproj

A modern web application starter built with Vite, TypeScript, SCSS, and Prettier.

## Tech Stack

- **[Vite](https://vite.dev/)** - Next generation frontend build tool
- **[TypeScript](https://www.typescriptlang.org/)** - Typed JavaScript at scale
- **[SCSS](https://sass-lang.com/)** - CSS with superpowers
- **[Prettier](https://prettier.io/)** - Opinionated code formatter

## Getting Started

### Prerequisites

- Node.js (v24+ recommended)
- npm (v11+ recommended)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at http://localhost:5173/

### Build

```bash
# Build for production
npm run build
```

The output will be in the `dist/` directory.

### Preview

```bash
# Preview production build locally
npm run preview
```

### Code Formatting

```bash
# Format all source files with Prettier
npm run format

# Check if files are formatted correctly
npm run format:check
```

## Project Structure

```
app-sideproj/
├── public/          # Static assets
├── src/
│   ├── counter.ts   # Counter component
│   ├── main.ts      # Application entry point
│   ├── style.scss   # Global styles (SCSS)
│   └── typescript.svg
├── index.html       # HTML entry point
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
├── .prettierrc      # Prettier configuration
└── .gitignore       # Git ignore rules
```

## Features

- ⚡️ Lightning-fast HMR with Vite
- 🎯 TypeScript with strict mode enabled
- 🎨 SCSS with variables, nesting, and more
- ✨ Code formatting with Prettier
- 📦 Optimized production builds

## License

Private
