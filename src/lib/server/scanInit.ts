import { getUserIdentifier } from './validate/user';
import { validateRepoUrl } from './validate/url';
import { checkAndUpdateQuota } from './validate/quota';

/**
 * Scan validation result
 * Contains all information needed to proceed with scan creation
 */
export interface ScanValidationResult {
	allowed: boolean;
	uid: string;
	parsedRepoUrl: string;
	error?: string;
	isAuthenticated?: boolean;
}

/**
 * Initialize scan by validating all requirements:
 * 1. Validate repository URL
 * 2. Identify user (authenticated or anonymous)
 * 3. Check and update quota
 * 
 * This is the main coordinator that orchestrates all validation modules
 */
export async function initializeScan(
	request: Request,
	body: any,
	locals: any
): Promise<ScanValidationResult> {
	// Step 1: Validate repository URL from body
	const urlValidation = validateRepoUrl(body);
	
	if (!urlValidation.isValid || !urlValidation.repoUrl) {
		return {
			allowed: false,
			uid: '',
			parsedRepoUrl: '',
			error: urlValidation.error || 'Invalid repository URL'
		};
	}

	// Step 2: Identify user (authenticated or anonymous via hashed IP)
	const userIdentifier = getUserIdentifier(request, locals);

	// Step 3: Check and update quota
	const quotaResult = await checkAndUpdateQuota(
		userIdentifier.uid,
		userIdentifier.isAuthenticated
	);

	if (!quotaResult.allowed) {
		return {
			allowed: false,
			uid: userIdentifier.uid,
			parsedRepoUrl: urlValidation.repoUrl,
			error: quotaResult.error || 'Quota exceeded',
			isAuthenticated: userIdentifier.isAuthenticated
		};
	}

	// All validations passed
	return {
		allowed: true,
		uid: userIdentifier.uid,
		parsedRepoUrl: urlValidation.repoUrl,
		isAuthenticated: userIdentifier.isAuthenticated
	};
}

