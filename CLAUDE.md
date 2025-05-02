# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Code Style Guidelines
- **Imports**: Group imports by source (React, third-party, local), sort alphabetically
- **TypeScript**: Use strict typing with explicit interfaces for props and state
- **Components**: Use functional components with React hooks
- **State Management**: Use context for global state (RegisterFormContext), Zustand for location store
- **File Structure**: Components in src/components/, pages in src/pages/, shared types in src/shared/types/
- **Naming**: PascalCase for components, camelCase for variables/functions, ALL_CAPS for constants
- **Error Handling**: Use try/catch blocks with console.error for API calls
- **Formatting**: Use 2-space indentation, semicolons at end of statements
- **Component Props**: Define interfaces, with optional props using '?'
- **API Calls**: Use service modules in lib/api/ for data fetching

## Available Tools for Claude
- **Task**: Launch agents for complex tasks like searching codebases or analyzing patterns
- **Bash**: Execute shell commands for git operations, file management, etc.
- **Batch**: Run multiple tools in parallel for efficiency (recommended for multiple operations)
- **Glob**: Find files matching specific patterns (e.g., `**/*.tsx`)
- **Grep**: Search file contents using regex patterns
- **LS**: List directory contents
- **Read**: Read file contents
- **Edit**: Make targeted changes to files
- **Write**: Create or overwrite files
- **NotebookRead/Edit**: Work with Jupyter notebooks
- **WebFetch**: Retrieve and analyze web content
- **TodoRead/Write**: Manage task lists during development