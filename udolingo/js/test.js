/**
 * Test Module for Udolingo v1.0
 */

import { StringUtils, ArrayUtils, ValidationUtils, DOMUtils, PerformanceUtils, PlatformUtils } from './utils/helpers.js';
import { LZString } from './utils/lz-string.js';

export class UdolingoTests {
    static runBasicTests() {
        console.group('🧪 Running Udolingo Basic Tests');
        
        try {
            // Test StringUtils with null/undefined inputs
            console.log('Testing StringUtils...');
            console.assert(StringUtils.removePunctuation(null) === '', 'removePunctuation handles null');
            console.assert(StringUtils.removePunctuation(undefined) === '', 'removePunctuation handles undefined');
            console.assert(StringUtils.removePunctuation('Hello, world!') === 'Hello world', 'removePunctuation works normally');
            console.assert(StringUtils.splitSentence(null).length === 0, 'splitSentence handles null');
            console.assert(StringUtils.splitSentenceClean('Hello, world!').length === 2, 'splitSentenceClean works');
            
            // Test ArrayUtils
            console.log('Testing ArrayUtils...');
            console.assert(ArrayUtils.getRandomItem(null) === null, 'getRandomItem handles null');
            console.assert(ArrayUtils.getRandomItems([], 5).length === 0, 'getRandomItems handles empty array');
            
            // Test LZString compression
            console.log('Testing LZString compression...');
            const testData = { test: 'data', number: 123 };
            const compressed = LZString.compressToBase64(JSON.stringify(testData));
            const decompressed = JSON.parse(LZString.decompressFromBase64(compressed));
            console.assert(decompressed.test === 'data', 'LZString compression/decompression works');
            
            // Test ValidationUtils
            console.log('Testing ValidationUtils...');
            const validConfig = {
                exercises: [{ A: 'Hello', B: 'Hola' }],
                'langA-B': ['en', 'es']
            };
            console.assert(ValidationUtils.isValidLessonConfig(validConfig) === true, 'Valid config is recognized');
            console.assert(ValidationUtils.isValidLessonConfig(null) === false, 'Null config is rejected');
            
            // Test PlatformUtils
            console.log('Testing PlatformUtils...');
            console.assert(typeof PlatformUtils.isMobile() === 'boolean', 'isMobile returns boolean');
            console.assert(typeof PlatformUtils.hasLocalStorage() === 'boolean', 'hasLocalStorage returns boolean');
            
            console.log('✅ All basic tests passed!');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
        
        console.groupEnd();
    }
    
    static testErrorHandling() {
        console.group('⚠️ Testing Error Handling');
        
        try {
            // Test that functions don't crash with bad inputs
            StringUtils.removePunctuation(123);  // Should convert to string
            StringUtils.splitSentence({});       // Should convert to string
            ArrayUtils.shuffle('not an array');  // Should warn but not crash
            DOMUtils.createElement('');          // Should return null
            
            console.log('✅ Error handling tests passed!');
        } catch (error) {
            console.error('❌ Error handling test failed:', error);
        }
        
        console.groupEnd();
    }
}

// Auto-run tests in development
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        UdolingoTests.runBasicTests();
        UdolingoTests.testErrorHandling();
    });
}