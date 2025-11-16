import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Health Check Endpoint
 * Used by Docker healthcheck, load balancers, and monitoring systems
 * 
 * Returns:
 * - 200 OK: Service is healthy
 * - 503 Service Unavailable: Service is unhealthy
 */
export const GET: RequestHandler = async () => {
	try {
		// Get current timestamp
		const timestamp = new Date().toISOString();
		
		// Get process uptime in seconds
		const uptimeSeconds = process.uptime();
		const uptimeFormatted = formatUptime(uptimeSeconds);
		
		// Get memory usage
		const memoryUsage = process.memoryUsage();
		const memoryInfo = {
			rss: formatBytes(memoryUsage.rss),
			heapUsed: formatBytes(memoryUsage.heapUsed),
			heapTotal: formatBytes(memoryUsage.heapTotal),
			external: formatBytes(memoryUsage.external)
		};
		
		// Get Node.js version
		const nodeVersion = process.version;
		
		// Get environment (use SvelteKit's dev flag)
		const environment = dev ? 'development' : 'production';
		
		// Basic health checks
		const checks = {
			process: true,
			memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9, // Less than 90% heap used
			uptime: uptimeSeconds > 0
		};
		
		// Determine overall health
		const isHealthy = Object.values(checks).every(check => check === true);
		
		// Construct response
		const healthData = {
			status: isHealthy ? 'healthy' : 'unhealthy',
			timestamp,
			uptime: uptimeFormatted,
			uptimeSeconds,
			memory: memoryInfo,
			node: nodeVersion,
			environment,
			checks
		};
		
		// Return appropriate status code
		const statusCode = isHealthy ? 200 : 503;
		
		return json(healthData, { 
			status: statusCode,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		});
		
	} catch (error) {
		// If health check itself fails, return unhealthy status
		console.error('Health check failed:', error);
		
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Unknown error',
				checks: {
					process: false,
					memory: false,
					uptime: false
				}
			},
			{ 
				status: 503,
				headers: {
					'Cache-Control': 'no-cache, no-store, must-revalidate'
				}
			}
		);
	}
};

/**
 * Format uptime seconds into human-readable string
 */
function formatUptime(seconds: number): string {
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	
	const parts: string[] = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	parts.push(`${secs}s`);
	
	return parts.join(' ');
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
	const sizes = ['B', 'KB', 'MB', 'GB'];
	if (bytes === 0) return '0 B';
	
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const value = bytes / Math.pow(1024, i);
	
	return `${value.toFixed(2)} ${sizes[i]}`;
}
