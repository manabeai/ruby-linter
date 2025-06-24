# Ruby Linter WASM デプロイメントガイド

## 静的ホスティングサービスへのデプロイ

Ruby Linter WASMは静的なWebアプリケーションなので、様々なホスティングサービスで公開できます。

### 1. GitHub Pages

#### 手順:
1. GitHubにリポジトリを作成・プッシュ
2. Settings → Pages に移動
3. SourceでブランチとフォルダーまたはGitHub Actionsを選択
4. `docs/` フォルダーを選択またはルートディレクトリの場合はカスタムワークフローを作成

#### GitHub Actions ワークフロー例:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        target: wasm32-wasi
    
    - name: Install WASI SDK
      run: |
        wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-24/wasi-sdk-24.0-x86_64-linux.tar.gz
        tar -xzf wasi-sdk-24.0-x86_64-linux.tar.gz
        echo "WASI_SDK_PATH=$(pwd)/wasi-sdk-24.0-x86_64-linux" >> $GITHUB_ENV
    
    - name: Build WASM
      run: cargo build --target wasm32-wasi --lib --release
    
    - name: Copy files
      run: |
        mkdir -p public
        cp docs/*.html public/
        cp docs/*.js public/
        cp target/wasm32-wasi/release/ruby_linter_rs.wasm public/
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./public
```

### 2. Netlify

#### 手順:
1. `docs/` ディレクトリの内容をzipファイルに圧縮
2. [Netlify Drop](https://app.netlify.com/drop) にアクセス
3. zipファイルをドラッグ&ドロップ
4. 自動的にURLが発行される

#### Netlify.toml設定例:
```toml
[build]
  publish = "docs"

[[headers]]
  for = "*.wasm"
  [headers.values]
    Content-Type = "application/wasm"
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.js"
  [headers.values]
    Content-Type = "application/javascript"

[build.environment]
  WASI_SDK_PATH = "./wasi-sdk-24.0-x86_64-linux"

[build.command]
  "wget https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-24/wasi-sdk-24.0-x86_64-linux.tar.gz && tar -xzf wasi-sdk-24.0-x86_64-linux.tar.gz && cargo build --target wasm32-wasi --lib --release && cp target/wasm32-wasi/release/ruby_linter_rs.wasm docs/"
```

### 3. Vercel

#### CLI経由でのデプロイ:
```bash
# Vercel CLIをインストール
npm i -g vercel

# docsディレクトリをデプロイ
cd docs
vercel
```

#### vercel.json設定例:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "headers": [
    {
      "source": "*.wasm",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        }
      ]
    }
  ]
}
```

### 4. Firebase Hosting

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# プロジェクトを初期化
firebase init hosting

# デプロイ
firebase deploy
```

#### firebase.json設定例:
```json
{
  "hosting": {
    "public": "docs",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "headers": [
      {
        "source": "**/*.wasm",
        "headers": [
          {
            "key": "Content-Type",
            "value": "application/wasm"
          }
        ]
      }
    ]
  }
}
```

## 本番環境向けの最適化

### 1. WASMファイルの最適化

```bash
# リリースビルドで最適化
cargo build --target wasm32-wasi --lib --release

# wasm-optでさらに最適化（要binaryen）
# Ubuntuの場合: sudo apt install binaryen
wasm-opt -O3 target/wasm32-wasi/release/ruby_linter_rs.wasm -o docs/ruby_linter_rs.wasm
```

### 2. コンテンツ配信の最適化

#### Nginx設定例:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ruby-linter;

    # WASMファイルのMIMEタイプとキャッシュ設定
    location ~ \.wasm$ {
        add_header Content-Type application/wasm;
        gzip_static on;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # JavaScript ESモジュール
    location ~ \.js$ {
        add_header Content-Type application/javascript;
        gzip on;
        expires 1d;
    }

    # HTML
    location ~ \.html$ {
        add_header Content-Type text/html;
        gzip on;
        expires 1h;
    }

    # セキュリティヘッダー
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline';";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
}
```

### 3. CDN配信

#### Cloudflare設定:
1. Cloudflareアカウントを作成
2. ドメインを追加
3. Page Rulesでキャッシュ設定を最適化:
   - `*.wasm` ファイル: Edge Cache TTL を1年に設定
   - `*.js` ファイル: Edge Cache TTL を1日に設定

## セキュリティ考慮事項

### 1. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval' https://unpkg.com; 
               style-src 'self' 'unsafe-inline';">
```

### 2. HTTPS必須
- 多くの最新ブラウザでWASMの実行にHTTPSが必要
- Let's Encryptで無料SSL証明書を取得可能

### 3. Cross-Origin設定
```html
<meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
<meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
```

## パフォーマンス監視

### Web Vitals
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### WASM固有の監視
- WASMファイルのダウンロード時間
- WASMインスタンス化時間
- メモリ使用量

### 監視ツール
- Google PageSpeed Insights
- Lighthouse
- WebPageTest

## トラブルシューティング

### よくある問題

1. **CORSエラー**
   - HTTPサーバー経由でアクセスしているか確認
   - 適切なCORSヘッダーが設定されているか確認

2. **WASMロードエラー**
   - MIMEタイプが`application/wasm`に設定されているか確認
   - ファイルサイズと破損をチェック

3. **JavaScript ESモジュールエラー**
   - `type="module"`が設定されているか確認
   - HTTPSまたはlocalhost経由でアクセスしているか確認

### デバッグ方法
- ブラウザの開発者ツールのコンソールでエラーを確認
- Networkタブでリソースのロード状況を確認
- Application/StorageタブでWASMキャッシュの状況を確認