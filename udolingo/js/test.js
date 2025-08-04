/**
 * Test Module for Udolingo v1.0
 */

import { StringUtils, ArrayUtils, ValidationUtils, PlatformUtils } from './utils/helpers.js';
import { LZString } from './utils/lz-string.js';

export class UdolingoTests {
    static runBasicTests() {
        console.group('Running Udolingo Basic Tests');
        
        try {
            console.log('Testing StringUtils...');
            console.assert(StringUtils.removePunctuation(null) === '', 'removePunctuation handles null');
            console.assert(StringUtils.removePunctuation(undefined) === '', 'removePunctuation handles undefined');
            console.assert(StringUtils.removePunctuation('Hello, world!') === 'Hello world', 'removePunctuation works normally');
            console.assert(StringUtils.splitSentence(null).length === 0, 'splitSentence handles null');
            console.assert(StringUtils.splitSentenceClean('Hello, world!').length === 2, 'splitSentenceClean works');
            
            console.log('Testing LZString compression...');
            const testData = { test: 'data', number: 123 };
            const compressed = LZString.compressToBase64(JSON.stringify(testData));
            const decompressed = JSON.parse(LZString.decompressFromBase64(compressed));
            console.assert(decompressed.test === 'data', 'LZString compression/decompression works');
            
            console.log('Testing ValidationUtils...');
            const validConfig = {
                exercises: [{ A: 'Hello', B: 'Hola' }],
                'langA-B': ['en', 'es']
            };
            console.assert(ValidationUtils.isValidLessonConfig(validConfig) === true, 'Valid config is recognized');
            console.assert(ValidationUtils.isValidLessonConfig(null) === false, 'Null config is rejected');
            
            console.log('Testing PlatformUtils...');
            console.assert(typeof PlatformUtils.isMobile() === 'boolean', 'isMobile returns boolean');
            console.assert(typeof PlatformUtils.hasLocalStorage() === 'boolean', 'hasLocalStorage returns boolean');
            
            console.log('All basic tests passed!');
            
        } catch (error) {
            console.error('Test failed:', error);
        }
        
        console.groupEnd();
    }
    
    static testErrorHandling() {
        console.group('Testing Error Handling');
        
        try {
            StringUtils.removePunctuation(123);
            StringUtils.splitSentence({});
            ArrayUtils.shuffle('not an array');
            
            console.log('Error handling tests passed!');
        } catch (error) {
            console.error('Error handling test failed:', error);
        }
        
        console.groupEnd();
    }
}

if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        UdolingoTests.runBasicTests();
        UdolingoTests.testErrorHandling();
    });
}