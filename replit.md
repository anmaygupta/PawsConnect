# Overview

This is a modern web application called "Paw Finder" (also called "PawsConnect") designed to help reunite lost cats and dogs with their families. The platform allows users to report lost or found pets, search for reports by location, and facilitate communication between pet owners and finders. Built with a full-stack TypeScript architecture using React for the frontend and Express.js for the backend.

# Recent Changes (November 25, 2025)

- **Report Detail Page**: Full-page view when clicking on any pet report
  - Large image display with thumbnail gallery for multiple photos
  - Pet Details section (color, size, age, gender) with colored icon badges
  - Location & Time section showing where/when pet was lost or found
  - Full description display
  - Reward section for lost pets
  - Contact Information section with clickable email/phone links
  - Edit/Delete buttons visible only to report owners
  - Back button to return to search results
- **Clickable Report Cards**: Search results now navigate to full detail view when clicked
- **Report Edit/Delete Functionality**: Complete implementation with ownership verification
  - Edit modal allows updating pet name, breed, age, color, size, gender, description, location, ZIP code, and contact info
  - Delete confirmation dialog with warning message
  - Only report owners see edit/delete buttons on their own reports
  - Comprehensive server-side validation: enforces required fields (description, color, location, ZIP, size, email), validates enums, prevents invalid data
  - Frontend displays server validation error messages via toast notifications
- **Flexible Contact Requirements**: Updated contact information handling
  - Email address is mandatory for all reports
  - Name and phone are optional with "Prefer not to share" checkboxes
  - Database schema updated: contactName and contactPhone columns now nullable

# Previous Changes (November 24, 2025)

- **Critical Security Enhancements**: Complete security audit and hardening implemented
  - **Data Privacy**: User email addresses completely protected - only display names (firstName + lastName from Google) shown publicly on reports and stories
  - **OAuth CSRF Protection**: Google OAuth flow secured with automatic state parameter generation and validation to prevent CSRF attacks
  - **Session CSRF Protection**: Added `sameSite: 'lax'` cookie attribute to prevent cross-site request forgery on authenticated actions
  - **PublicUser Type**: Created new type to exclude sensitive fields from public API responses
- **Reward Field Enhancement**: Reward amount field now only visible for lost pet reports with disclaimer "(Transactions are not made through Paw Finder)"; reports display "(No reward if found)" when amount is $0 or not specified
- **Success Stories Feature**: Enhanced Facebook-style success stories page with comprehensive multimedia support
  - **5-Paw Rating System**: Replaced star ratings with PawPrint icons (5-paw scale) matching the pet theme throughout the interface
  - **Multi-Image Upload**: Story submission supports up to 5 images with previews and individual remove functionality
  - **Story Images Database**: Created `story_images` table with cascade delete, storing image metadata (imageUrl, fileName, fileSize)
  - **Pagination**: Shows 3 initial stories with "View More" button to reveal all stories
  - **Form Placement**: Story submission form positioned at bottom with title, content, 5-image upload, and paw rating
  - **User Data Mapping**: Correctly uses PublicUser type (firstName/lastName/profileImageUrl) for author and commenter display
- **Story Reactions System**: Implemented dual reaction types (like 👍 and love ❤️) with separate likesCount and lovesCount tracking, proper toggle logic, and database constraints to prevent negative counts
- **Authentication for Report Submission**: Report Lost/Found buttons redirect to Google authentication before allowing users to access report forms
- **Enhanced Report Validation**: Contact info (phone/email) now mandatory for all pet reports; lost reports require name, breed, size, and age; found reports allow "Unknown" checkboxes for name, breed, and age
- **Server-Side Validation**: Added comprehensive Zod schema validation with transform to default found report fields to "Unknown" and superRefine to enforce lost report requirements, preventing database errors
- **Public Search Functionality**: Search pages (`/search` and `/search/:zipCode`) accessible to both authenticated and guest users
- **Surrounding ZIP Code Suggestions**: Search results include clickable buttons for surrounding ZIP codes (±1-5 range) with city labels in format "94582: San Ramon" to help users expand search area
- **Report Cards Display**: Comprehensive report card UI with pet images, badges for lost/found status, detailed pet information, and location/date details
- **ZIP Code Helper Functions**: Added `getSurroundingZipCodes()` utility to calculate nearby ZIP codes for improved search discoverability

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **File Structure**: Component-based architecture with shared utilities and custom hooks

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL session store
- **File Uploads**: Multer middleware for image handling with local storage
- **Email Service**: Nodemailer for automated notifications

## Database Design
- **Database**: PostgreSQL (configured for Neon serverless)
- **Key Tables**:
  - `users` - User authentication and profile data
  - `dogReports` - Lost and found dog reports with detailed metadata
  - `dogReportImages` - Associated images for each report
  - `sessions` - Session storage for authentication
  - `emailNotifications` - Email notification tracking
- **Schema Management**: Drizzle Kit for migrations and schema changes

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC (OpenID Connect) flow
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies, CSRF protection, secure cookie settings
- **Authorization**: Route-level protection with middleware-based authentication checks

## File Management
- **Image Storage**: Local filesystem storage with organized directory structure
- **Upload Handling**: Multer with file type validation and size limits (10MB max)
- **Image Serving**: Static file serving through Express for uploaded images
- **Validation**: MIME type checking to ensure only images are uploaded

## API Design
- **Architecture**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling with consistent response formats
- **Logging**: Request/response logging with performance metrics
- **Data Validation**: Zod schemas for request/response validation
- **CORS**: Configured for cross-origin requests with credentials support

## Development & Deployment
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Development**: Hot module replacement (HMR) with Vite dev server
- **Environment**: Environment variable based configuration
- **Scripts**: Unified package.json scripts for development, build, and deployment

# External Dependencies

## Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL adapter
- **express**: Web framework for REST API and server-side routing
- **react** & **@vitejs/plugin-react**: Frontend framework with Vite integration

## Authentication & Security
- **openid-client**: OpenID Connect client implementation for Replit Auth
- **passport**: Authentication middleware with strategy-based auth
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI & Styling
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom theme
- **class-variance-authority**: Utility for creating variant-based component styles
- **lucide-react**: Icon library for consistent iconography

## Form Handling & Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: Schema validation library for type-safe data validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

## Data Fetching & State Management
- **@tanstack/react-query**: Server state management with caching and background updates
- **wouter**: Lightweight routing library for client-side navigation

## File Upload & Email Services
- **multer**: Multipart/form-data handling for file uploads
- **nodemailer**: Email sending functionality for notifications
- **@types/multer** & **@types/nodemailer**: TypeScript definitions

## Development Tools
- **typescript**: Static type checking and enhanced developer experience
- **vite**: Fast build tool with HMR and optimized production builds
- **eslint** & **prettier**: Code quality and formatting tools (implied by structure)