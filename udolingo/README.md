# Udolingo v1.0

## Project Structure

```
udolingo/
├── index.html                 # Main application HTML
├── package.json               # Project configuration
├── js/
│   ├── app.js                 # Main application entry point
│   ├── core/
│   │   ├── state.js           # Centralized application state
│   │   └── dom.js             # DOM element management
│   ├── managers/
│   │   ├── ui-manager.js      # User interface operations
│   │   ├── sidebar-manager.js # Mobile sidebar handling
│   │   ├── config-manager.js  # Lesson configuration management
│   │   └── event-manager.js   # Centralized event handling
│   ├── features/
│   │   ├── direction-manager.js    # Exercise direction handling
│   │   ├── exercise-manager.js     # Exercise loading and display
│   │   ├── answer-validator.js     # Answer validation and feedback
│   │   ├── mistakes-manager.js     # Mistake tracking and analysis
│   │   ├── vocabulary-manager.js   # Vocabulary extraction and translation
│   │   ├── translation-manager.js  # Google Translate integration
│   │   └── llm-prompt-generator.js # AI prompt generation
│   └── utils/
│       ├── helpers.js         # Common utility functions
│       ├── url-handler.js     # URL parameter and sharing
│       ├── storage-manager.js # localStorage with compression
│       └── debug-utils.js     # Development and debugging tools
└── assets/                    # Static files (CSS, images, etc.)
```

## Architecture Overview

### Core Layer
- **State Management**: Centralized application state with clear data flow
- **DOM Abstraction**: Safe DOM manipulation with error handling

### Manager Layer
- **UI Manager**: Handles all user interface updates and interactions
- **Config Manager**: Manages lesson loading, saving, and validation
- **Event Manager**: Centralized event handling and coordination
- **Sidebar Manager**: Mobile responsiveness and sidebar behavior

### Feature Layer
- **Exercise System**: Exercise loading, direction management, and validation
- **Mistake Tracking**: Comprehensive mistake analysis and LLM integration
- **Translation Tools**: Google Translate integration and vocabulary management
- **LLM Integration**: AI prompt generation with extensive language support

### Utility Layer
- **Storage**: Compressed localStorage with quota management
- **URL Handling**: Deep linking and lesson sharing
- **Helpers**: Reusable utility functions
- **Debug Tools**: Development and troubleshooting utilities

## Technical Details

### ES6 Modules
All modules use native ES6 import/export syntax:
```javascript
import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
```

### Dependency Management
- Circular dependencies avoided through dynamic imports where necessary
- Clear dependency hierarchy with minimal coupling
- Singleton pattern for shared state and utilities

### Error Handling
- Comprehensive try-catch blocks in critical operations
- Graceful degradation for missing features
- User-friendly error messages with detailed console logging

### Performance
- Lazy loading of heavy modules
- Efficient DOM manipulation
- Compressed storage for lessons
- Debounced user interactions

## Getting Started

### For Users
Simply open `index.html` in a modern browser that supports ES6 modules (all browsers from 2018+).

### For Developers
```bash
# Clone the repository
git clone https://github.com/cainkellye/udolingo

# Navigate to the directory
cd udolingo

# Serve with a local HTTP server (required for ES6 modules)
npx http-server . -p 8080

# Open http://localhost:8080 in your browser
```

### Development Console
The app includes extensive debugging utilities available in the browser console:

```javascript
// Show available debug commands
udolingoDebug.help()

// Show storage information
udolingoDebug.showStorageInfo()

// Clear all saved lessons
udolingoDebug.clearAllLessons()

// Generate share URL
udolingoDebug.generateShareURL()

// Export data
udolingoDebug.exportData()
```
## Testing

### Manual Testing Checklist
- [ ] Load a lesson from JSON
- [ ] Complete exercises and validate answers
- [ ] Save and load lessons
- [ ] Generate and copy LLM prompts
- [ ] Share lessons via URL
- [ ] Test mistake tracking
- [ ] Verify mobile responsiveness
- [ ] Check vocabulary features
- [ ] Test Google Translate integration

### Debug Console Tests
```javascript
// Test storage operations
udolingoDebug.testPerformance()

// Simulate errors
udolingoDebug.simulateError('storage')

// Validate app state
udolingoDebug.getAppState()
```

## Future Enhancement Possibilities

The modular architecture makes it easy to add:
- **Progressive Web App** (PWA) features
- **Offline support** with service workers
- **Unit testing** framework integration
- **TypeScript** conversion
- **Build optimization** with bundlers
- **Component framework** integration (React, Vue, Svelte)
- **Additional AI providers** beyond OpenAI
- **Advanced analytics** and learning progress tracking

## Development Notes

### Code Style
- ES6+ features throughout
- Functional programming patterns where appropriate
- Clear, descriptive naming conventions
- Comprehensive JSDoc comments
- Consistent error handling patterns

### Performance Considerations
- Lazy loading of non-critical modules
- Efficient DOM queries with caching
- Minimal DOM manipulation
- Compressed storage to reduce memory usage
- Debounced user interactions

### Browser Compatibility
- Modern browsers with ES6 module support
- Graceful fallbacks for older browsers
- No build step required for basic usage
- Optional bundling for production optimization

---

## License

MIT License

## Author

László Lenkei (CainKellye) - 2025

