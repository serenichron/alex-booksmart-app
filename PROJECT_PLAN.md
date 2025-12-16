# AI Bookmark Manager - Project Plan

## Project Overview
A versatile, AI-powered bookmark manager that saves anything (links, images, text, documents) with intelligent organization, content suggestions, and cross-platform support.

---

## 🎯 Core Value Proposition
- **Save Anything, Anywhere**: Web links, images, text clips, documents
- **AI Does the Heavy Lifting**: Auto-organization, summaries, connections
- **Context-Aware Modes**: Different behaviors for student, business, research, etc.
- **Content Discovery**: StumbleUpon-style suggestions based on your interests

---

## 🏗️ Tech Stack Recommendations (Free/Easy)

### Backend
- **Framework**: Node.js with Express (or Fastify for speed)
- **Database**:
  - **Supabase** (PostgreSQL + Auth + Storage + Real-time) - FREE tier is generous
  - Alternative: Firebase (easier but less control)
- **File Storage**: Supabase Storage or Cloudinary (free tier)
- **Vector Database**: Supabase with pgvector extension (for AI embeddings) - FREE

### Frontend (Web App)
- **Framework**: React with Vite (fast, modern)
- **UI Library**:
  - **Shadcn/ui** + Tailwind CSS (beautiful, customizable, free)
  - Alternative: MUI or Chakra UI
- **State Management**: Zustand (simple) or TanStack Query (for server state)
- **Masonry Layout**: react-masonry-css or @tanstack/react-virtual

### Browser Extension
- **Framework**: Same React code, packaged with CRXJS or WXT
- **Supports**: Chrome, Firefox, Edge (same codebase)

### Mobile App
- **Framework**: React Native with Expo (write once, iOS + Android)
- **UI**: React Native Paper or NativeBase

### AI Services
- **Primary AI**:
  - **Anthropic Claude** (best for understanding, summarization, organization)
    - Claude 3.5 Sonnet for most tasks
    - Claude Haiku for quick classifications
  - **OpenAI GPT-4o** as fallback/alternative

- **Embeddings** (for similarity/search):
  - **Voyage AI** (best quality, free tier)
  - Alternative: OpenAI text-embedding-3-small (cheaper)

- **Content Suggestions**:
  - Use embeddings + Claude for personalized recommendations
  - Web scraping: Puppeteer/Playwright for content fetching

### Hosting (Demo/MVP)
- **Backend**: Railway, Render, or Fly.io (all have free tiers)
- **Frontend**: Vercel or Netlify (free, auto-deploy from GitHub)
- **Database**: Supabase (free tier: 500MB database, 1GB storage)

---

## 📊 Data Architecture

### Core Objects

#### 1. **Bookmark**
```
- id
- user_id
- workspace_id (nullable for default workspace)
- type (link, image, text, document, video, etc.)
- title (AI-generated or user-provided)
- content (for text clips)
- url (for web content)
- file_url (for uploaded files)
- thumbnail_url
- summary (AI-generated)
- embedding (vector for similarity search)
- source_url (origin page)
- created_at
- last_accessed_at
- access_count
- is_favorite
- mode (which mode was active when saved)
```

#### 2. **Category**
```
- id
- user_id
- workspace_id
- name
- description
- parent_id (for subcategories)
- color
- icon
- mode (which mode this category belongs to)
```

#### 3. **Tag**
```
- id
- name
- user_id
- workspace_id
- color
```

#### 4. **Bookmark_Category** (many-to-many)
```
- bookmark_id
- category_id
- ai_suggested (boolean)
- confidence_score (how confident AI was)
```

#### 5. **Bookmark_Tag** (many-to-many)
```
- bookmark_id
- tag_id
```

#### 6. **Connection** (inter-bookmark relationships)
```
- id
- bookmark_id_1
- bookmark_id_2
- connection_type (similar_topic, related_content, sequence, etc.)
- strength (0-1, how related)
- ai_explanation (why they're connected)
```

#### 7. **Workspace**
```
- id
- name
- mode (student, business, research, etc.)
- owner_id
- is_collaborative
- settings (JSON for mode-specific configs)
```

#### 8. **User_Preference**
```
- user_id
- interests (array of topics)
- content_types_preference (what they like to save)
- discovery_settings (for content suggestions)
```

#### 9. **Suggested_Content** (discovery feed)
```
- id
- user_id
- url
- title
- description
- thumbnail
- reason (why suggested)
- shown_at
- interacted (viewed, bookmarked, dismissed)
```

---

## 🤖 AI Capabilities & Implementation

### 1. **Auto-Organization on Save**
**How it works:**
- When user saves a bookmark, send to Claude:
  - The bookmark content (title, url, selected text, image context)
  - User's existing categories
  - User's mode (student, business, etc.)
  - Recent bookmarks for context
- Claude suggests:
  - 2-3 most relevant categories
  - 3-5 relevant tags
  - Confidence score for each
- User sees suggestions, can accept or modify

**Implementation:**
```
API call to Claude with prompt:
"You're organizing bookmarks for a user in [MODE] mode.
Here's what they're saving: [CONTENT]
Their existing categories: [CATEGORIES]
Recent bookmarks: [RECENT]

Suggest the best categories and tags. Respond in JSON."
```

### 2. **Content Summarization**
**How it works:**
- Extract main content from webpage (using Readability.js or similar)
- Send to Claude for summarization
- Store 2 summaries:
  - **Quick summary** (1-2 sentences) for dashboard
  - **Detailed summary** (1 paragraph) for search
- Generate embedding from full content for similarity search

### 3. **Inter-Content Connections**
**How it works:**
- Batch process (nightly or every 100 new bookmarks):
  - Get embeddings for all bookmarks
  - Find similar embeddings (cosine similarity > 0.7)
  - For potential connections, ask Claude:
    "These two bookmarks might be related.
    Bookmark 1: [SUMMARY]
    Bookmark 2: [SUMMARY]
    Are they related? How? Rate connection strength 0-1."
- Store connections for cluster visualization

### 4. **Smart Search**
**How it works:**
- User types search query
- Convert query to embedding
- Search:
  - Vector similarity search (fast, finds semantic matches)
  - Full-text search on titles, tags, summaries
  - Rank combined results
- For top results, ask Claude to check actual content if needed
- Return ranked results with explanation of why they match

### 5. **Content Discovery Engine** (StumbleUpon-style)
**How it works:**

**Phase 1: Build User Profile**
- Analyze saved bookmarks (topics, types, sources)
- User explicitly sets interests
- Create embedding of user's interest profile

**Phase 2: Content Sourcing**
- Curate from:
  - RSS feeds (niche blogs, interesting sites)
  - Reddit (top posts from relevant subreddits)
  - Hacker News, Product Hunt, etc.
  - Web scraping interesting sites
  - User-submitted suggestions
- Store potential suggestions in database

**Phase 3: Personalized Ranking**
- For each user session:
  - Get content pool
  - Generate embeddings for content
  - Compare to user profile embedding
  - Ask Claude to filter/rank top matches
  - Present in masonry layout
- Track interactions (view time, bookmark, dismiss)
- Learn and improve suggestions

**Implementation:**
```
Background job:
1. Fetch interesting content from sources
2. Summarize with Claude
3. Generate embeddings
4. Store in suggested_content table

On user opens Discovery:
1. Get user profile embedding
2. Find top 50 similar content
3. Ask Claude to personalize/rank
4. Display with variety (mix topics, types)
5. Track interactions
6. Update user profile
```

---

## 🎨 Modes & Behavior

### Suggested Modes

1. **Student Mode**
   - Categories: Courses, Research, References, Assignments
   - UI: Clean, minimal, study-focused colors
   - Discovery: Educational content, tutorials, papers
   - Auto-tag: Course names, topics, professors

2. **Business Mode**
   - Categories: Clients, Projects, Competitors, Resources
   - UI: Professional, dark theme option
   - Discovery: Industry news, tools, case studies
   - Auto-tag: Company names, industries, tools

3. **Research Mode**
   - Categories: Papers, Data, Sources, Literature Review
   - UI: Dense info display, citation support
   - Discovery: Academic papers, research blogs
   - Auto-tag: Authors, journals, methodologies

4. **Creative Mode**
   - Categories: Inspiration, References, Tutorials, Projects
   - UI: Visual-heavy, colorful, masonry-first
   - Discovery: Design, art, photography, creative work
   - Auto-tag: Styles, mediums, artists

5. **Developer Mode**
   - Categories: Libraries, Documentation, Code Snippets, Tutorials
   - UI: Code-friendly, syntax highlighting
   - Discovery: GitHub, dev blogs, Stack Overflow gems
   - Auto-tag: Languages, frameworks, concepts

6. **Personal Mode**
   - Categories: Recipes, Travel, Shopping, Hobbies
   - UI: Casual, warm colors, relaxed
   - Discovery: Lifestyle content, DIY, recommendations
   - Auto-tag: Locations, hobbies, brands

### Mode Switching
- User can have multiple workspaces, each with its own mode
- Quick switch in header dropdown
- Each workspace has independent organization

---

## 📱 Platform-Specific Features

### Web App
- Full dashboard with masonry layout
- Drag-and-drop organization
- Bulk operations (select multiple, move, tag)
- Advanced search filters
- Workspace management
- Settings & preferences

### Browser Extension
- **Toolbar Icon**: Quick save current page
- **Right-click Menu**:
  - "Bookmark this link"
  - "Bookmark this image"
  - "Bookmark this text" (when text selected)
- **Popup**: Shows recent bookmarks, quick search
- **Sidebar** (optional): Browse while surfing
- AI suggestion appears immediately: "Save to: [Category]?"

### Mobile App
- **Share Target**: Share from any app to bookmark manager
- **Text Selection**: Long-press text → Share → Bookmark
- **Camera Integration**: Take photo → Auto-bookmark
- **Widget**: Recent bookmarks on home screen
- **Offline Mode**: Queue saves, sync when online

---

## 🔧 Development Roadmap

### Phase 1: Foundation (Weeks 1-3)
**Goal: Working web app with basic save/organize**

1. **Setup**
   - Initialize repo structure (monorepo with pnpm workspaces)
   - Setup Supabase (database, auth, storage)
   - Setup React app with Vite
   - Design database schema
   - Setup CI/CD (GitHub Actions → Vercel)

2. **Core Features**
   - User authentication (email, Google, GitHub)
   - Save bookmark (URL input, manual add)
   - Display bookmarks (simple list)
   - Basic categorization (create, assign)
   - Basic tagging

3. **AI Integration - Basic**
   - Setup Claude API
   - Auto-generate titles from URLs
   - Simple category suggestion
   - Basic summarization

**Deliverable**: Web app where you can save & organize bookmarks with AI help

---

### Phase 2: Smart Features (Weeks 4-6)
**Goal: Make AI shine**

1. **Advanced AI**
   - Implement embeddings (Voyage AI)
   - Vector search (Supabase pgvector)
   - Inter-content connections
   - Improved organization suggestions
   - Context-aware summaries

2. **Dashboard**
   - Masonry layout
   - Sections: Recent, Favorites, By Category, By Tag
   - Filter & sort
   - Quick actions (favorite, delete, move)

3. **Search**
   - Full-text search
   - Vector semantic search
   - Filters (type, category, date range)
   - Search suggestions

**Deliverable**: Smart, beautiful web app with AI-powered organization & search

---

### Phase 3: Browser Extension (Weeks 7-8)
**Goal: Capture anything from the web**

1. **Extension Development**
   - Setup WXT (or CRXJS) framework
   - Share React components with web app
   - Implement context menus
   - Implement toolbar popup
   - Test on Chrome, Firefox, Edge

2. **Capture Features**
   - Full page bookmark (title, URL, screenshot)
   - Image bookmark (right-click)
   - Text selection bookmark
   - Instant AI suggestions
   - Visual feedback

**Deliverable**: Browser extension on Chrome Web Store

---

### Phase 4: Content Discovery (Weeks 9-10)
**Goal: StumbleUpon-style content suggestions**

1. **Content Sourcing**
   - Setup RSS feed aggregator
   - Integrate Reddit API
   - Hacker News API
   - Web scraping (Puppeteer)
   - Content processing pipeline

2. **Discovery Engine**
   - User profile builder (from saved bookmarks)
   - Content matching algorithm
   - Personalization with Claude
   - Discovery UI (masonry, sections)
   - Interaction tracking

3. **Learning Loop**
   - Track what users bookmark from Discovery
   - Update user profiles
   - Improve suggestions over time

**Deliverable**: Working Discovery tab with personalized content suggestions

---

### Phase 5: Modes & Workspaces (Weeks 11-12)
**Goal: Multi-context support**

1. **Workspace System**
   - Create/switch workspaces
   - Mode selection per workspace
   - Mode-specific UI themes
   - Mode-specific AI behavior
   - Data isolation between workspaces

2. **Mode Implementations**
   - Create 4-6 mode presets
   - Custom category templates per mode
   - Custom AI prompts per mode
   - Custom discovery sources per mode

**Deliverable**: Full multi-workspace, multi-mode support

---

### Phase 6: Collaboration (Weeks 13-14)
**Goal: Team features**

1. **Sharing**
   - Share individual bookmarks (public link)
   - Share collections
   - Share to social media (preview cards)

2. **Collaboration**
   - Invite users to workspace
   - Role-based permissions (owner, editor, viewer)
   - Activity feed (who added what)
   - Comments on bookmarks

**Deliverable**: Full sharing & collaboration

---

### Phase 7: Mobile App (Weeks 15-18)
**Goal: Save on the go**

1. **React Native Setup**
   - Setup Expo
   - Share types/API client with web app
   - Design mobile UI

2. **Core Features**
   - Auth
   - Browse bookmarks
   - Search
   - Basic save

3. **Mobile-Specific**
   - Share target integration
   - Text selection sharing
   - Camera integration
   - Offline queue
   - Push notifications

**Deliverable**: iOS & Android apps in stores

---

## 🚧 Potential Challenges & Solutions

### Challenge 1: AI Costs
**Problem**: API calls for every bookmark can get expensive
**Solutions**:
- Use Claude Haiku for simple tasks (cheap)
- Batch processing for connections (nightly)
- Cache common queries
- Rate limiting per user tier
- Only summarize on-demand for older bookmarks

### Challenge 2: Content Extraction
**Problem**: Some websites block scraping, have paywalls, dynamic content
**Solutions**:
- Use Readability.js for client-side extraction (in extension)
- Fallback to meta tags (og:description, etc.)
- For failed extractions, save what user selected/provided
- Let users edit summaries

### Challenge 3: Browser Extension Permissions
**Problem**: Users worry about privacy with broad permissions
**Solutions**:
- Request minimal permissions
- Clear privacy policy
- Open source the extension
- Explain what data is captured and why

### Challenge 4: Content Discovery Quality
**Problem**: Hard to match StumbleUpon's quality
**Solutions**:
- Start with high-quality sources (curated lists)
- Heavy AI filtering (Claude decides what's interesting)
- User feedback (thumbs up/down)
- Community submission (users suggest sites)
- Gradual improvement through ML

### Challenge 5: Database Costs (embeddings)
**Problem**: Vector embeddings take storage space
**Solutions**:
- Use Supabase pgvector (free tier: 500MB)
- Only embed bookmarks with meaningful content
- Use smaller embedding models (384 dimensions vs 1536)
- Archive old embeddings

### Challenge 6: Real-time Sync
**Problem**: Changes in web app should appear in extension/mobile
**Solutions**:
- Supabase real-time subscriptions (free)
- WebSocket fallback
- Optimistic updates in UI
- Background sync on mobile

---

## ✨ What You Might Have Missed (My Suggestions)

### 1. **Smart Collections**
Auto-generated collections based on AI analysis:
- "Reading List" - long-form articles you saved
- "Visual Inspiration" - all images and designs
- "Need to Review" - bookmarks you haven't opened in 30 days
- "Trending in My Network" - what others in your workspace saved

### 2. **Time-based Organization**
AI notices patterns:
- "You usually save cooking recipes on weekends"
- "Work-related bookmarks Monday-Friday"
- Adjust Discovery feed based on time/day

### 3. **Duplicate Detection**
Before saving, check:
- Same URL already saved?
- Similar content already saved? (via embeddings)
- Suggest merging or show existing bookmark

### 4. **Bookmark Health**
AI checks periodically:
- Is the link still working? (404 detection)
- Has the content changed significantly?
- Suggest archiving/updating

### 5. **Export & Backup**
- Export to HTML (like traditional bookmarks)
- Export to Notion, Obsidian, etc.
- Automated backups
- Import from browser bookmarks, Pocket, Pinterest

### 6. **Keyboard Shortcuts**
Power users will love:
- `B` - Quick save current page
- `S` - Quick search
- `D` - Open Discovery
- `/` - Command palette
- Arrow keys for navigation

### 7. **Browser Integration**
- Replace browser's default bookmark manager
- Sync with browser bookmarks (optional)
- Custom new tab page with your bookmarks

### 8. **Analytics for Nerds**
Personal analytics dashboard:
- How many bookmarks saved this month?
- Most used categories
- Saving patterns (time, type)
- Word cloud of topics
- Network graph of connections

### 9. **Reading Mode Integration**
- When saving an article, offer "Read Now" vs "Save for Later"
- Built-in reader view (like Pocket)
- Text-to-speech for articles
- Progress tracking (where you left off)

### 10. **Email Integration**
- Email yourself bookmarks: save@yourbookmarkapp.com
- Weekly digest: "Your week in bookmarks"
- Discovery newsletter: "Here's what we found for you"

---

## 💰 Monetization Ideas (Future)

1. **Free Tier**
   - 500 bookmarks
   - Basic AI features
   - 1 workspace

2. **Pro Tier** ($5-8/month)
   - Unlimited bookmarks
   - Advanced AI (more suggestions, better connections)
   - Unlimited workspaces
   - Priority support
   - Custom modes

3. **Team Tier** ($15-20/user/month)
   - Everything in Pro
   - Collaborative workspaces
   - Team analytics
   - Admin controls
   - SSO

4. **Enterprise**
   - Self-hosted option
   - Custom AI training
   - Integration with company tools
   - Dedicated support

---

## 🎯 Success Metrics

### For MVP (Phase 1-2)
- User can save 10 bookmarks in under 2 minutes
- AI suggestion accuracy > 70% (user accepts)
- Search finds relevant bookmarks in < 1 second
- App loads in < 2 seconds

### For Full Launch (Phase 7)
- User saves 50+ bookmarks in first month
- 60%+ of users return weekly (retention)
- 30%+ of users try Discovery feature
- AI accuracy > 85%
- Discovery → Bookmark conversion > 15%

---

## 🚀 Quick Start (Next Steps)

1. **Today**: Review this plan, discuss, adjust
2. **Tomorrow**: Set up Supabase account, design database schema
3. **Day 3**: Initialize repo structure, install dependencies
4. **Day 4**: Start building authentication
5. **Day 5**: First bookmark save functionality

---

## 🤝 Working Together

Since you're a low-code designer:
- I'll handle the technical implementation
- You focus on UX/UI design and user flows
- We'll iterate quickly with prototypes
- You test, I fix
- We'll use tools like Figma for designs, then I'll implement

**Communication style:**
- I'll explain concepts as "objects" and "flows", not code
- I'll show you visual examples
- We'll use analogies and diagrams
- Questions are always welcome!

---

Ready to start building? Let me know what you think about this plan, and what you'd like to adjust! 🚀
