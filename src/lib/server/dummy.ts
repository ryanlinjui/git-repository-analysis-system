import type { Repository } from '$lib/schema/repository';
import { AI_MODEL } from './constants';

/**
 * Dummy repository data for testing
 * Use URL: https://github.com/dummy/test-repo or https://github.com/test/dummy
 */
export const DUMMY_REPO_URLS = [
	'https://github.com/dummy/test-repo',
	'https://github.com/test/dummy',
	'https://github.com/example/demo',
	'dummy',
	'test'
];

/**
 * Check if a URL should return dummy data
 */
export function isDummyRepo(url: string): boolean {
	const normalized = url.toLowerCase();
	return DUMMY_REPO_URLS.some(dummyUrl => normalized.includes(dummyUrl.toLowerCase()));
}

/**
 * Simulate progress updates with realistic timing
 * Total duration: ~15 seconds
 */
async function simulateProgress(
	onProgress?: (progress: number, message: string) => void
): Promise<void> {
	const steps = [
		{ progress: 0, message: '🎭 Dummy repository detected', delay: 200 },
		{ progress: 5, message: '🔗 Initializing connection...', delay: 800 },
		{ progress: 10, message: '📦 Simulating repository clone...', delay: 1200 },
		{ progress: 20, message: '📥 Downloading repository data...', delay: 1000 },
		{ progress: 25, message: '✅ Repository cloned', delay: 500 },
		{ progress: 30, message: '🔍 Fetching repository metadata...', delay: 1200 },
		{ progress: 35, message: '✅ Metadata fetched', delay: 400 },
		{ progress: 40, message: '📊 Collecting repository files...', delay: 1500 },
		{ progress: 45, message: '📁 Scanning project structure...', delay: 1000 },
		{ progress: 50, message: '✅ Collected 156 files', delay: 600 },
		{ progress: 55, message: '🤖 AI analyzing repository comprehensively...', delay: 1800 },
		{ progress: 65, message: '🤖 Analyzing tech stack and dependencies...', delay: 1500 },
		{ progress: 75, message: '🤖 Analyzing project structure...', delay: 1200 },
		{ progress: 85, message: '🤖 Evaluating code quality and complexity...', delay: 1400 },
		{ progress: 92, message: '🤖 Assessing skill level requirements...', delay: 800 },
		{ progress: 95, message: '✅ AI analysis complete!', delay: 500 },
		{ progress: 98, message: '📋 Compiling results...', delay: 400 },
		{ progress: 100, message: '✅ Mock data ready!', delay: 200 }
	];

	for (const step of steps) {
		onProgress?.(step.progress, step.message);
		await new Promise(resolve => setTimeout(resolve, step.delay));
	}
}

/**
 * Generate dummy repository analysis result
 * This is a realistic example of what the AI would return
 */
export async function generateDummyRepository(
	repoUrl: string = 'https://github.com/dummy/test-repo',
	onProgress?: (progress: number, message: string) => void
): Promise<Repository> {
	// Simulate realistic progress
	await simulateProgress(onProgress);
	
	const now = new Date();
	
	return {
		repoId: 'dummy123456789abc',
		
		metadata: {
			url: repoUrl,
			owner: 'dummy',
			name: 'test-repo',
			fullName: 'dummy/test-repo',
			provider: 'github',
			branch: 'main',
			commitSha: 'abc123def456789012345678901234567890abcd',
			stars: 1234,
			forks: 567,
			lastUpdated: now
		},
		
		description: 'A modern full-stack web application built with SvelteKit and TypeScript. This project demonstrates best practices in web development, including server-side rendering, API routes, authentication, and responsive design. It features a clean architecture with separation of concerns, comprehensive testing, and CI/CD pipeline integration.',
		
		techStack: [
			{
				name: 'TypeScript',
				category: 'language',
				version: '5.9.3',
				confidence: 100
			},
			{
				name: 'SvelteKit',
				category: 'framework',
				version: '2.47.1',
				confidence: 98
			},
			{
				name: 'Svelte',
				category: 'framework',
				version: '5.41.0',
				confidence: 98
			},
			{
				name: 'Vite',
				category: 'tool',
				version: '7.1.10',
				confidence: 95
			},
			{
				name: 'Tailwind CSS',
				category: 'framework',
				version: '4.1.14',
				confidence: 92
			},
			{
				name: 'Firebase',
				category: 'platform',
				version: '12.5.0',
				confidence: 88
			},
			{
				name: 'Zod',
				category: 'library',
				version: '4.1.12',
				confidence: 90
			},
			{
				name: 'Vitest',
				category: 'tool',
				version: '2.1.8',
				confidence: 85
			},
			{
				name: 'Playwright',
				category: 'tool',
				version: '1.49.0',
				confidence: 80
			},
			{
				name: 'ESLint',
				category: 'tool',
				version: '9.15.0',
				confidence: 95
			},
			{
				name: 'Prettier',
				category: 'tool',
				version: '3.4.2',
				confidence: 90
			}
		],
		
		primaryLanguage: 'TypeScript',
		
		skillLevel: 'mid-level',
		
		skillLevelRationale: 'This project requires solid understanding of modern web development practices including TypeScript, reactive frameworks (Svelte), server-side rendering, API design, and authentication. The use of advanced patterns like Zod schemas for validation, Firebase integration, and comprehensive testing setup indicates mid-level complexity. While the project follows established best practices, it doesn\'t involve highly complex distributed systems or advanced architectural patterns that would require senior-level expertise.',
		
		fileStats: {
			totalFiles: 156,
			totalLines: 8234,
			languageBreakdown: {
				'TypeScript': 5420,
				'Svelte': 2100,
				'CSS': 450,
				'JavaScript': 180,
				'JSON': 84
			}
		},
		
		structureAnalysis: {
			hasTests: true,
			hasCI: true,
			hasDocumentation: true,
			hasLicense: true,
			packageManagers: ['pnpm'],
			buildTools: ['vite', 'typescript', 'svelte'],
			dockerized: true,
			monorepo: false
		},
		
		codeQuality: {
			score: 85,
			issues: [
				'Some components exceed 300 lines - consider breaking down into smaller components',
				'Missing error boundaries in a few async operations',
				'Could benefit from more granular unit tests for utility functions',
				'Some API endpoints lack request validation',
				'Documentation could be more detailed for complex functions'
			],
			strengths: [
				'Excellent TypeScript usage with strict mode enabled',
				'Comprehensive Zod schemas for runtime type validation',
				'Clean separation of concerns with well-organized folder structure',
				'Good use of Svelte 5 runes ($state, $derived, $effect)',
				'Proper error handling in most async operations',
				'Consistent code formatting with Prettier',
				'Well-structured component hierarchy',
				'Good use of TypeScript utility types',
				'Comprehensive ESLint configuration',
				'Clear naming conventions throughout the codebase'
			]
		},
		
		complexity: {
			score: 68,
			factors: [
				'Multiple integration points (Firebase, AI APIs, Git providers)',
				'Server-side rendering with SvelteKit adds complexity',
				'Real-time data synchronization with Firestore',
				'Authentication and authorization logic',
				'Complex state management across multiple components',
				'File system operations and Git repository cloning',
				'AI prompt engineering and response parsing',
				'TypeScript generics and advanced typing'
			]
		},
		
		aiModel: AI_MODEL,
		analyzedCommit: 'abc123def456789012345678901234567890abcd',
		totalScans: 1,
		lastScannedAt: now,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Alternative dummy data - Beginner level project
 */
export function generateBeginnerDummyRepo(): Repository {
	const now = new Date();
	
	return {
		repoId: 'dummy-beginner-001',
		
		metadata: {
			url: 'https://github.com/dummy/hello-world',
			owner: 'dummy',
			name: 'hello-world',
			fullName: 'dummy/hello-world',
			provider: 'github',
			branch: 'main',
			commitSha: 'abc123',
			stars: 5,
			forks: 2,
			lastUpdated: now
		},
		
		description: 'A simple HTML and CSS website showcasing basic web development skills. This project includes a homepage, about page, and contact form with clean, semantic markup and responsive design.',
		
		techStack: [
			{ name: 'HTML', category: 'language', version: '5', confidence: 100 },
			{ name: 'CSS', category: 'language', version: '3', confidence: 100 },
			{ name: 'JavaScript', category: 'language', version: 'ES6', confidence: 60 }
		],
		
		primaryLanguage: 'HTML',
		skillLevel: 'beginner',
		skillLevelRationale: 'This is a basic static website using fundamental web technologies. It demonstrates understanding of HTML structure, CSS styling, and basic JavaScript for form validation. No complex frameworks, build tools, or advanced patterns are used.',
		
		fileStats: {
			totalFiles: 8,
			totalLines: 450,
			languageBreakdown: {
				'HTML': 280,
				'CSS': 150,
				'JavaScript': 20
			}
		},
		
		structureAnalysis: {
			hasTests: false,
			hasCI: false,
			hasDocumentation: true,
			hasLicense: false,
			packageManagers: [],
			buildTools: [],
			dockerized: false,
			monorepo: false
		},
		
		codeQuality: {
			score: 70,
			issues: [
				'No form validation on the backend',
				'Missing alt attributes on some images',
				'Could use CSS variables for better maintainability'
			],
			strengths: [
				'Clean, semantic HTML structure',
				'Responsive design that works on mobile',
				'Well-organized CSS with clear class names',
				'Good use of comments'
			]
		},
		
		complexity: {
			score: 15,
			factors: [
				'Simple multi-page website structure',
				'Basic CSS styling with flexbox',
				'Minimal JavaScript for form handling'
			]
		},
		
		aiModel: AI_MODEL,
		analyzedCommit: 'abc123',
		totalScans: 1,
		lastScannedAt: now,
		createdAt: now,
		updatedAt: now
	};
}

/**
 * Alternative dummy data - Senior level project
 */
export function generateSeniorDummyRepo(): Repository {
	const now = new Date();
	
	return {
		repoId: 'dummy-senior-001',
		
		metadata: {
			url: 'https://github.com/dummy/distributed-system',
			owner: 'dummy',
			name: 'distributed-system',
			fullName: 'dummy/distributed-system',
			provider: 'github',
			branch: 'main',
			commitSha: 'xyz789',
			stars: 5420,
			forks: 1230,
			lastUpdated: now
		},
		
		description: 'A high-performance distributed system for real-time data processing built with Kubernetes, Go microservices, and Apache Kafka. Features event-driven architecture, automatic scaling, fault tolerance, distributed tracing, and comprehensive monitoring. Handles millions of events per second with sub-100ms latency.',
		
		techStack: [
			{ name: 'Go', category: 'language', version: '1.22', confidence: 100 },
			{ name: 'Kubernetes', category: 'platform', version: '1.29', confidence: 98 },
			{ name: 'Apache Kafka', category: 'platform', version: '3.7', confidence: 95 },
			{ name: 'PostgreSQL', category: 'database', version: '16', confidence: 92 },
			{ name: 'Redis', category: 'database', version: '7.2', confidence: 90 },
			{ name: 'Prometheus', category: 'tool', version: '2.50', confidence: 88 },
			{ name: 'Grafana', category: 'tool', version: '10.3', confidence: 85 },
			{ name: 'gRPC', category: 'framework', version: '1.62', confidence: 95 },
			{ name: 'Docker', category: 'tool', version: '25.0', confidence: 98 }
		],
		
		primaryLanguage: 'Go',
		skillLevel: 'senior',
		skillLevelRationale: 'This project requires expert-level knowledge of distributed systems, microservices architecture, event-driven design, and cloud-native technologies. It involves complex challenges like distributed consensus, eventual consistency, circuit breakers, service mesh, observability, and high-availability patterns. The system must handle massive scale, fault tolerance, and maintain strong consistency guarantees across distributed components.',
		
		fileStats: {
			totalFiles: 342,
			totalLines: 45680,
			languageBreakdown: {
				'Go': 38200,
				'YAML': 4500,
				'Shell': 1800,
				'Dockerfile': 580,
				'Makefile': 600
			}
		},
		
		structureAnalysis: {
			hasTests: true,
			hasCI: true,
			hasDocumentation: true,
			hasLicense: true,
			packageManagers: ['go mod'],
			buildTools: ['make', 'docker', 'kubernetes'],
			dockerized: true,
			monorepo: true
		},
		
		codeQuality: {
			score: 92,
			issues: [
				'Some service-to-service communication could benefit from additional retry logic',
				'Integration test coverage could be expanded for edge cases',
				'A few goroutine leaks detected in stress tests'
			],
			strengths: [
				'Excellent error handling with custom error types',
				'Comprehensive unit and integration tests (>85% coverage)',
				'Well-designed interfaces for dependency injection',
				'Proper use of context for cancellation and timeouts',
				'Extensive use of design patterns (Circuit Breaker, Saga, CQRS)',
				'Detailed distributed tracing with OpenTelemetry',
				'Robust observability with metrics, logs, and traces',
				'Clean architecture with clear separation of layers',
				'Thorough documentation with architecture diagrams',
				'Production-ready with health checks and graceful shutdown'
			]
		},
		
		complexity: {
			score: 95,
			factors: [
				'Distributed consensus and coordination',
				'Event sourcing and CQRS patterns',
				'Complex service mesh configuration',
				'Multi-region deployment strategy',
				'Advanced Kubernetes operators',
				'Custom metrics and alerting rules',
				'Complex data partitioning strategies',
				'Distributed transaction handling',
				'Circuit breaker and bulkhead patterns',
				'Advanced security with mTLS and RBAC'
			]
		},
		
		aiModel: AI_MODEL,
		analyzedCommit: 'xyz789',
		totalScans: 3,
		lastScannedAt: now,
		createdAt: now,
		updatedAt: now
	};
}
