default:
    @just --list

# Install dependencies
setup:
    pnpm install

# Start dev server with HMR
dev:
    pnpm vite

# Build for production
build:
    pnpm vite build

# Package into .zip for distribution
package: build
    cd dist && zip -r ../fallen-tweaks.zip .

# Run tests
test:
    pnpm vitest run

# Run tests in watch mode
test-watch:
    pnpm vitest

# Type check
check:
    pnpm tsc --noEmit

# Lint
lint:
    pnpm eslint src/

# Format code
format:
    pnpm prettier --write 'src/**/*.{ts,tsx,css,html}'

# Check formatting (CI-friendly, fails if unformatted)
format-check:
    pnpm prettier --check 'src/**/*.{ts,tsx,css,html}'
