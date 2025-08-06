/**
 * Quick test to verify design system exports are working
 */

// Test imports from design system
try {
  console.log('Testing design system imports...');
  
  // Test main index export
  const designSystem = require('./src/design-system');
  console.log('✅ Design system main export:', Object.keys(designSystem));
  
  // Test tokens export  
  const { DesignTokens } = require('./src/design-system/tokens');
  console.log('✅ DesignTokens named export:', Object.keys(DesignTokens));
  
  // Test default export
  const DesignTokensDefault = require('./src/design-system/tokens').default;
  console.log('✅ DesignTokens default export:', Object.keys(DesignTokensDefault));
  
  // Test accessing borderRadius property that was causing the error
  console.log('✅ BorderRadius values:', DesignTokens.borderRadius);
  
  // Test accessing colors
  console.log('✅ Color values:', Object.keys(DesignTokens.colors));
  
  console.log('🎉 All design system imports working correctly!');
  
} catch (error) {
  console.error('❌ Design system import error:', error.message);
  console.error('Stack:', error.stack);
}
