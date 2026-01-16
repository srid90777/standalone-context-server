# Standalone Context Server

Cross-platform standalone context server with native module support for ONNX Runtime, LanceDB, and SQLite3.

[![Build and Test](../../actions/workflows/build-and-test.yml/badge.svg)](../../actions/workflows/build-and-test.yml)

## Features

- 🚀 **Cross-Platform**: Linux, Windows, macOS (all x64)
- 🤖 **ONNX Runtime**: Full ML inference support (CUDA on Linux)
- 💾 **LanceDB**: Vector database support
- 📊 **SQLite3**: Embedded database
- 📦 **Single Binary**: No dependencies required at runtime

## Supported Platforms

| Platform | Architecture | ONNX Support | Status |
|----------|--------------|--------------|--------|
| Linux | x64 (AMD64) | Full (CUDA/TensorRT) | ✅ Tested |
| Windows | x64 (AMD64) | CPU | ⚠️ Ready |
| macOS | x64 (Intel) | CPU | ⚠️ Ready |

## Installation

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](../../releases) page.

### Linux
```bash
tar -xzf context-server-linux-x64.tar.gz
cd bin
./index-linux --help
```

### Windows
```cmd
unzip context-server-windows-x64.zip
cd bin
index-win.exe --help
```

### macOS
```bash
tar -xzf context-server-macos-x64.tar.gz
cd bin
./index-macos --help
```

## Building from Source

### Prerequisites

- Node.js 20+
- npm
- Git

### Build Instructions

```bash
# Clone repository
git clone <your-repo-url>
cd standalone-context

# Install dependencies
npm install

# Download ONNX Runtime binaries for all platforms
node scripts/download-onnx-all-platforms.js

# Install cross-platform packages
npm install --no-save --force --ignore-scripts \
  @lancedb/lancedb-win32-x64-msvc \
  @lancedb/lancedb-darwin-x64

# Prepare native modules
node scripts/download-natives.js --platform=linux
node scripts/download-natives.js --platform=windows
node scripts/download-natives.js --platform=macos

# Copy natives to bin directory
cp -r natives bin/natives

# Build for all platforms
npx @yao-pkg/pkg src/index.js \
  -t node20-linux-x64,node20-win-x64,node20-macos-x64 \
  --compress GZip \
  --options no-warnings \
  --assets "natives/**/*,node_modules/@cs/**/*.wasm,src/transformers.js/dist/*.wasm" \
  --out-path bin
```

## Project Structure

```
.
├── bin/                    # Built executables
│   ├── index-linux        # Linux binary
│   ├── index-win.exe      # Windows binary
│   ├── index-macos        # macOS binary
│   └── natives/           # Platform-specific native modules
│       ├── linux/
│       ├── windows/
│       └── macos/
├── scripts/               # Build scripts
│   ├── download-onnx-all-platforms.js
│   ├── download-natives.js
│   └── native-config.js
├── src/                   # Source code
└── .github/workflows/     # CI/CD workflows
```

## Native Modules

### Included Modules

- **ONNX Runtime** - Machine learning inference
  - Linux: Full support (CUDA 11.8, TensorRT)
  - Windows/macOS: CPU only
- **LanceDB** - Vector database for embeddings
- **SQLite3** - Embedded SQL database

### Native Module Details

#### Linux (439 MB natives)
- ONNX Runtime: 5 files (includes CUDA/TensorRT)
- LanceDB: 1 file
- SQLite3: 1 file

#### Windows (144 MB natives)
- ONNX Runtime: 2 files (CPU only)
- LanceDB: 1 file
- SQLite3: 1 file

#### macOS (96 MB natives)
- ONNX Runtime: 1 file (CPU only)
- LanceDB: 1 file
- SQLite3: 1 file

## Development

### Scripts

- `scripts/download-onnx-all-platforms.js` - Downloads ONNX Runtime from GitHub
- `scripts/download-natives.js` - Prepares native modules from node_modules
- `scripts/native-config.js` - Runtime native module loader
- `scripts/build-optimized.sh` - Complete build script

### Testing

```bash
# Test Linux binary
./bin/index-linux --help

# Test on specific platform
npm test
```

## CI/CD

GitHub Actions workflows automatically:
- Build for all platforms
- Test on native runners
- Create distribution packages
- Generate size reports
- Create releases

## Size Information

| Platform | Binary | Natives | Total Package |
|----------|--------|---------|---------------|
| Linux x64 | 250 MB | 439 MB | 461 MB |
| Windows x64 | 237 MB | 144 MB | 257 MB |
| macOS x64 | 244 MB | 96 MB | 250 MB |

**Total**: 968 MB (all 3 platforms)

## Architecture

### x64 (Built & Tested)
All binaries target x64 (AMD64/Intel 64-bit) architecture:
- Linux x64 (AMD64, x86_64)
- Windows x64 (AMD64, x86_64)
- macOS x64 (Intel processors)

### ARM64 (Available)
ARM64 support available but not built by default to reduce size:
- macOS ARM64 (Apple Silicon M1/M2/M3)
- Linux ARM64 (ARM64, aarch64)
- Windows ARM64 (Snapdragon)

To build for ARM64, add targets: `node20-linux-arm64,node20-win-arm64,node20-macos-arm64`

## Technical Details

### Cross-Compilation

Uses [@yao-pkg/pkg](https://www.npmjs.com/package/@yao-pkg/pkg) for cross-compilation:
- Builds all platforms from a single Linux machine
- Downloads platform-specific Node.js binaries automatically
- Bundles assets alongside executable

### Runtime Detection

The `scripts/native-config.js` module:
- Detects platform at runtime (linux/win32/darwin)
- Loads platform-specific native modules
- Configures module resolution paths

## Troubleshooting

### Binary won't execute

**Linux:**
```bash
chmod +x bin/index-linux
```

**macOS:**
```bash
chmod +x bin/index-macos
# May need to allow in System Preferences > Security
```

**Windows:**
- Right-click > Properties > Unblock

### Native modules not found

Ensure the `bin/natives/<platform>/` directory is present next to the executable.

### ONNX not working on Windows/macOS

ONNX Runtime on Windows/macOS is CPU-only. For GPU support, use the Linux build.

## License

[Your License Here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Documentation

- [FINAL_COMPLETE_BUILD.md](FINAL_COMPLETE_BUILD.md) - Complete build documentation
- [CROSS_COMPILATION_GUIDE.md](CROSS_COMPILATION_GUIDE.md) - Cross-compilation guide
- [QUICK_SUMMARY.txt](QUICK_SUMMARY.txt) - Quick reference

## Support

For issues, questions, or contributions, please open an issue or pull request.
