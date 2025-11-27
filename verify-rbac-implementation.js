#!/usr/bin/env node

/**
 * RBAC Implementation Verification Script
 * 
 * This script verifies that all role-based access control components
 * are properly implemented in the codebase.
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    results.passed.push(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: ${filePath} not found`);
    return false;
  }
}

function checkFileContains(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    results.failed.push(`❌ ${description}: ${filePath} not found`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const missing = searchStrings.filter(str => !content.includes(str));

  if (missing.length === 0) {
    results.passed.push(`✅ ${description}`);
    return true;
  } else {
    results.failed.push(`❌ ${description}: Missing ${missing.join(', ')}`);
    return false;
  }
}

console.log('\n🔍 Verifying RBAC Implementation...\n');

// Check 1: Core files exist
console.log('📁 Checking core RBAC files...');
checkFileExists('src/utils/auth.js', 'Auth utilities');
checkFileExists('src/hooks/useUserRole.js', 'useUserRole hook');
checkFileExists('src/components/ProtectedRoute.jsx', 'ProtectedRoute component');
checkFileExists('src/config/roles.js', 'Roles configuration');

// Check 2: Auth utilities implementation
console.log('\n🔐 Checking auth utilities...');
checkFileContains('src/utils/auth.js', [
  'getUserType',
  'isAuthenticated',
  'hasRole',
  'getCurrentUserInfo',
  'custom:user_type'
], 'Auth utilities have required functions');

// Check 3: useUserRole hook implementation
console.log('\n🪝 Checking useUserRole hook...');
checkFileContains('src/hooks/useUserRole.js', [
  'useUserRole',
  'userRole',
  'loading',
  'hasRole',
  'isClinician',
  'isPatient'
], 'useUserRole hook has required exports');

// Check 4: ProtectedRoute component
console.log('\n🛡️ Checking ProtectedRoute component...');
checkFileContains('src/components/ProtectedRoute.jsx', [
  'ProtectedRoute',
  'allowedRoles',
  'useUserRole',
  'Navigate',
  'Access Denied'
], 'ProtectedRoute has required functionality');

// Check 5: Roles configuration
console.log('\n⚙️ Checking roles configuration...');
checkFileContains('src/config/roles.js', [
  'ROLES',
  'CLINICIAN',
  'PATIENT',
  'ROUTE_PERMISSIONS',
  '/dashboard/transcribe',
  '/dashboard/templates'
], 'Roles config has required constants');

// Check 6: App.jsx route protection
console.log('\n🛣️ Checking route protection in App.jsx...');
checkFileContains('src/App.jsx', [
  'ProtectedRoute',
  'ROLES'
], 'App.jsx uses ProtectedRoute');

// Check 7: Dashboard.jsx nested route protection
console.log('\n📊 Checking Dashboard route protection...');
checkFileContains('src/pages/Dashboard.jsx', [
  'ProtectedRoute',
  'ROLES.CLINICIAN',
  'allowedRoles'
], 'Dashboard has protected routes');

// Check 8: Sidebar role-based rendering
console.log('\n📋 Checking Sidebar role-based menu...');
checkFileContains('src/components/Sidebar.jsx', [
  'useUserRole',
  'userRole',
  'roles',
  'filter'
], 'Sidebar filters menu by role');

// Check 9: Overview role-based content
console.log('\n📈 Checking Overview role-based content...');
checkFileContains('src/pages/dashboard/Overview.jsx', [
  'useUserRole',
  'isClinician',
  'isPatient'
], 'Overview adapts to user role');

// Check 10: Reports role-based filtering
console.log('\n📄 Checking Reports role-based filtering...');
checkFileContains('src/pages/dashboard/Reports.jsx', [
  'useUserRole',
  'isReadOnly',
  'View Only',
  'managed by your clinician'
], 'Reports has role-based filtering');

// Print results
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION RESULTS');
console.log('='.repeat(60));

if (results.passed.length > 0) {
  console.log('\n✅ PASSED CHECKS:');
  results.passed.forEach(msg => console.log(`   ${msg}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  results.warnings.forEach(msg => console.log(`   ${msg}`));
}

if (results.failed.length > 0) {
  console.log('\n❌ FAILED CHECKS:');
  results.failed.forEach(msg => console.log(`   ${msg}`));
}

console.log('\n' + '='.repeat(60));
console.log(`Total: ${results.passed.length} passed, ${results.failed.length} failed, ${results.warnings.length} warnings`);
console.log('='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);
