# Ruby Linter WASM

RubyコードをWebAssemblyで解析するlinterです。

## 必要なツール

- Rust (rustup経由でインストール)
- WASI SDK
- Python 3 (Webサーバー用)

## セットアップ手順

### 1. 依存関係のインストール

```bash
# WASM targetを追加
rustup target add wasm32-wasi

# wasm-packをインストール（オプション）
cargo install wasm-pack
```

### 2. WASI SDKのインストール

```bash
# WASI SDKをダウンロード
wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-24/wasi-sdk-24.0-x86_64-linux.tar.gz

# 解凍
tar -xzf wasi-sdk-24.0-x86_64-linux.tar.gz
```

### 3. WASMモジュールのビルド

```bash
# WASI SDK pathを設定してビルド
export WASI_SDK_PATH=$(pwd)/wasi-sdk-24.0-x86_64-linux
cargo build --target wasm32-wasi --lib
```

### 4. Web UIのセットアップ

```bash
# webディレクトリを作成
mkdir -p web

# WASMファイルをコピー
cp target/wasm32-wasi/debug/ruby_linter_rs.wasm web/
```

### 5. Webサーバーの起動

#### 方法1: Python HTTPサーバー
```bash
cd web
python3 -m http.server 8000
```

#### 方法2: Node.js http-server
```bash
cd web
npx http-server -p 8000
```

#### 方法3: Ruby WEBrick
```bash
cd web
ruby -run -e httpd . -p 8000
```

いずれかのコマンドを実行後、ブラウザで `http://localhost:8000/` にアクセスすると、Ruby Linter UIが表示されます。

**注意**: `file://`プロトコルで直接HTMLファイルを開くと、ES6モジュールのCORSエラーが発生するため、必ずHTTPサーバー経由でアクセスしてください。

## 使い方

1. 左側のテキストエリアにRubyコードを入力
2. 「Lint Code」ボタンをクリック
3. 右側に解析結果が表示されます：
   - エラー（構文エラーなど）
   - 警告
   - パースツリー（展開可能）

## プロジェクト構造

```
ruby-linter-rs/
├── Cargo.toml          # Rustプロジェクト設定
├── src/
│   ├── main.rs         # CLIバイナリ
│   └── lib.rs          # WASMライブラリ
├── web/
│   ├── index.html      # Web UI
│   ├── main.js         # WASM連携JavaScript
│   ├── server.py       # HTTPサーバー
│   └── ruby_linter_rs.wasm  # ビルド済みWASMモジュール
└── wasi-sdk-24.0-x86_64-linux/  # WASI SDK
```

## 技術詳細

- **ruby-prism**: Rubyコードの解析に使用
- **wasm-bindgen**: RustとJavaScriptの連携
- **WASI**: WebAssembly System Interface（ファイルシステムなどのシステムコール対応）

## Webホスティング

### 静的ホスティングサービスへのデプロイ

Ruby Linter WASMは静的なWebアプリケーションなので、様々なホスティングサービスで公開できます。

#### GitHub Pages

1. プロジェクトリポジトリにwebディレクトリの内容をプッシュ
2. GitHub Pagesを有効化（Settings → Pages）
3. ソースブランチとディレクトリ（/web）を選択

#### Netlify

1. webディレクトリ内のファイルをzipアーカイブに圧縮
2. [Netlify Drop](https://app.netlify.com/drop)にドラッグ&ドロップ
3. 自動的にURLが発行される

#### Vercel

```bash
# Vercel CLIをインストール
npm i -g vercel

# webディレクトリをデプロイ
cd web
vercel
```

### 本番環境向けの最適化

#### 1. WASMファイルの最適化

```bash
# リリースビルドで最適化
cargo build --target wasm32-wasi --lib --release

# wasm-optでさらに最適化（要binaryen）
wasm-opt -O3 target/wasm32-wasi/release/ruby_linter_rs.wasm -o web/ruby_linter_rs.wasm
```

#### 2. 圧縮とキャッシュ設定

Nginxでホスティングする場合の設定例：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/ruby-linter;

    # WASMファイルのMIMEタイプ設定
    location ~ \.wasm$ {
        add_header Content-Type application/wasm;
        gzip_static on;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # その他の静的ファイル
    location / {
        try_files $uri $uri/ =404;
        gzip on;
        gzip_types text/plain text/css application/javascript;
    }
}
```

#### 3. CDN配信

CloudflareやAWS CloudFrontなどのCDNを使用することで、グローバルな配信と高速化が可能です。

### セキュリティ考慮事項

1. **Content Security Policy (CSP)** の設定
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval';">
   ```

2. **HTTPS** の使用を推奨（多くのブラウザでWASMの実行に必要）

3. **入力検証** - クライアントサイドでの処理のため、悪意のあるコードの実行は限定的ですが、適切な入力制限を設定

## トラブルシューティング

### ビルドエラー: `ctype.h not found`

WASI_SDK_PATHが正しく設定されていることを確認してください：

```bash
export WASI_SDK_PATH=/path/to/wasi-sdk-24.0-x86_64-linux
```

### WASMモジュールが読み込めない

1. CORSヘッダーが正しく設定されているか確認
2. ブラウザのコンソールでエラーメッセージを確認
3. WASMファイルが正しい場所にあるか確認