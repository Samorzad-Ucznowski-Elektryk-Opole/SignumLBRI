# SignumLBRI - Architecture Overview

## Project Structure

```
SignumLBRI/
├── docs/                    # Documentation
├── src/                     # Source code
│   ├── controllers/         # Request handlers
│   ├── models/             # Database models
│   ├── config/             # Configuration files
│   ├── public/             # Static assets
│   │   └── css/            # Modern UI styles
│   └── app.ts              # Main application
├── views/                  # Pug templates
│   ├── home.pug           # Modern landing page
│   └── layout.pug         # Base layout
├── docker-compose.yml     # Docker configuration
└── Dockerfile             # Container definition
```

## Technology Stack

- **Backend**: Node.js + TypeScript + Express.js
- **Frontend**: Pug templates + Tailwind CSS + Modern UI
- **Database**: MongoDB
- **Deployment**: Docker + Nginx
- **Build**: Webpack + Sass

## Key Features

- Modern glassmorphism UI design
- Responsive layout (fullHD + mobile)
- Complete user journey flow
- Book trading platform
- Multi-role user system
