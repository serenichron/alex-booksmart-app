# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Web App     │  Browser Extension  │  Mobile App  │ Desktop │
│  (React)     │  (React + WXT)      │ (RN + Expo)  │ (Later) │
└────────┬─────────────────┬──────────────────┬──────────────┘
         │                 │                  │
         └─────────────────┴──────────────────┘
                          │
                    [API Gateway]
                          │
┌─────────────────────────┴─────────────────────────┐
│                  BACKEND LAYER                     │
├────────────────────────────────────────────────────┤
│  Node.js API Server (Express/Fastify)             │
│  ┌──────────────┬──────────────┬────────────────┐ │
│  │ Auth Service │ Bookmark API │ Discovery API  │ │
│  │              │              │                │ │
│  │ User Mgmt    │ Categories   │ Content Source │ │
│  │ Workspaces   │ Tags         │ Personalization│ │
│  │ Permissions  │ Search       │ Ranking        │ │
│  └──────────────┴──────────────┴────────────────┘ │
└────────────────────────────────────────────────────┘
         │                 │                  │
         └─────────────────┴──────────────────┘
                          │
┌─────────────────────────┴─────────────────────────┐
│                   DATA LAYER                       │
├────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                             │
│  ┌──────────────────────────────────────────────┐ │
│  │ • Users, Workspaces, Bookmarks              │ │
│  │ • Categories, Tags, Connections              │ │
│  │ • Vector embeddings (pgvector)               │ │
│  │ • Full-text search                           │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Supabase Storage                                  │
│  ┌──────────────────────────────────────────────┐ │
│  │ • Uploaded images, documents                 │ │
│  │ • Screenshots, thumbnails                    │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴─────────────────────────┐
│                 AI/ML LAYER                        │
├────────────────────────────────────────────────────┤
│  Anthropic Claude API                              │
│  ┌──────────────────────────────────────────────┐ │
│  │ • Content summarization                      │ │
│  │ • Category/tag suggestions                   │ │
│  │ • Connection analysis                        │ │
│  │ • Search query understanding                 │ │
│  │ • Content ranking                            │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  Voyage AI (Embeddings)                            │
│  ┌──────────────────────────────────────────────┐ │
│  │ • Convert content to vectors                 │ │
│  │ • Semantic similarity search                 │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴─────────────────────────┐
│              BACKGROUND JOBS                       │
├────────────────────────────────────────────────────┤
│  • Content fetching (RSS, Reddit, HN)             │
│  • Embedding generation (batch)                    │
│  • Connection discovery (nightly)                  │
│  • Link health checks                              │
│  • Thumbnail generation                            │
└────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Saving a Bookmark

```
User selects text on webpage (Extension)
         ↓
Extension sends to API:
  - Selected text
  - Source URL
  - Page title
  - User's current mode
         ↓
API receives request
         ↓
API calls Claude:
  "Suggest categories and tags for this content"
         ↓
Claude analyzes and responds:
  {
    categories: ["Research", "AI"],
    tags: ["machine-learning", "embeddings"],
    summary: "Article about vector embeddings..."
  }
         ↓
API saves to database:
  - Bookmark record
  - Category associations
  - Tags
         ↓
Background job (async):
  - Generate embedding (Voyage AI)
  - Save embedding to pgvector
  - Generate thumbnail
         ↓
API returns to extension:
  {
    success: true,
    bookmark_id: "123",
    suggested_categories: [...],
    suggested_tags: [...]
  }
         ↓
Extension shows success notification:
  "Saved to Research → AI ✓"
         ↓
Real-time update via Supabase:
  Web app updates dashboard automatically
```

### Example 2: Discovery Feed

```
User opens Discovery tab
         ↓
Web app requests: GET /api/discovery/feed
         ↓
API retrieves:
  - User's bookmark history
  - User's explicit interests
  - User's interaction patterns
         ↓
API builds user profile:
  - Analyze topics from bookmarks
  - Weight by recency & frequency
  - Generate profile summary
         ↓
API queries suggested_content table:
  - Filter by not-yet-shown
  - Get 100 candidates
         ↓
API generates embeddings for profile
         ↓
API runs vector similarity search:
  - Find top 50 similar content
  - Mix content types (links, images, articles)
         ↓
API calls Claude for final ranking:
  "Given this user profile and these 50 items,
   rank them by how interesting they'd find each.
   Ensure variety and surprise."
         ↓
Claude returns ranked list with reasons
         ↓
API returns top 20 items to web app
         ↓
Web app displays in masonry layout
         ↓
User interacts (views, bookmarks, dismisses)
         ↓
Web app sends interaction events to API
         ↓
API updates user profile & learning model
         ↓
Next request: Improved suggestions!
```

### Example 3: Smart Search

```
User types: "articles about AI for designers"
         ↓
Web app sends: GET /api/search?q=...
         ↓
API processes query:
  1. Generate embedding for query (Voyage AI)
  2. Run vector similarity search (pgvector)
     - Finds semantically similar bookmarks
  3. Run full-text search (PostgreSQL)
     - Finds keyword matches
         ↓
API gets combined results (~50 items)
         ↓
API calls Claude:
  "These are search results for '[query]'.
   Some may not be relevant. Filter and rank them.
   Explain why each matches."
         ↓
Claude returns:
  [
    {
      bookmark_id: 123,
      relevance: 0.95,
      reason: "Directly discusses AI tools for designers"
    },
    ...
  ]
         ↓
API returns top 20 results to web app
         ↓
Web app displays with relevance explanations:
  "This matches because: [reason]"
```

## Key Design Decisions

### 1. Why Supabase?
- **All-in-one**: Database, auth, storage, real-time in one service
- **PostgreSQL**: Full-featured SQL database (not NoSQL limitations)
- **pgvector**: Native vector search for embeddings
- **Free tier**: Generous for demos and MVP
- **Easy setup**: No DevOps complexity

### 2. Why Claude over GPT?
- **Better understanding**: Claude excels at nuanced content analysis
- **Longer context**: Can process more content at once
- **Instruction following**: More reliable for structured outputs
- **Use both**: GPT-4o as fallback, different strengths

### 3. Why Monorepo (pnpm workspaces)?
- **Code sharing**: UI components, types, API client shared across apps
- **Consistent versions**: All apps use same dependencies
- **Easier refactoring**: Change shared code, all apps update
- **Single CI/CD**: Build and deploy everything together

### 4. Why React Native over Flutter?
- **Code reuse**: Share logic (not UI) with web app
- **Same language**: JavaScript/TypeScript everywhere
- **Expo**: Makes mobile development much easier
- **Your expertise**: As web designer, React more familiar

### 5. Why Vector Embeddings?
- **Semantic search**: Find similar content even with different words
  - User searches "ML algorithms" → finds "machine learning models"
- **Content connections**: Automatically find related bookmarks
- **Personalization**: Match user interests to content numerically
- **Scalability**: Fast similarity search even with 100k+ bookmarks

### 6. Why Background Jobs?
- **Speed**: User gets instant response, heavy work happens later
- **Cost**: Batch AI calls are more efficient
- **Reliability**: Jobs can retry if they fail
- **Resource management**: Don't overload API during peak times

## Security Considerations

### Authentication
- Supabase Auth handles:
  - Password hashing (bcrypt)
  - JWT token generation
  - OAuth (Google, GitHub)
  - Session management
- Row-Level Security (RLS) in database:
  - Users can only see their own bookmarks
  - Workspace permissions enforced at DB level

### Data Privacy
- No third-party tracking
- AI processing: Content sent to Claude/OpenAI (encrypted in transit)
- Option to self-host for sensitive data
- Clear privacy policy

### Extension Security
- Minimal permissions requested
- Content script only on user action
- No analytics/tracking code
- Open source for transparency

## Performance Optimization

### Frontend
- **Lazy loading**: Load bookmarks as user scrolls
- **Virtualization**: Render only visible items
- **Image optimization**: Thumbnails, lazy load images
- **Caching**: Cache recent searches, user preferences

### Backend
- **Database indexes**: On user_id, category_id, created_at, embeddings
- **Query optimization**: Use joins, avoid N+1 queries
- **Caching**: Redis for frequent queries (optional, later)
- **CDN**: Serve static assets (images, thumbnails) from CDN

### AI Calls
- **Batch processing**: Process multiple bookmarks at once
- **Smart prompts**: Minimize token usage
- **Caching**: Cache AI responses for similar content
- **Rate limiting**: Prevent abuse

## Scalability Path

### Phase 1 (MVP): 100-1000 users
- Supabase free tier
- Single API server (Render/Railway)
- No caching needed
- Costs: ~$0-20/month

### Phase 2 (Growth): 1000-10,000 users
- Upgrade Supabase to Pro ($25/mo)
- Multiple API servers (load balancer)
- Redis caching
- Background job queue (Bull/BullMQ)
- Costs: ~$100-200/month

### Phase 3 (Scale): 10,000+ users
- Dedicated database (or Supabase Enterprise)
- Kubernetes for auto-scaling
- CDN for all static assets
- Separate embedding service
- Monitoring & alerting (Sentry, DataDog)
- Costs: $500-2000+/month

## Tech Stack Cheat Sheet

| Component | Technology | Why? |
|-----------|-----------|------|
| **Frontend** | React + Vite | Fast, modern, great DX |
| **Styling** | Tailwind + shadcn/ui | Beautiful, customizable, fast |
| **State** | Zustand | Simple, no boilerplate |
| **Backend** | Node.js + Express | JavaScript everywhere, fast |
| **Database** | PostgreSQL (Supabase) | Powerful, vector support |
| **Auth** | Supabase Auth | Built-in, secure |
| **Storage** | Supabase Storage | Integrated, easy |
| **AI Brain** | Claude (Anthropic) | Best understanding |
| **Embeddings** | Voyage AI | High quality, free tier |
| **Extension** | WXT framework | Multi-browser, easy |
| **Mobile** | React Native + Expo | Cross-platform, JS |
| **Hosting** | Vercel + Render | Easy deploys, free tiers |

---

Ready to dive into implementation? Let's start with the foundation! 🏗️
