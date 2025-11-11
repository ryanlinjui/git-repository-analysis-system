/**
 * Firestore Setup Test Script
 * 
 * 這個腳本會建立測試資料來驗證 Firestore 設定
 * 執行: pnpm tsx scripts/test-firestore.ts
 */

import { adminDb } from '../src/lib/server/firebase';
import { UserSchema, ScanSchema, ScanResultSchema } from '../src/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { FieldValue } from 'firebase-admin/firestore';

async function testFirestore() {
	console.log('🧪 Testing Firestore Setup...\n');

	try {
		// 1. Test User Creation
		console.log('1️⃣ Creating test user...');
		const testUserId = 'test-user-' + Date.now();
		const testUser = UserSchema.parse({
			uid: testUserId,
			email: 'test@example.com',
			displayName: 'Test User',
			photoURL: null,
			authProvider: 'github',
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp()
		});

		await adminDb.collection('users').doc(testUserId).set(testUser);
		console.log('✅ User created:', testUserId);

		// 2. Test Scan Creation
		console.log('\n2️⃣ Creating test scan...');
		const scanId = uuidv4();
		const testScan = ScanSchema.parse({
			id: scanId,
			userId: testUserId,
			repoUrl: 'https://github.com/facebook/react',
			repoMetadata: {
				url: 'https://github.com/facebook/react',
				owner: 'facebook',
				name: 'react',
				fullName: 'facebook/react',
				provider: 'github',
				branch: 'main'
			},
			status: 'queued',
			shareToken: nanoid(10),
			isPublic: true,
			queuedAt: FieldValue.serverTimestamp(),
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp()
		});

		await adminDb.collection('scans').doc(scanId).set(testScan);
		console.log('✅ Scan created:', scanId);

		// 3. Test Result Creation
		console.log('\n3️⃣ Creating test result...');
		const testResult = ScanResultSchema.parse({
			id: scanId,
			scanId: scanId,
			description: 'A JavaScript library for building user interfaces',
			techStack: [
				{ name: 'JavaScript', category: 'language', confidence: 95 },
				{ name: 'React', category: 'framework', confidence: 100 },
				{ name: 'Jest', category: 'tool', confidence: 90 }
			],
			primaryLanguage: 'JavaScript',
			skillLevel: 'senior',
			skillLevelRationale: 'Complex codebase with advanced patterns and extensive testing',
			structureAnalysis: {
				hasTests: true,
				hasCI: true,
				hasDocumentation: true,
				hasLicense: true,
				packageManagers: ['npm', 'yarn'],
				buildTools: ['webpack', 'rollup'],
				dockerized: true,
				monorepo: false
			},
			createdAt: FieldValue.serverTimestamp(),
			updatedAt: FieldValue.serverTimestamp()
		});

		await adminDb.collection('results').doc(scanId).set(testResult);
		console.log('✅ Result created:', scanId);

		// 4. Test Query (requires index)
		console.log('\n4️⃣ Testing query with index...');
		const userScans = await adminDb
			.collection('scans')
			.where('userId', '==', testUserId)
			.orderBy('createdAt', 'desc')
			.limit(5)
			.get();

		console.log(`✅ Query successful! Found ${userScans.size} scan(s)`);

		// 5. Test shareToken query
		console.log('\n5️⃣ Testing shareToken query...');
		const shareToken = testScan.shareToken;
		const scanByToken = await adminDb
			.collection('scans')
			.where('shareToken', '==', shareToken)
			.limit(1)
			.get();

		console.log(`✅ ShareToken query successful! Found ${scanByToken.size} scan(s)`);

		// Summary
		console.log('\n' + '='.repeat(50));
		console.log('🎉 All tests passed!');
		console.log('='.repeat(50));
		console.log('\nTest data created:');
		console.log(`- User ID: ${testUserId}`);
		console.log(`- Scan ID: ${scanId}`);
		console.log(`- Share Token: ${shareToken}`);
		console.log('\n⚠️  Remember to clean up test data in Firebase Console!');

	} catch (error) {
		console.error('\n❌ Test failed:', error);
		
		if (error instanceof Error && error.message.includes('index')) {
			console.log('\n💡 Tip: You need to create Firestore indexes.');
			console.log('Run: firebase deploy --only firestore:indexes');
			console.log('Or check FIRESTORE_SETUP.md for manual setup.');
		}
		
		process.exit(1);
	}
}

// Run tests
testFirestore()
	.then(() => {
		console.log('\n✨ Test completed successfully!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n💥 Unexpected error:', error);
		process.exit(1);
	});
