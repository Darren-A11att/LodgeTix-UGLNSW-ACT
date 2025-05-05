# LodgeTix-UGLNSW-ACT

## Ticketing System for Masonic Event Registration

This repository contains the source code for the LodgeTix ticketing system, designed for managing registrations for Masonic events.

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/Darren-A11att/LodgeTix-UGLNSW-ACT)

## Project Structure

The application is organized into three main areas:

```
/src        - Public-facing website (event discovery, registration)
/app        - Authenticated user portal (manage tickets, profile)
/admin      - Admin portal (event management, registrations, reporting)
/shared     - Shared components, types, and utilities
/supabase   - Database migrations and Supabase edge functions
```

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
   npm run dev         # Run public website
   npm run dev:admin   # Run admin portal
   ```

3. For HTTPS (required for Stripe integration):
   ```bash
   npm run dev:https         # Public website with HTTPS
   npm run dev:admin:https   # Admin portal with HTTPS
   ```

4. Building for production:
   ```bash
   npm run build:all   # Build both public and admin portals
   npm run build       # Build only public website
   npm run build:admin # Build only admin portal
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

## Admin Portal

The Admin Portal provides event organizers with comprehensive tools to manage events, registrations, and customers:

### Features

- **Dashboard:** Quick overview of events, registrations, and revenue
- **Event Management:** Create, edit, and manage events and ticket types
- **Registration Management:** View and process registrations and attendees
- **Customer Management:** Manage customer profiles and orders
- **User Management:** Configure admin users and permissions
- **Reporting:** Generate and export reports on sales and attendance

### Access Control

- Admin Portal uses role-based access control through Supabase
- Admin users are managed in the `user_roles` table with the role 'admin'
- Protected routes restrict access to authenticated admin users only

To access the Admin Portal locally:
- Start the admin development server: `npm run dev:admin`
- Access it at http://localhost:5174/admin

## Multi-Subdomain Architecture

LodgeTix is built with a multi-subdomain architecture for different user roles:

- **Main Domain** (`www.domain.tld`): Public-facing website and event listings
- **Attendee Portal** (`app.domain.tld`): For registered attendees to manage tickets
- **Admin Portal** (`admin.domain.tld`): For event organizers and administrators

### Local Development Setup

To develop locally with subdomain support:

1. Add the following to your hosts file:
   ```
   127.0.0.1 localhost app.localhost admin.localhost
   ```

2. Run the development server with the host flag:
   ```
   npm run dev:local
   ```

3. Access the different portals:
   - Main site: http://localhost:3000
   - Attendee portal: http://app.localhost:3000
   - Admin portal: http://admin.localhost:3000

### Build Instructions

To build all portals for production:

```
npm run build:all
```

This will create separate builds for each portal in the `dist` directory:
- Main site: `dist/`
- Attendee portal: `dist/app/`
- Admin portal: `dist/admin/`

### Production Deployment

For production, you'll need to:

1. Configure DNS to point each subdomain to your server
2. Set up server routing to serve the appropriate build directory based on the subdomain
3. Configure SSL certificates for all subdomains

#### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name domain.tld www.domain.tld;
    
    root /path/to/dist;
    # Main site configuration
}

server {
    listen 80;
    server_name app.domain.tld;
    
    root /path/to/dist/app;
    # Attendee portal configuration
}

server {
    listen 80;
    server_name admin.domain.tld;
    
    root /path/to/dist/admin;
    # Admin portal configuration
}
```