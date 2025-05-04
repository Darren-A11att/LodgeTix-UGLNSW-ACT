# LodgeTix-UGLNSW-ACT

## Ticketing System for Masonic Event Registration

This repository contains the source code for the LodgeTix ticketing system, designed for managing registrations for Masonic events.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Darren-A11att/LodgeTix-UGLNSW-ACT)

## Recent Fixes

### Fallback Implementation for Ticket Availability

The system now handles database schema transitions gracefully:

1. **Mock Data for Non-existent Tables**:
   - Fallback mechanism in `getTicketAvailability` when tables don't exist
   - Deterministic mock data generation for consistent values in development
   - Logging of fallback usage to help during migration

2. **Event ID Normalization**:
   - Fixed issue with `event-1` placeholder IDs
   - Added SQL function `normalize_event_id` to handle various ID formats
   - Updated UniformTicketing component to use real event IDs when available

3. **Component Prop Integration**:
   - Added missing props to TicketSelection component in RegisterPage
   - Implemented handlers for `selectTicket`, `applyTicketToAllAttendees`, and `toggleUniformTicketing`
   - Fixed issue with attendee ticket updates

4. **Error Handling**:
   - Added additional error logging for debugging
   - Multiple fallback layers for graceful degradation
   - localStorage tracking of ticket requests for monitoring

## Database Migration Path

The system now has a clear path for transitioning to the new database schema:

1. **Phase 1: Client-side Fallbacks**
   - Mock implementations handle missing database functionality
   - Application remains functional during migration

2. **Phase 2: Database Schema Creation**
   - New migration scripts create required tables and functions
   - Data initialization for existing events

3. **Phase 3: Transition to Real Data**
   - System automatically uses real data when available
   - No code changes needed to switch from mock to real implementations

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. For HTTPS (required for Stripe integration):
   ```bash
   npm run dev:https
   ```

## Database Setup

To apply the database migrations:

1. Navigate to the Supabase project dashboard
2. Go to SQL Editor
3. Run the migration scripts in order:
   - `20250515000000_create_event_capacity_table.sql`
   - `20250515100000_add_id_normalization_function.sql`
   - `20250516000000_initialize_event_capacity_data.sql`

## Technology Stack

- React with TypeScript
- Vite for fast development
- Supabase for backend and database
- Tailwind CSS for styling
- Stripe for payment processing