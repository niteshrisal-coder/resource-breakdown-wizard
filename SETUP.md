# Procurement Application Setup Guide

## Prerequisites
- Docker and Docker Compose (for running PostgreSQL)
- Node.js 18+ and npm

## Quick Start

### 1. Start the Database
```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432` with:
- Username: `postgres`
- Password: `postgres`
- Database: `procurement_db`

### 2. Create Database Tables
```bash
npm run db:push
```

This will create all necessary tables (work_items, resource_columns, resource_constants).

### 3. Start the Application
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### 4. View the Application
Once the dev server is running, open your browser and navigate to:
```
http://localhost:5000
```

The app will automatically seed sample data on first run.

## What You'll See

The application includes:
- **Dashboard**: View work items with resource calculations
- **Procurement**: Upload and manage procurement documents
- **Reports**: View analytics and reports

Sample data included:
- Work Items: Concrete Class A, Wall Plastering
- Resources: Cement, Sand, Gravel

## Environment Variables

The `.env` file is pre-configured for local development:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/procurement_db
PORT=5000
NODE_ENV=development
```

## Build for Production
```bash
npm run build
```

## Stopping the Database
```bash
docker-compose down
```

## Troubleshooting

### Database Connection Issues
- Ensure Docker is running: `docker ps`
- Check if postgres container is healthy: `docker-compose logs postgres`
- Verify database URL matches docker-compose settings

### Tables Not Created
- Run `npm run db:push` again
- Check for error messages in the console

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 5000

## Database Schema

### work_items
- id (primary key)
- serialNumber
- refSs
- description
- unit
- normsBasisQty
- actualMeasuredQty

### resource_columns
- id (primary key)
- name (e.g., "Cement")
- unit (e.g., "Bags")
- order

### resource_constants
- id (primary key)
- workItemId (foreign key)
- resourceColumnId (foreign key)
- constantValue (resource consumption per unit)
