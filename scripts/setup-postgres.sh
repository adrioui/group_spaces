#!/bin/bash

# Database Setup Script for Testing
# Based on docs/LOCAL_POSTGRES_TESTING.md

set -e

echo "🐘 Setting up PostgreSQL for testing..."

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
            echo "✅ PostgreSQL is running"
            return 0
        fi
    fi
    return 1
}

# Function to setup with Docker (Option A)
setup_docker_postgres() {
    echo "🐳 Setting up PostgreSQL with Docker..."

    # Stop and remove existing container if it exists
    docker stop gs-postgres 2>/dev/null || true
    docker rm gs-postgres 2>/dev/null || true

    # Start PostgreSQL container
    docker run --name gs-postgres \
        -e POSTGRES_USER=dev \
        -e POSTGRES_PASSWORD=dev \
        -e POSTGRES_DB=group_spaces_dev \
        -p 5432:5432 \
        -d postgres:16

    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5

    # Create test database
    echo "📊 Creating test database..."
    docker exec -it gs-postgres psql -U dev -c "CREATE DATABASE group_spaces_test;"

    echo "✅ Docker PostgreSQL setup complete"
}

# Function to setup native PostgreSQL (Option B)
setup_native_postgres() {
    echo "🔧 Setting up native PostgreSQL..."

    # Check if createuser and createdb commands exist
    if ! command -v createuser >/dev/null 2>&1; then
        echo "❌ PostgreSQL client tools not found. Please install PostgreSQL."
        echo "   macOS: brew install postgresql@16"
        echo "   Ubuntu: sudo apt-get install postgresql postgresql-client"
        exit 1
    fi

    # Create user (ignore error if user already exists)
    echo "👤 Creating PostgreSQL user 'dev'..."
    createuser -s dev 2>/dev/null || echo "ℹ️  User 'dev' already exists"

    # Create databases
    echo "📊 Creating databases..."
    createdb -U dev group_spaces_dev 2>/dev/null || echo "ℹ️  Database 'group_spaces_dev' already exists"
    createdb -U dev group_spaces_test 2>/dev/null || echo "ℹ️  Database 'group_spaces_test' already exists"

    echo "✅ Native PostgreSQL setup complete"
}

# Main setup logic
main() {
    # Check if PostgreSQL is already running
    if check_postgres; then
        echo "ℹ️  PostgreSQL is already running, attempting to create test database..."

        # Try to create test database if it doesn't exist
        if command -v psql >/dev/null 2>&1; then
            psql -h localhost -U dev -d group_spaces_dev -c "CREATE DATABASE group_spaces_test;" 2>/dev/null || true
        fi
    else
        echo "🤔 PostgreSQL not running. Choose setup method:"
        echo "1) Docker (recommended)"
        echo "2) Native PostgreSQL"
        read -p "Enter choice (1 or 2): " choice

        case $choice in
            1)
                if command -v docker >/dev/null 2>&1; then
                    setup_docker_postgres
                else
                    echo "❌ Docker not found. Please install Docker or choose option 2."
                    exit 1
                fi
                ;;
            2)
                setup_native_postgres
                ;;
            *)
                echo "❌ Invalid choice"
                exit 1
                ;;
        esac
    fi

    echo ""
    echo "🎉 PostgreSQL setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run migrations: npm run db:migrate"
    echo "2. Seed dev data: npm run db:seed"
    echo "3. Run tests: npm run test"
    echo ""
    echo "Database URLs:"
    echo "  Dev: postgres://dev:dev@localhost:5432/group_spaces_dev"
    echo "  Test: postgres://dev:dev@localhost:5432/group_spaces_test"
}

main "$@"