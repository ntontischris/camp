# CampWise

Intelligent camp scheduling platform for the Greek market.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📚 Documentation

- [PROJECT-BRIEF.md](PROJECT-BRIEF.md) - Complete project specifications
- [CLAUDE.md](CLAUDE.md) - Guide for Claude Code
- [ROADMAP.md](ROADMAP.md) - Development roadmap
- [TASKS.md](TASKS.md) - Current tasks
- [DECISIONS.md](DECISIONS.md) - Technical decisions
- [docs/](docs/) - Detailed documentation
  - [DATABASE.md](docs/DATABASE.md) - Database schema
  - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
  - [FEATURES.md](docs/FEATURES.md) - Feature specifications
  - [CONSTRAINTS.md](docs/CONSTRAINTS.md) - Constraint system
  - [API.md](docs/API.md) - API documentation
  - [UI-SPECS.md](docs/UI-SPECS.md) - UI specifications

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** TailwindCSS, shadcn/ui
- **State:** Zustand, TanStack Query
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Scheduling:** Google OR-Tools (Python)
- **Forms:** React Hook Form, Zod
- **Date/Time:** date-fns

## 📁 Project Structure

```
campwise/
├── docs/              # Documentation
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   │   ├── ui/        # Base UI components (shadcn/ui)
│   │   ├── layout/    # Layout components
│   │   ├── calendar/  # Calendar/schedule components
│   │   ├── forms/     # Form components
│   │   └── ...
│   ├── lib/           # Utilities and libraries
│   │   ├── supabase/  # Supabase client
│   │   ├── scheduling/# Scheduling engine
│   │   └── utils/     # Helper functions
│   ├── hooks/         # Custom React hooks
│   ├── stores/        # Zustand stores
│   ├── types/         # TypeScript types
│   └── styles/        # Global styles
├── public/            # Static assets
└── supabase/          # Supabase migrations & functions
```

## 🔧 Development

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase account (for database)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

### Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run format       # Format code with Prettier
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to `.env.local`
3. Run migrations:

```bash
cd supabase
supabase db push
```

## 🎯 Development Phases

### Phase 1: Foundation (Weeks 1-2) ✅ In Progress
- [x] Project setup
- [x] Next.js + TypeScript
- [x] TailwindCSS + shadcn/ui
- [ ] Authentication
- [ ] Organization management

### Phase 2: Core Entities (Weeks 3-4)
- [ ] Sessions, Groups, Activities
- [ ] Facilities, Staff
- [ ] Manual scheduling

### Phase 3: Auto-Scheduling (Weeks 5-6)
- [ ] Constraint system
- [ ] OR-Tools integration
- [ ] Schedule generation

### Phase 4: Polish & Launch (Weeks 7-8)
- [ ] Export (PDF, Excel)
- [ ] Reports
- [ ] First customer launch

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Developed for the Greek camp market.

---

**Status:** 🟢 Phase 1 in progress
**Next:** Setup Supabase and authentication
