# BookSmart - Advanced Bookmark Manager

> Save anything, organize infinitely, find instantly.

A modern bookmark manager with unlimited nested organization, multiple content types, and powerful search. Built with React, TypeScript, and Supabase.

## ✨ Key Features

- 📚 **Multiple Content Types**: Links, images, text snippets, to-do lists
- 🗂️ **Unlimited Organization**: Boards → Folders → Subfolders (infinite nesting)
- 🔍 **Powerful Search**: Board-scoped or global search across all content
- 📝 **Rich Notes**: Multiple notes per bookmark with timestamps
- ✅ **To-Do Lists**: Checklists with progress tracking
- 🎯 **Multi-URL Import**: Paste up to 20 URLs at once
- 📤 **Export/Import**: Full data portability with JSON export
- ⚡ **Performance**: Optimized for 1000+ bookmarks with caching and lazy loading

## 🗂️ Project Status

**Current Status:** Production-ready web application (~80% of MVP complete)

### ✅ Fully Implemented
- **Authentication**: Email/password and Google OAuth (Supabase)
- **Boards**: Unlimited boards with instant switching
- **Folders**: Unlimited nested subfolders (Google Drive-style)
- **Bookmark Types**: Links, images, text, to-do lists
- **Search**: Board-scoped and global search
- **Notes**: Multiple notes per bookmark
- **Categories & Tags**: Full support with filtering
- **Export/Import**: Complete data portability
- **Performance**: Caching, prefetching, lazy loading
- **Responsive Design**: Mobile-friendly UI

### 🚧 Not Yet Implemented
- AI-powered auto-categorization (code exists, not integrated)
- Browser extension
- Mobile app
- Content discovery features

See [CURRENT_FEATURES.md](./CURRENT_FEATURES.md) for complete feature documentation.

## 📋 Documentation

### Current Implementation
- **[CURRENT_FEATURES.md](./CURRENT_FEATURES.md)** - Complete documentation of all implemented features
- **[SUBFOLDER_MIGRATION.md](./SUBFOLDER_MIGRATION.md)** - Database migration guide for subfolder support
- [Architecture Overview](./ARCHITECTURE.md) - System design, data flow, and performance optimizations

### Original Planning
- [Project Plan](./PROJECT_PLAN.md) - Original development roadmap (for reference)
- [Features Coverage](./FEATURES_COVERAGE.md) - December 2024 snapshot (outdated - see CURRENT_FEATURES.md)
- [Getting Started](./GETTING_STARTED.md) - Initial setup guide (for reference)

## 🏗️ Repository Structure

```
alex-booksmart-app/
├── apps/
│   └── web/              # Web application (React + Vite + Supabase)
│       ├── src/
│       │   ├── components/       # UI components (dialogs, etc.)
│       │   ├── contexts/         # React contexts (Auth)
│       │   ├── lib/             # Utilities (storage, metadata, AI)
│       │   ├── pages/           # Dashboard, Login, SignUp
│       │   └── hooks/           # Custom React hooks
│       └── dist/                # Production build output
├── supabase/
│   └── migrations/       # Database migrations (001, 002, 003)
├── docs/                 # Additional documentation
├── CURRENT_FEATURES.md   # Complete feature documentation
├── SUBFOLDER_MIGRATION.md # Migration instructions
├── PROJECT_PLAN.md       # Original roadmap
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
1. **Supabase Account**: Create at [supabase.com](https://supabase.com)
2. **Node.js**: Version 18+
3. **Database Setup**: Run migrations in Supabase SQL Editor

### Development Setup

```bash
# Navigate to web app
cd apps/web

# Install dependencies
npm install

# Setup environment variables
# Create .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key

# Run development server
npm run dev
```

### Production Build

```bash
cd apps/web
npm run build
# Output in: apps/web/dist/
```

See [SUBFOLDER_MIGRATION.md](./SUBFOLDER_MIGRATION.md) for database migration instructions.

## 🤝 Development Philosophy

- **User-First**: Every feature should reduce friction, not add it
- **AI as Assistant**: AI helps, never forces; user has final say
- **Fast & Beautiful**: Performance and design are equally important
- **Privacy-Focused**: User data is sacred, transparent practices

## 📞 Contact

Questions or suggestions? Open an issue or reach out!

---

Built with ❤️ and Claude AI
