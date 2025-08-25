# Udolingo v1.1

## Project Structure

```
udolingo/
├── index.html                 # Main application HTML
├── welcome.html               # Welcome/landing page
├── instructions.html          # User instructions and guide
├── config.html                # Configuration format documentation
├── vocabulary.html            # Vocabulary management page
├── package.json               # Project configuration
├── config.json                # Default lesson configuration
├── style.css                  # Main application styles
├── config-style.css           # Configuration page styles
├── udolingo-icon.png          # Application icon
├── images/                    # Mascot images
│   ├── udo-normal.png         # Default mascot image
│   ├── udo-happy.png          # Happy mascot image
│   ├── udo-lecture.png        # Lecture mascot image
│   └── udo-reading.png        # Reading mascot image
└── js/
    ├── app.js                 # Main application entry point
    ├── test.js                # Testing utilities
    ├── core/
    │   ├── state.js           # Centralized application state
    │   └── dom.js             # DOM element management
    ├── managers/
    │   ├── ui-manager.js      # User interface operations
    │   ├── sidebar-manager.js # Mobile sidebar handling
    │   ├── config-manager.js  # Lesson configuration management
    │   └── event-manager.js   # Centralized event handling
    ├── features/
    │   ├── direction-manager.js    # Exercise direction handling
    │   ├── exercise-manager.js     # Exercise loading and display
    │   ├── answer-validator.js     # Answer validation and feedback
    │   ├── mistakes-manager.js     # Mistake tracking and analysis
    │   ├── vocabulary-manager.js   # Legacy vocabulary management
    │   ├── vocabulary-box.js       # Modern vocabulary box component
    │   ├── vocabulary-storage.js   # Vocabulary persistence layer
    │   ├── translation-manager.js  # Google Translate integration
    │   └── llm-prompt-generator.js # AI prompt generation
    └── utils/
        ├── helpers.js              # Common utility functions
        ├── url-handler.js          # URL parameter and sharing
        ├── storage-manager.js      # localStorage with compression
        ├── debug-utils.js          # Development and debugging tools
        ├── lz-string.js            # Text compression library
        └── vocabulary-renderer.js  # Vocabulary display utilities
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
- **Vocabulary System**: Modern vocabulary management with box component, storage, and rendering
- **Translation Tools**: Google Translate integration and vocabulary management
- **LLM Integration**: AI prompt generation with extensive language support

### Utility Layer
- **Storage**: Compressed localStorage with quota management
- **URL Handling**: Deep linking and lesson sharing
- **Helpers**: Reusable utility functions
- **Debug Tools**: Development and troubleshooting utilities
- **Compression**: Text compression for efficient storage

## New Features in v1.1

### Enhanced Vocabulary Management
- **Vocabulary Box**: Interactive vocabulary component with collapsible interface
- **Vocabulary Storage**: Persistent vocabulary data with advanced storage capabilities
- **Vocabulary Manager**: Dedicated vocabulary management with advanced filtering and import/export
- **Integration**: Seamless integration with existing translation and exercise systems

### Improved User Experience
- **Welcome Page**: Professional landing page for new users
- **Instructions**: Comprehensive user guide and documentation
- **Visual Assets**: Complete mascot image set for different app states
- **Performance**: Optimized code for more efficiency


## Technical Details

### ES6 Modules
All modules use native ES6 import/export syntax:
```javascript
import { AppState } from '../core/state.js';
import { DOM } from '../core/dom.js';
import { VocabularyBox } from '../features/vocabulary-box.js';
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
- Compressed storage for lessons and vocabulary
- Debounced user interactions

## Getting Started

### For Users
Simply open `index.html` in a modern browser that supports ES6 modules (all browsers from 2018+).

Alternatively, start with the welcome page at `welcome.html` for a guided introduction.

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
- [ ] Test vocabulary box functionality
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

## File Organization

### HTML Pages
- **index.html**: Main application interface
- **welcome.html**: Landing page with app introduction
- **instructions.html**: User guide and tutorials
- **config.html**: Configuration format documentation
- **vocabulary.html**: Dedicated vocabulary management interface

### Core JavaScript
- **app.js**: Application initialization and coordination
- **core/**: Fundamental application infrastructure
- **managers/**: High-level application logic and coordination
- **features/**: Specific functionality implementations
- **utils/**: Shared utilities and helper functions

### Assets
- **style.css**: Main application styles
- **config-style.css**: Configuration page specific styles
- **images/**: Mascot images for different app states
- **udolingo-icon.png**: Application icon

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
- **Social features** and lesson sharing
- **Advanced vocabulary management** with spaced repetition

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

