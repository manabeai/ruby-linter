// Import WASI polyfill
import { WASI, File, OpenFile, PreopenDirectory } from 'https://unpkg.com/@bjorn3/browser_wasi_shim@0.3.0/dist/index.js';

let wasmModule = null;
let wasmInstance = null;

async function initWasm() {
    const statusEl = document.getElementById('status');
    const lintButton = document.getElementById('lintButton');
    
    try {
        statusEl.textContent = 'Loading WASM module...';
        
        // Create WASI instance with minimal configuration
        const wasi = new WASI({
            args: [],
            env: {},
            preopens: {
                '/': new PreopenDirectory([])
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
        if (!wasmInstance || !wasmInstance.exports.lint_ruby) {
            throw new Error('WASM module not properly loaded or lint_ruby function not found');
        }
        
        // Convert string to UTF-8 bytes
        const encoder = new TextEncoder();
        const codeBytes = encoder.encode(rubyCode);
        
        // Allocate memory for the input string
        const memory = wasmInstance.exports.memory;
        const malloc = wasmInstance.exports.__wbindgen_malloc;
        const free = wasmInstance.exports.__wbindgen_free;
        
        if (!malloc || !free) {
            throw new Error('Memory allocation functions not found in WASM exports');
        }
        
        // Allocate memory for the string
        const ptr = malloc(codeBytes.length);
        
        // Copy the string to WASM memory
        const wasmMemory = new Uint8Array(memory.buffer);
        wasmMemory.set(codeBytes, ptr);
        
        // Call the lint_ruby function
        const resultPtr = wasmInstance.exports.lint_ruby(ptr, codeBytes.length);
        
        // Read the result string from memory
        const resultLength = wasmInstance.exports.__wbindgen_export_0(resultPtr);
        const resultBytes = new Uint8Array(memory.buffer, resultPtr, resultLength);
        const decoder = new TextDecoder();
        const resultJson = decoder.decode(resultBytes);
        
        // Free the allocated memory
        free(ptr, codeBytes.length);
        free(resultPtr, resultLength);
        
        // Parse and display the results
        const result = JSON.parse(resultJson);
        displayResults(result);
        
    } catch (error) {
        resultsEl.innerHTML = `<span class="error">Error: ${error.message}</span>`;
        console.error('Linting error:', error);
    }
}

function displayResults(result) {
    const resultsEl = document.getElementById('results');
    let html = '';
    
    // Display errors
    if (result.errors && result.errors.length > 0) {
        html += '<div class="error">Errors:</div>\n';
        result.errors.forEach(error => {
            html += `  • ${error}\n`;
        });
        html += '\n';
    } else {
        html += '<div class="success">No errors found!</div>\n\n';
    }
    
    // Display warnings
    if (result.warnings && result.warnings.length > 0) {
        html += '<div class="warning">Warnings:</div>\n';
        result.warnings.forEach(warning => {
            html += `  • ${warning}\n`;
        });
        html += '\n';
    } else {
        html += '<div class="success">No warnings found!</div>\n\n';
    }
    
    // Optionally display parse tree (collapsed by default)
    if (result.parse_dump) {
        html += '<details>\n';
        html += '  <summary>Parse Tree (click to expand)</summary>\n';
        html += '  <pre>' + result.parse_dump + '</pre>\n';
        html += '</details>';
    }
    
    resultsEl.innerHTML = html;
}

// Initialize when page loads
window.addEventListener('load', initWasm);

// Add event listener to lint button
document.getElementById('lintButton').addEventListener('click', lintCode);