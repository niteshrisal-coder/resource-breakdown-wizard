# QuantBreak - Construction Quantity Breakdown Application

## Overview

QuantBreak is a construction project management tool for tracking work items, resources, and rate analysis. It allows users to manage construction work quantities, define resource columns (like cement, sand, etc.), set resource constants per work item, and perform rate analysis with transportation cost calculations. The application supports CSV export and provides visual reports through charts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Build Tool**: Vite with React plugin
- **Drag & Drop**: @dnd-kit for sortable resource columns

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful API with typed route definitions in shared/routes.ts
- **Validation**: Zod schemas for input validation on both client and server

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: shared/schema.ts contains all table definitions
- **Migrations**: drizzle-kit for database migrations (output to ./migrations)

### Key Data Models
1. **Work Items**: Construction tasks with serial numbers, descriptions, units, and quantities
2. **Resource Columns**: Dynamic columns representing resources (cement, sand, etc.) with units and ordering
3. **Resource Constants**: Junction table linking work items to resources with constant values

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components including shadcn/ui
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route pages (dashboard, reports)
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code between client/server
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route type definitions
└── migrations/       # Database migrations
```

### API Design
Routes are defined in `shared/routes.ts` with full type safety:
- Work Items: CRUD operations at `/api/work-items`
- Resource Columns: CRUD + reordering at `/api/resource-columns`
- Resource Constants: Upsert at `/api/resource-constants`

### Build System
- Development: `tsx` for running TypeScript directly
- Production: Custom build script using Vite for frontend and esbuild for backend
- Output: Single bundled `dist/index.cjs` for server with `dist/public` for static assets

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### UI Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Recharts**: Data visualization for reports page
- **Lucide React**: Icon library
- **papaparse**: CSV export functionality

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner for enhanced Replit development experience