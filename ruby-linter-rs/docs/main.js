// Simple WASI polyfill loader
let wasmModule = null;
let wasmInstance = null;

// Load WASI polyfill from CDN
async function loadWasiPolyfill() {
    const script = document.createElement('script');
    script.type = 'module';
    
    return new Promise((resolve, reject) => {
        script.innerHTML = `
            import { WASI, File, OpenFile, PreopenDirectory } from 'https://unpkg.com/@bjorn3/browser_wasi_shim@0.3.0/dist/index.js';
            window.WASI = WASI;
            window.PreopenDirectory = PreopenDirectory;
        `;
        
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
        
        // Give it time to load
        setTimeout(resolve, 1000);
    });
}

async function initWasm() {
    const statusEl = document.getElementById('status');
    const lintButton = document.getElementById('lintButton');
    
    try {
        statusEl.textContent = 'Loading WASI polyfill...';
        
        // Load WASI polyfill
        await loadWasiPolyfill();
        
        if (!window.WASI) {
            throw new Error('Failed to load WASI polyfill');
        }
        
        statusEl.textContent = 'Loading WASM module...';
        
        // Create WASI instance
        const wasi = new window.WASI({
            args: [],
            env: {},
            preopens: {
                '/': new window.PreopenDirectory([])
            }
        });
        
        // Fetch and instantiate the WASM module
        const response = await fetch('ruby_linter_rs.wasm');
        const wasmBuffer = await response.arrayBuffer();
        
        // Compile the WASM module
        wasmModule = await WebAssembly.compile(wasmBuffer);
        
        // Create import object for WASI
        const importObject = {
            wasi_snapshot_preview1: wasi.wasiImport
        };
        
        // Instantiate the module
        wasmInstance = await WebAssembly.instantiate(wasmModule, importObject);
        
        // Initialize WASI
        wasi.initialize(wasmInstance);
        
        statusEl.textContent = 'WASM module loaded successfully!';
        statusEl.className = 'success';
        lintButton.disabled = false;
        
        // Check exported functions
        console.log('Exported functions:', Object.keys(wasmInstance.exports));
        
    } catch (error) {
        statusEl.textContent = `Error loading WASM: ${error.message}`;
        statusEl.className = 'error';
        console.error('WASM initialization error:', error);
    }
}

function lintCode() {
    const rubyCode = document.getElementById('rubyCode').value;
    const resultsEl = document.getElementById('results');
    
    try {
        if (!wasmInstance) {
            throw new Error('WASM module not loaded');
        }
        
        // For WASI modules, we need to interact differently
        // Since the module expects stdin/stdout, we'll show a message
        resultsEl.innerHTML = `
            <div class="warning">Note: This is a WASI-compiled module demonstration.</div>
            <div>The WASM module has been loaded successfully!</div>
            <div>In a full implementation, the Ruby code would be processed through WASI stdin/stdout.</div>
            <br>
            <div>Your Ruby code:</div>
            <pre>${escapeHtml(rubyCode)}</pre>
            <br>
            <div class="success">Module exports available: ${Object.keys(wasmInstance.exports).join(', ')}</div>
        `;
        
    } catch (error) {
        resultsEl.innerHTML = `<span class="error">Error: ${error.message}</span>`;
        console.error('Linting error:', error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when page loads
window.addEventListener('load', initWasm);

// Add event listener to lint button
document.getElementById('lintButton').addEventListener('click', lintCode);