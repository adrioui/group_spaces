#!/bin/bash

# Database Cleanup Script for Testing
# Truncates or resets test database for clean test runs

set -e

DB_URL="postgres://dev:dev@localhost:5432/group_spaces_test"

echo "🧹 Cleaning test database..."

# Function to truncate all tables (fast isolation)
truncate_tables() {
    echo "📋 Truncating all tables..."

    # Get all table names and truncate them
    psql "$DB_URL" -c "
        DO \$\$
        DECLARE
            r RECORD;
        BEGIN
            -- Disable foreign key checks
            SET session_replication_role = replica;

            -- Truncate all tables
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
            END LOOP;

            -- Re-enable foreign key checks
            SET session_replication_role = DEFAULT;
        END
        \$\$;
    " >/dev/null

    echo "✅ Tables truncated successfully"
}

# Function to drop and recreate database (safer isolation)
recreate_database() {
    echo "🔄 Recreating test database..."

    # Connect to postgres database to drop/create test db
    psql "postgres://dev:dev@localhost:5432/postgres" -c "
        DROP DATABASE IF EXISTS group_spaces_test;
        CREATE DATABASE group_spaces_test;
    " >/dev/null

    echo "✅ Database recreated successfully"
}

# Function to reset with migrations
reset_with_migrations() {
    echo "🔧 Resetting database with fresh migrations..."

    recreate_database

    # Run migrations on test database
    echo "📊 Running migrations..."
    env DATABASE_URL="$DB_URL" npm run db:migrate >/dev/null

    echo "✅ Database reset with migrations complete"
}

# Main cleanup logic
main() {
    case "${1:-truncate}" in
        "truncate")
            truncate_tables
            ;;
        "recreate")
            recreate_database
            ;;
        "reset")
            reset_with_migrations
            ;;
        *)
            echo "Usage: $0 [truncate|recreate|reset]"
            echo ""
            echo "Options:"
            echo "  truncate  - Fast: truncate all tables (default)"
            echo "  recreate  - Medium: drop and recreate database"
            echo "  reset     - Slow: recreate database and run migrations"
            exit 1
            ;;
    esac
}

main "$@"