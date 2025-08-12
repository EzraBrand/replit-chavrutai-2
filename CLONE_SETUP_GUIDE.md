# ChavrutAI - Development Clone Setup Guide

## Project Overview
Sophisticated Talmud learning platform with React/TypeScript frontend and Express backend.

## Core Dependencies to Install (via packager tool)
```json
{
  "main_frameworks": [
    "react",
    "react-dom", 
    "typescript",
    "vite",
    "@vitejs/plugin-react",
    "express",
    "tsx"
  ],
  "ui_components": [
    "@radix-ui/react-*", 
    "tailwindcss",
    "lucide-react",
    "framer-motion"
  ],
  "data_management": [
    "@tanstack/react-query",
    "wouter",
    "drizzle-orm",
    "drizzle-kit",
    "@neondatabase/serverless"
  ],
  "forms_validation": [
    "react-hook-form",
    "@hookform/resolvers",
    "zod",
    "zod-validation-error"
  ]
}
```

## Key Environment Variables Needed
- `DATABASE_URL` (if using PostgreSQL)
- `VITE_GA_MEASUREMENT_ID` (for Google Analytics)
- Any Sefaria API keys if implemented

## Important Files to Copy
✅ All files present in current structure:

### Configuration Files
- `package.json` & `package-lock.json`
- `tsconfig.json`
- `vite.config.ts` 
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json` (shadcn config)
- `drizzle.config.ts`

### Source Code
- `client/` directory (entire React frontend)
- `server/` directory (Express backend)
- `shared/` directory (TypeScript schemas)

### Assets & Data
- `attached_assets/` (all images and assets)
- `replit.md` (project documentation)
- SEO and content files

## Setup Steps for New Clone

1. **Create New Repl** (Node.js/React template)

2. **Install Dependencies**:
   Use the packager tool to install all dependencies listed above

3. **Copy Project Files**:
   Upload all source files maintaining directory structure

4. **Configure Environment**:
   - Set up environment variables
   - Configure database if needed

5. **Test Setup**:
   Run `npm run dev` to verify everything works

## Current Feature Status
✅ **Completed Features**:
- SEO optimization with Open Graph
- Technical term highlighting (5,385+ terms)
- Hebrew font selection system
- Responsive bilingual text display
- Analytics integration
- Complete tractate navigation

🚧 **In Development**:
- Ready for major feature development

## Major Feature Development Areas
- Enhanced text analysis
- User accounts/progress tracking  
- Advanced search capabilities
- Commentary integration
- Social features (study groups, notes sharing)

## Architecture Notes
- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- State: TanStack Query
- Database: Drizzle ORM (PostgreSQL ready)
- APIs: Sefaria integration

## Git Workflow (if using Projects)
- Main branch: Stable production code
- Feature branch: Your development work
- Merge back when feature is complete