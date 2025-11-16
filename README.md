# 🔍 Git Repository Analysis System

<div align="center">

![Git Repository Analysis System](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

**AI-powered repository analysis tool that provides comprehensive insights into your codebase**

</div>

---

## 🎬 Demo

---

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
    end
    
    subgraph Cloudflare["Cloudflare"]
        CDN[CDN/WAF/DDoS Protection]
    end
    
    subgraph CICD["CI/CD - GitHub Actions"]
        direction LR
        Build[Build Pipeline]
        
        subgraph AnsibleRunner["Ansible Container"]
            Ansible[Deployment Automation<br/>Container Orchestration<br/>Config Management<br/>Zero-Downtime Deploy]
        end
        
        Registry[Container Registry<br/>GHCR]
    end
    
    subgraph DockerHost["Production Server"]
        
        subgraph AppContainer["App Container"]
            App[SvelteKit Application<br/>UI Components<br/>API Routes<br/>Repository Scanner<br/>AI Analyzer]
        end
        
        subgraph TunnelContainer["Cloudflared"]
            Tunnel[Cloudflare Tunnel<br/>Secure Ingress]
        end
        
        subgraph LogContainer["Loki"]
            Loki[Log Aggregation]
        end
        
        subgraph MonitorContainer["Grafana"]
            Grafana[Monitoring Dashboard]
        end
        
        subgraph CollectorContainer["Promtail"]
            Promtail[Log Collector]
        end
        
        Network[Docker Network]
    end
    
    subgraph DataLayer["Data Layer"]
        Firestore[(Firebase Firestore<br/>User Data & Scans)]
        TempFS[Temp Storage<br/>Git Repos]
    end
    
    subgraph ExternalServices["External Services"]
        GitProviders[Git Providers<br/>GitHub/GitLab/Bitbucket]
        GeminiAI[Google Gemini AI]
    end
    
    %% User Flow
    Users -->|request| CDN
    CDN -->|response| Users
    CDN -->|request| Tunnel
    Tunnel -->|response| CDN
    Tunnel -->|request| App
    App -->|response| Tunnel
    
    %% CI/CD Flow
    Build -->|push images| Registry
    Ansible -.->|SSH deploy| DockerHost
    Registry -.->|pull images| DockerHost
    
    %% Firestore - separate directions
    App -->|write/update| Firestore
    Firestore -->|subscribe| App
    
    %% Temp Storage
    App -->|write| TempFS
    
    %% Git Providers - separate directions
    App -->|API request| GitProviders
    GitProviders -->|metadata| App
    
    %% Gemini AI - separate directions
    App -->|prompt| GeminiAI
    GeminiAI -->|analysis| App
    
    %% Logging Flow
    AppContainer -->|logs| Promtail
    Promtail -->|push| Loki
    Grafana -->|query| Loki
    Loki -->|data| Grafana
    
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
├── src/
│   ├── routes/                      # SvelteKit routes & pages
│   │   ├── +page.svelte            # Home page with scan submission
│   │   ├── +layout.svelte          # Root layout with navigation
│   │   ├── api/                    # API endpoints
│   │   │   ├── scan/+server.ts     # Scan submission endpoint
│   │   │   ├── auth/               # Authentication endpoints
│   │   │   └── anonymous/+server.ts # Anonymous user tracking
│   │   ├── scan/[id]/              # Scan progress & results page
│   │   └── dashboard/[id]/         # User dashboard page
│   │
│   ├── lib/
│   │   ├── components/             # Reusable Svelte components
│   │   │   ├── Auth.svelte         # Authentication UI
│   │   │   ├── ScanArea.svelte     # URL input & submission
│   │   │   ├── ScanProgress.svelte # Real-time progress display
│   │   │   ├── RepoSummary.svelte  # Analysis results display
│   │   │   └── RateLimits.svelte   # Quota display
│   │   │
│   │   ├── server/                 # Server-side logic
│   │   │   ├── analyzer.ts         # Core analysis orchestration
│   │   │   ├── git-utils.ts        # Git clone & metadata extraction
│   │   │   ├── llm.ts              # Gemini AI integration
│   │   │   ├── prompt.ts           # AI prompt generation
│   │   │   ├── scan.ts             # Scan creation & background jobs
│   │   │   ├── firebase.ts         # Firebase Admin SDK setup
│   │   │   └── validate/           # Validation logic
│   │   │       ├── url.ts          # URL validation & parsing
│   │   │       ├── quota.ts        # Rate limiting & quotas
│   │   │       └── user.ts         # User validation
│   │   │
│   │   ├── stores/                 # Svelte stores (state management)
│   │   │   ├── auth.ts             # Auth state & user data
│   │   │   ├── scan-status.ts      # Real-time scan tracking
│   │   │   └── history.ts          # Scan history
│   │   │
│   │   ├── schema/                 # Zod schemas & TypeScript types
│   │   │   ├── repository.ts       # Repository & analysis types
│   │   │   ├── scan.ts             # Scan status & error types
│   │   │   └── user.ts             # User & quota types
│   │   │
│   │   ├── firebase/               # Firebase client SDK
│   │   │   └── index.ts            # Firestore & Auth initialization
│   │   │
│   │   └── scan-client.ts          # Client-side scan operations
│   │
│   ├── hooks.server.ts             # SvelteKit server hooks (auth)
│   ├── app.html                    # HTML template
│   └── app.css                     # Global styles
│
├── firebase/
│   ├── firestore.rules             # Firestore security rules
│   └── firestore.indexes.json      # Firestore indexes
│
├── scripts/
│   └── scan-repo.ts                # CLI tool for testing scans
│
├── static/                          # Static assets (favicon, etc.)
│
├── package.json                     # Dependencies & scripts
├── pnpm-lock.yaml                  # Lock file
├── svelte.config.js                # SvelteKit configuration
├── vite.config.ts                  # Vite build configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── service-account-file.json       # Firebase Admin credentials (gitignored)
└── README.md                       # This file
```

---

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

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
