# Development Guide

## Quick Start

1. Clone repository
2. Run with Docker: `docker-compose up -d`
3. Access at: http://localhost:800

## Development Workflow

### Building

```bash
npm run build          # Full build
npm run build-sass     # Compile SCSS to CSS
npm run build-ts       # Compile TypeScript
npm run build-webpack  # Bundle frontend assets
```

### Development

```bash
npm run watch          # Watch mode for development
npm run lint           # Code linting
```

### Docker

```bash
docker-compose up -d            # Start containers
docker-compose up --build -d    # Rebuild and start
docker-compose down             # Stop containers
```

## Code Style

- TypeScript for all backend code
- Pug templates for views
- SCSS for styling (modern-ui.scss only)
- ESLint + TypeScript compiler for code quality

## File Organization

- Controllers: Business logic
- Models: Database schemas
- Views: UI templates
- Public: Static assets (CSS, JS, images)
- Config: Application configuration
