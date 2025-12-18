# BookSmart - AI Bookmark Manager

> Save anything, organize effortlessly, discover endlessly.

An AI-powered bookmark manager that helps you save, organize, and discover content across the web with intelligent automation.

## ✨ Key Features

- 📚 **Save Anything**: Web links, images, text clips, documents
- 🤖 **AI Organization**: Automatic categorization, tagging, and summarization
- 🔍 **Smart Search**: Semantic search that understands what you mean
- 🕸️ **Content Connections**: Discover relationships between your bookmarks
- 🎯 **Mode-Based**: Different behaviors for student, business, research contexts
- 🌟 **Discovery Engine**: StumbleUpon-style content suggestions
- 🚀 **Cross-Platform**: Web app, browser extension, mobile app

## 🗂️ Project Status

Currently in **Phase 1: Foundation** (71% complete) - see [PROJECT_PLAN.md](./PROJECT_PLAN.md) for detailed roadmap.

### ✅ What's Working Now
- **Authentication**: Email/password and Google OAuth
- **Bookmark Management**: Save URLs and text snippets with automatic metadata fetching
- **Modern Dashboard**: Beautiful UI with stats, categories, and tags
- **Performance Optimized**: Pagination, caching, infinite scroll, lazy loading
  - 80-90% faster page loads (< 500ms)
  - Smooth scrolling with 1000+ bookmarks
  - Instant board switching with prefetching

### 🚧 In Progress
- Database migration (currently using localStorage)
- AI-powered auto-categorization
- Search functionality

See [FEATURES_COVERAGE.md](./FEATURES_COVERAGE.md) for detailed implementation status.

## 📋 Documentation

- [Project Plan](./PROJECT_PLAN.md) - Full development roadmap and architecture
- [Architecture Overview](./ARCHITECTURE.md) - System design, data flow, and performance optimizations
- [Features Coverage](./FEATURES_COVERAGE.md) - Detailed implementation status and gaps analysis
- [Getting Started](./GETTING_STARTED.md) - Setup instructions and development guide
- [Tech Stack](./docs/TECH_STACK.md) - Technologies and why we chose them (coming soon)
- [API Documentation](./docs/API.md) - Backend API reference (coming soon)

## 🏗️ Repository Structure

```
alex-via-tr-app/
├── apps/
│   ├── web/              # Web application (React + Vite)
│   ├── extension/        # Browser extension
│   ├── mobile/           # React Native mobile app
│   └── desktop/          # Desktop app (future)
├── packages/
│   ├── ui/               # Shared UI components
│   ├── api-client/       # API client library
│   ├── types/            # Shared TypeScript types
│   └── ai/               # AI utilities (Claude, embeddings)
├── services/
│   └── api/              # Backend API (Node.js + Express)
├── docs/                 # Documentation
└── scripts/              # Build and deployment scripts
```

## 🚀 Quick Start (Coming Soon)

```bash
# Clone the repo
git clone <repo-url>

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Run development server
pnpm dev
```

## 🤝 Development Philosophy

- **User-First**: Every feature should reduce friction, not add it
- **AI as Assistant**: AI helps, never forces; user has final say
- **Fast & Beautiful**: Performance and design are equally important
- **Privacy-Focused**: User data is sacred, transparent practices

## 📞 Contact

Questions or suggestions? Open an issue or reach out!

---

Built with ❤️ and Claude AI
