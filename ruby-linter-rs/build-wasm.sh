#!/bin/bash

# Build script for WASM with wasm-bindgen

echo "Building WASM module with wasm-bindgen..."

# Install wasm-bindgen-cli if not installed
if ! command -v wasm-bindgen &> /dev/null; then
    echo "Installing wasm-bindgen-cli..."
    cargo install wasm-bindgen-cli
fi

# Add wasm32-unknown-unknown target if not added
rustup target add wasm32-unknown-unknown

# Build with wasm-bindgen features
echo "Building Rust code to WASM..."
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals' \
  cargo build --target wasm32-unknown-unknown --lib --release

# Generate bindings
echo "Generating JavaScript bindings..."
wasm-bindgen target/wasm32-unknown-unknown/release/ruby_linter_rs.wasm \
  --out-dir web \
  --target web \
  --no-typescript

echo "Build complete! Files generated in web/"
echo "Start a local server and open index.html to test."