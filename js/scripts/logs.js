class LogManager {
    constructor() {
        this.logsContainer = document.getElementById('logs-container');
        this.logsContent = document.getElementById('logs-content');
        this.clearButton = document.getElementById('clear-logs-button');
        this.toggleButton = document.getElementById('toggle-logs-button');
        this.scrollToBottomButton = document.getElementById('scroll-to-bottom-button');
        this.scrollStatus = document.getElementById('scroll-status');
        this.isHidden = false;
        this.startTime = Date.now();
        this.autoScroll = true;
        this.userScrolling = false;
        this.scrollTimeout = null;
        
        this.setupEventListeners();
        this.interceptNetworkRequests();
        this.interceptConsole();
    }

    setupEventListeners() {
        this.clearButton.addEventListener('click', () => this.clearLogs());
        this.toggleButton.addEventListener('click', () => this.toggleLogs());
        this.scrollToBottomButton.addEventListener('click', () => this.scrollToBottom());
        
        // Monitor scroll events to detect user scrolling
        this.logsContainer.addEventListener('scroll', () => this.onScroll());
        
        // Monitor wheel events to detect manual scrolling
        this.logsContainer.addEventListener('wheel', () => this.onUserScroll());
        
        // Monitor keyboard events for navigation
        this.logsContainer.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown') {
                this.onUserScroll();
            }
        });
    }

    onUserScroll() {
        this.userScrolling = true;
        
        // Clear any existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        // Set a timeout to reset user scrolling flag
        this.scrollTimeout = setTimeout(() => {
            this.userScrolling = false;
        }, 1000);
        
        this.updateAutoScrollStatus();
    }

    onScroll() {
        const container = this.logsContainer;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 5; // 5px tolerance
        
        if (isAtBottom && !this.userScrolling) {
            this.autoScroll = true;
        } else if (!isAtBottom && this.userScrolling) {
            this.autoScroll = false;
        }
        
        this.updateAutoScrollStatus();
    }

    updateAutoScrollStatus() {
        if (this.autoScroll) {
            this.scrollStatus.classList.remove('active');
            this.scrollToBottomButton.style.display = 'none';
        } else {
            this.scrollStatus.classList.add('active');
            this.scrollToBottomButton.style.display = 'inline-block';
        }
    }

    scrollToBottom() {
        this.autoScroll = true;
        this.userScrolling = false;
        this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
        this.updateAutoScrollStatus();
        
        // Clear any existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }

    formatTimestamp(timestamp = Date.now()) {
        const elapsed = timestamp - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const milliseconds = elapsed % 1000;
        
        return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}]`;
    }

    addLog(level, message, timestamp = Date.now()) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${level.toLowerCase()}`;
        
        logEntry.innerHTML = `
            <span class="log-timestamp">${this.formatTimestamp(timestamp)}</span>
            <span class="log-level">[${level.toUpperCase()}]</span>
            <span class="log-message">${this.escapeHtml(message)}</span>
        `;
        
        this.logsContent.appendChild(logEntry);
        
        // Auto-scroll to bottom only if auto-scroll is enabled
        if (this.autoScroll) {
            this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
        }
        
        // Limit logs to prevent memory issues
        const maxLogs = 1000;
        const logs = this.logsContent.children;
        if (logs.length > maxLogs) {
            this.logsContent.removeChild(logs[0]);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearLogs() {
        this.logsContent.innerHTML = `
            <div class="log-entry info">
                <span class="log-timestamp">${this.formatTimestamp()}</span>
                <span class="log-level">[INFO]</span>
                <span class="log-message">Logs cleared</span>
            </div>
        `;
        this.startTime = Date.now();
        this.autoScroll = true;
        this.userScrolling = false;
        this.updateAutoScrollStatus();
        
        // Clear any existing timeout
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }

    toggleLogs() {
        this.isHidden = !this.isHidden;
        this.logsContainer.classList.toggle('hidden', this.isHidden);
        this.toggleButton.textContent = this.isHidden ? 'Show Logs' : 'Hide Logs';
    }

    interceptConsole() {
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };

        // Override console methods
        console.log = (...args) => {
            originalConsole.log.apply(console, args);
            this.addLog('info', args.join(' '));
        };

        console.info = (...args) => {
            originalConsole.info.apply(console, args);
            this.addLog('info', args.join(' '));
        };

        console.warn = (...args) => {
            originalConsole.warn.apply(console, args);
            this.addLog('warn', args.join(' '));
        };

        console.error = (...args) => {
            originalConsole.error.apply(console, args);
            this.addLog('error', args.join(' '));
        };

        console.debug = (...args) => {
            originalConsole.debug.apply(console, args);
            this.addLog('debug', args.join(' '));
        };
    }

    interceptNetworkRequests() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            const method = options.method || 'GET';
            
            let urlString;
            if (typeof url === 'string') {
                urlString = url;
            } else if (url instanceof URL) {
                urlString = url.href;
            } else {
                urlString = 'unknown';
            }
            
            const timestamp = Date.now();
            
            this.addLog('network', `${method} ${urlString}`, timestamp);
            
            try {
                const response = await originalFetch.apply(window, args);
                this.addLog('network', `${method} ${urlString} - ${response.status} ${response.statusText}`, Date.now());
                return response;
            } catch (error) {
                this.addLog('error', `${method} ${urlString} - Network Error: ${error.message}`, Date.now());
                throw error;
            }
        };

        // Intercept XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            let method, url, timestamp;
            
            xhr.open = function(m, u, ...args) {
                method = m;
                url = u?.toString() || 'unknown';
                return originalOpen.apply(this, [m, u, ...args]);
            };
            
            xhr.send = function(...args) {
                timestamp = Date.now();
                logManager.addLog('network', `${method} ${url}`, timestamp);
                
                const originalOnReadyStateChange = xhr.onreadystatechange;
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        logManager.addLog('network', `${method} ${url} - ${xhr.status} ${xhr.statusText}`, Date.now());
                    }
                    if (originalOnReadyStateChange) {
                        originalOnReadyStateChange.apply(this, arguments);
                    }
                };
                
                return originalSend.apply(this, args);
            };
            
            return xhr;
        };
    }

    logPlayerEvent(eventType, eventData = {}) {
        const message = `Player Event: ${eventType} ${JSON.stringify(eventData)}`;
        this.addLog('info', message);
    }

    logPlayerError(error) {
        const message = `Player Error: ${error.message || error}`;
        this.addLog('error', message);
    }

    logPlayerState(state) {
        this.addLog('info', `Player State: ${state}`);
    }
}

// Create global instance
let logManager;

export function initializeLogs() {
    logManager = new LogManager();
    return logManager;
}

export function getLogManager() {
    return logManager;
}
