# GitRepoScanner

<div align="center">

<img width="50%" alt="logo" src="https://github.com/user-attachments/assets/a9b058ad-80ca-4889-9d98-099ffaecf727" />

![Git Repository Analysis System](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

***"AI-powered repository analysis tool that provides comprehensive insights into your codebase"***

</div>

## ✨ Features

**🤖 AI-Powered Repository Analysis**
- Paste any GitHub/GitLab/Bitbucket URL and get instant AI insights
- Analyzes tech stack, code quality, complexity, and skill level
- Powered by Google Gemini

**🔗 Share & Compare**
- Every scan gets a permanent shareable URL
- No account needed to view results
- Track your scan history with authentication

**⚡ Smart & Fast**
- Real-time progress updates
- Anonymous users get limited scans, authenticated users get more
- Results include: project description, technologies used, quality score (0-100), and developer skill level assessment

**📊 What You Get**
- **Tech Stack Detection** - Languages, frameworks, tools with confidence scores
- **Code Quality Score** - 0-100 rating with specific improvement suggestions  
- **Complexity Analysis** - Understand what makes the project advanced
- **Skill Level** - Beginner, Junior, Mid-level, or Senior classification
- **Project Structure** - Tests, CI/CD, documentation quality assessment

---


## 🛠️ Technology Choices and Rationale

### Frontend Stack
- **SvelteKit** - Full-stack Framework
- **Svelte 5** - UI Framework with Runes
- **Tailwind CSS 4** - Utility-first Styling
- **Flowbite Svelte** - UI Components
- **Lucide Svelte** - Icon Library

### Backend Stack
- **TypeScript** - Type-safe Programming
- **SvelteKit Server** - Backend Runtime
- **Node.js** - JavaScript Runtime
- **Zod** - Schema Validation & Type Safety

### Database & Authentication
- **Firebase Firestore** - NoSQL Database (User Data & Scans)
- **Firebase Authentication** - Email/Password Auth

### AI & Analysis
- **Google Gemini** - AI Model for Code Analysis

### Infrastructure & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container Orchestration
- **Cloudflare Tunnel (Cloudflared)** - Secure Ingress without Open Ports
- **Cloudflare CDN/WAF** - DDoS Protection & Edge Caching
- **GitHub Actions** - CI/CD Pipeline
- **Ansible** - Deployment Automation & Configuration Management

### Monitoring & Observability
- **Grafana Loki** - Log Aggregation
- **Promtail** - Log Collection
- **Grafana** - Metrics Visualization & Dashboards

---

### 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Internet["Internet"]
        Users[Users/Clients]
        GitHubActions[GitHub Actions Runner]
    end
    
    subgraph Cloudflare["Cloudflare Edge Network"]
        CDN[CDN/WAF/DDoS Protection]
        TunnelEdge[Cloudflare Tunnel Edge]
    end
    
    subgraph CICD["CI/CD Pipeline"]
        direction LR
        Build[Build & Test]
        Registry[GitHub Container<br/>Registry GHCR]
    end
    
    subgraph DockerHost["Production Server - Docker Compose"]
        
        subgraph TunnelContainer["Cloudflared Container"]
            Tunnel[Cloudflare Tunnel<br/>┌─────────────┐<br/>│ SSH :22     │<br/>│ HTTP :3000  │<br/>└─────────────┘]
        end
        
        subgraph AppContainer["App Container"]
            App[SvelteKit Application<br/>UI Components<br/>API Routes<br/>Repository Scanner<br/>AI Analyzer]
        end
        
        subgraph LogContainer["Loki Container"]
            Loki[Log Aggregation<br/>7-day Retention]
        end
        
        subgraph MonitorContainer["Grafana Container"]
            Grafana[Monitoring Dashboard<br/>Visualization]
        end
        
        subgraph CollectorContainer["Promtail Container"]
            Promtail[Log Collector<br/>Docker Logs]
        end
        
        SSH[SSH Server :22<br/>host.docker.internal]
        
        Network[Docker Bridge Network<br/>git-analysis-network]
    end
    
    subgraph DataLayer["Data Layer"]
        Firestore[("Firebase Firestore<br/>User Data & Scans")]
        TempFS["Temp Storage<br/>/tmp/git-analysis"]
    end
    
    subgraph ExternalServices["External Services"]
        GitProviders["Git Providers<br/>GitHub/GitLab/Bitbucket"]
        GeminiAI["Google Gemini 2.0 Flash<br/>AI Code Analysis"]
    end
    
    %% User Flow - HTTP Traffic
    Users -->|HTTPS request| CDN
    CDN -->|WebSocket| TunnelEdge
    TunnelEdge -->|encrypted tunnel| Tunnel
    Tunnel -->|HTTP to app:3000| App
    App -->|response| Tunnel
    Tunnel -->|encrypted tunnel| TunnelEdge
    TunnelEdge -->|response| CDN
    CDN -->|HTTPS response| Users
    
    %% CI/CD & Deployment Flow
    Build -->|docker push| Registry
    GitHubActions -->|install cloudflared| GitHubActions
    GitHubActions -->|SSH via Cloudflare| TunnelEdge
    TunnelEdge -->|encrypted tunnel| Tunnel
    Tunnel -->|SSH to host:22| SSH
    SSH -->|ansible-playbook| DockerHost
    Registry -->|docker pull| DockerHost
    
    %% Database Flow
    App -->|write scans/users| Firestore
    Firestore -->|real-time sync| App
    
    %% Temp Storage
    App -->|clone & scan| TempFS
    TempFS -->|read files| App
    
    %% External API Flows
    App -->|fetch repo metadata| GitProviders
    GitProviders -->|JSON response| App
    App -->|analysis prompt| GeminiAI
    GeminiAI -->|AI insights| App
    
    %% Monitoring & Logging Flow
    AppContainer -.->|stdout/stderr| Promtail
    TunnelContainer -.->|logs| Promtail
    Promtail -->|push logs| Loki
    Grafana -->|LogQL query| Loki
    Loki -->|log data| Grafana
    
    %% Docker Network
    App -.->|DNS: app| Network
    Tunnel -.->|DNS: cloudflared| Network
    Loki -.->|DNS: loki| Network
    Grafana -.->|DNS: grafana| Network
    Promtail -.->|DNS: promtail| Network
    
    %% Network
    AppContainer -.-> Network
    TunnelContainer -.-> Network
    LogContainer -.-> Network
    MonitorContainer -.-> Network
    CollectorContainer -.-> Network
    
    style Internet fill:#e3f2fd
    style Cloudflare fill:#fff3e0
    style CICD fill:#ffebee
    style AnsibleRunner fill:#ffccbc
    style DockerHost fill:#c8e6c9
    style DataLayer fill:#f3e5f5
    style ExternalServices fill:#e8f5e9
```

---

## 📁 Project Structure

```bash
git-repository-analysis-system/
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline for automated deployment
│
├── ansible/                        # Deployment automation
│   ├── deploy.yml                  # Main deployment playbook
│   ├── inventory.yml               # Server inventory
│   └── templates/
│       └── docker-compose.yml.j2   # Docker Compose template with variables
│
├── config/                         # Monitoring & logging configuration
│   ├── grafana-datasources.yml    # Grafana data source configuration
│   ├── loki-config.yml            # Loki log aggregation settings
│   └── promtail-config.yml        # Promtail log collection settings
│
├── firebase/
│   ├── firestore.indexes.json     # Firestore indexes
│   └── firestore.rules            # Firestore security rules
│
├── scripts/
│   └── scan-repo.ts               # CLI tool for testing scans
│
├── src/
│   ├── lib/
│   │   ├── components/            # Reusable Svelte components
│   │   │   ├── Auth.svelte        # Authentication UI
│   │   │   ├── Avatar.svelte      # User avatar display
│   │   │   ├── RateLimits.svelte  # Quota display
│   │   │   ├── RepoSummary.svelte # Analysis results display
│   │   │   ├── ScanArea.svelte    # URL input & submission
│   │   │   ├── ScanProgress.svelte # Real-time progress display
│   │   │   ├── ScanStatus.svelte  # Scan status indicator
│   │   │   ├── Sidebar.svelte     # Navigation sidebar
│   │   │   └── Welcome.svelte     # Welcome message
│   │   │
│   │   ├── firebase/              # Firebase client SDK
│   │   │   └── index.ts           # Firestore & Auth initialization
│   │   │
│   │   ├── schema/                # Zod schemas & TypeScript types
│   │   │   ├── repository.ts      # Repository & analysis types
│   │   │   ├── scan.ts            # Scan status & error types
│   │   │   ├── user.ts            # User & quota types
│   │   │   └── utils.ts           # Schema utilities
│   │   │
│   │   ├── server/                # Server-side logic
│   │   │   ├── validate/          # Validation logic
│   │   │   │   ├── quota.ts       # Rate limiting & quotas
│   │   │   │   ├── url.ts         # URL validation & parsing
│   │   │   │   └── user.ts        # User validation
│   │   │   ├── analyzer.ts        # Core analysis orchestration
│   │   │   ├── constants.ts       # Server constants
│   │   │   ├── dummy.ts           # Dummy data for testing
│   │   │   ├── firebase.ts        # Firebase Admin SDK setup
│   │   │   ├── git-utils.ts       # Git clone & metadata extraction
│   │   │   ├── llm.ts             # Gemini AI integration
│   │   │   ├── prompt.ts          # AI prompt generation
│   │   │   ├── scan.ts            # Scan creation & background jobs
│   │   │   └── scanInit.ts        # Scan initialization
│   │   │
│   │   ├── stores/                # Svelte stores (state management)
│   │   │   ├── anonymous.ts       # Anonymous user tracking
│   │   │   ├── auth.ts            # Auth state & user data
│   │   │   ├── history.ts         # Scan history
│   │   │   └── scan-status.ts     # Real-time scan tracking
│   │   │
│   │   ├── utils/
│   │   │   └── date.ts            # Date formatting utilities
│   │   │
│   │   └── scan-client.ts         # Client-side scan operations
│   │
│   ├── routes/                    # SvelteKit routes & pages
│   │   ├── api/                   # API endpoints
│   │   │   ├── anonymous/
│   │   │   │   └── +server.ts     # Anonymous user tracking
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── signin/
│   │   │   │   │   └── +server.ts # Sign in endpoint
│   │   │   │   └── signout/
│   │   │   │       └── +server.ts # Sign out endpoint
│   │   │   └── scan/
│   │   │       └── +server.ts     # Scan submission endpoint
│   │   │
│   │   ├── dashboard/[id]/
│   │   │   ├── +page.server.ts    # Dashboard server load
│   │   │   └── +page.svelte       # User dashboard page
│   │   │
│   │   ├── scan/[id]/
│   │   │   ├── +page.server.ts    # Scan server load
│   │   │   └── +page.svelte       # Scan progress & results page
│   │   │
│   │   ├── +layout.svelte         # Root layout with navigation
│   │   └── +page.svelte           # Home page with scan submission
│   │
│   ├── app.css                    # Global styles
│   ├── app.d.ts                   # TypeScript declarations
│   ├── app.html                   # HTML template
│   └── hooks.server.ts            # SvelteKit server hooks (auth)
│
├── static/                        # Static assets (empty)
│
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── .npmrc                         # npm configuration
├── compose.yml                    # Docker Compose configuration
├── Dockerfile                     # Application container image
├── LICENSE                        # MIT License
├── package.json                   # Dependencies & scripts
├── pnpm-lock.yaml                # Lock file
├── README.md                      # This file
├── service-account-file.example.json # Firebase Admin credentials example
├── service-account-file.json     # Firebase Admin credentials (gitignored)
├── svelte.config.js              # SvelteKit configuration
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite build configuration
```

## 📥 Setup Instructions

### Prerequisites

- **Node.js** 18+ and **pnpm**
- **Firebase project** with Firestore and Authentication enabled
- **Google Gemini API key** (from Google AI Studio)

### Dev Environment Setup

```bash
git clone https://github.com/ryanlinjui/git-repository-analysis-system
cd git-repository-analysis-system
pnpm i
cp .env.example .env # remember to set variables
```

### Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/) to create Firebase Project
2. Create a new project
3. Enable **Firestore Database** (start in production mode)
4. Enable **Authentication** → Email/Password sign-in method
5. Copy rules from `firebase/firestore.rules` to Firebase Console.
6. Get `service-account-file.json` in project root for admin auth.

### Run Development Server

```bash
pnpm dev
```

### Test Repository Scanning

Try scanning a repository:
```
https://github.com/google-gemini/gemini-cli
```

Or use dummy data for testing (no actual clone):
```
https://github.com/dummy/test-repo
```

---

## 🚀 Deployment Guide

### Quick Deploy

```bash
docker compose up -d
```

### Redeploy
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Check status
```bash
docker compose ps
docker compose logs -f
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
