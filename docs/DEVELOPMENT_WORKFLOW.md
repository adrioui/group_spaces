# Group Spaces - Development Workflow and Contribution Guide

## Overview

This guide outlines the development workflow, coding standards, and contribution guidelines for the Group Spaces project. Following these guidelines ensures code quality, maintainability, and efficient collaboration among team members.

## Development Philosophy

### Core Principles
- **Code Quality**: Write clean, maintainable, and well-documented code
- **Collaboration**: Use clear communication and proper Git workflows
- **Testing**: Ensure all changes are properly tested
- **Performance**: Optimize for both development and production environments
- **Security**: Follow security best practices at all times

### Development Approach
- **Feature-First**: Focus on delivering complete, functional features
- **Iterative**: Build incrementally with regular commits
- **Test-Driven**: Write tests before or alongside implementation
- **Documentation**: Document as you code, not as an afterthought

## Development Environment Setup

### Prerequisites
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Git**: Latest version
- **Turso CLI**: For database management
- **VS Code**: Recommended IDE with extensions

### IDE Setup (VS Code)
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

### Recommended Extensions
```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-organization/group-spaces.git
cd group-spaces

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local configuration

# Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

## Git Workflow

### Branch Strategy

#### Main Branches
- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Individual features
- **`hotfix/*`**: Emergency fixes

#### Feature Branch Naming
```
feature/{ticket-number}-{feature-description}
bugfix/{ticket-number}-{bug-description}
hotfix/{ticket-number}-{emergency-fix}
```

### Commit Guidelines

#### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no logic change)
- **refactor**: Code refactoring
- **test**: Test additions/modifications
- **chore**: Maintenance tasks

#### Examples
```
feat(auth): add password reset functionality

- Add password reset endpoint
- Implement email verification
- Add reset password UI
- Update documentation

Closes #123

---

feat(notes): implement block reordering via drag and drop

- Add drag and drop functionality to note blocks
- Update API to handle block position changes
- Add visual feedback during dragging
- Update TypeScript interfaces

Closes #456
```

### Pull Request Process

#### PR Checklist
- [ ] Feature is complete and working
- [ ] Code follows style guidelines
- [ ] All tests are passing
- [ ] Documentation is updated
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Peer review completed

#### PR Template
```markdown
## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work)
- [ ] Documentation update

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing tests pass locally
- [ ] Any dependent changes have been merged

## Testing
<!-- Describe testing performed -->

## Screenshots (if applicable)
<!-- Add screenshots to help explain changes -->

## Additional Notes
<!-- Any additional information -->
```

## Coding Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good - Explicit typing
interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
}

// ❌ Bad - Using 'any'
function getUser(id: any) {
  // implementation
}

// ✅ Good - Generic typing
async function fetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  return response.json();
}

interface User {
  id: number;
  email: string;
}

const user = await fetch<User>('/api/user/1');
```

#### Error Handling
```typescript
// ✅ Good - Proper error handling
async function getUser(id: number): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Unable to fetch user');
  }
}

// ❌ Bad - Silent failures
async function getUser(id: number) {
  const response = await fetch(`/api/users/${id}`);
  return response.json(); // Could fail silently
}
```

### React/Next.js Guidelines

#### Component Structure
```typescript
// ✅ Good - Well-structured component
interface TodoListProps {
  items: TodoItem[];
  onItemToggle: (id: number) => void;
  onItemDelete: (id: number) => void;
}

export default function TodoList({ items, onItemToggle, onItemDelete }: TodoListProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <TodoItem
          key={item.id}
          item={item}
          onToggle={onItemToggle}
          onDelete={onItemDelete}
        />
      ))}
    </div>
  );
}

// ❌ Bad - Prop drilling, unclear responsibilities
function TodoList({ items, onToggle, onDelete }) {
  return items.map(item => (
    <div key={item.id}>
      <input type="checkbox" checked={item.completed} onChange={() => onToggle(item.id)} />
      <span>{item.text}</span>
      <button onClick={() => onDelete(item.id)}>Delete</button>
    </div>
  ));
}
```

#### Custom Hooks
```typescript
// ✅ Good - Custom hook for data fetching
function useUser(id: number) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchUser();
    }
  }, [id]);

  return { user, loading, error };
}
```

### API Route Guidelines

#### API Route Structure
```typescript
// ✅ Good - Well-structured API route
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid user ID is required' },
        { status: 400 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user[0]);
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### Input Validation
```typescript
// ✅ Good - Proper input validation
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = createUserSchema.parse(body);

    // Process validated data
    const user = await createUser(validatedData);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('POST user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database Guidelines

#### Schema Usage
```typescript
// ✅ Good - Proper Drizzle ORM usage
import { db } from '@/db';
import { users, spaces, spaceMembers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function getUserSpaces(userId: number) {
  return await db
    .select({
      id: spaces.id,
      name: spaces.name,
      role: spaceMembers.role,
    })
    .from(spaceMembers)
    .innerJoin(spaces, eq(spaceMembers.spaceId, spaces.id))
    .where(
      and(
        eq(spaceMembers.userId, userId),
        eq(spaceMembers.status, 'active')
      )
    )
    .orderBy(desc(spaces.updatedAt));
}
```

#### Query Optimization
```typescript
// ✅ Good - Optimized query with proper indexing
async function getRecentMessages(spaceId: number, limit: number = 50) {
  return await db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
      user: {
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.spaceId, spaceId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}
```

## Testing Guidelines

### Unit Testing
```typescript
// ✅ Good - Unit test example
import { describe, it, expect, beforeEach } from 'vitest';
import { validateEmail } from '@/lib/validation';

describe('validateEmail', () => {
  it('should validate correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });
});
```

### Integration Testing
```typescript
// ✅ Good - Integration test example
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase } from '@/test/setup';
import { createUser, createSpace } from '@/test/factories';

describe('Space API', () => {
  let testDb: any;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('should create a new space', async () => {
    const user = await createUser(testDb, { email: 'test@example.com' });

    const response = await fetch(`${TEST_API_URL}/api/spaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'x-user-id': user.id.toString(),
      },
      body: JSON.stringify({
        name: 'Test Space',
        slug: 'test-space',
        description: 'A test space',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.name).toBe('Test Space');
    expect(data.ownerId).toBe(user.id);
  });
});
```

### E2E Testing
```typescript
// ✅ Good - E2E test example with Playwright
import { test, expect } from '@playwright/test';

test('user can create and edit a note', async ({ page }) => {
  // Sign in
  await page.goto('/sign-in');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="sign-in-button"]');

  // Navigate to space
  await page.click('[data-testid="space-1"]');

  // Create note
  await page.click('[data-testid="create-note"]');
  await page.fill('[data-testid="note-title"]', 'Test Note');
  await page.click('[data-testid="save-note"]');

  // Verify note created
  await expect(page.locator('[data-testid="note-title"]')).toHaveText('Test Note');

  // Add text block
  await page.click('[data-testid="add-text-block"]');
  await page.fill('[data-testid="block-content"]', 'This is a test block');
  await page.click('[data-testid="save-block"]');

  // Verify block added
  await expect(page.locator('[data-testid="block-content"]')).toHaveText('This is a test block');
});
```

## Code Review Process

### Review Checklist
- [ ] Code follows project standards and conventions
- [ ] TypeScript types are correct and comprehensive
- [ ] Error handling is appropriate
- [ ] Performance implications considered
- [ ] Security vulnerabilities addressed
- [ ] Tests are included and comprehensive
- [ ] Documentation is updated
- [ ] Accessibility requirements met
- [ ] Browser compatibility considered

### Review Guidelines
1. **Be Constructive**: Provide specific, actionable feedback
2. **Be Respectful**: Maintain a positive and collaborative tone
3. **Be Thorough**: Review both code and logic
4. **Be Timely**: Respond to reviews within 24 hours
5. **Be Open**: Accept feedback gracefully and discuss alternatives

### Common Review Points
- **Type Safety**: Are types used correctly and comprehensively?
- **Error Handling**: Are edge cases and errors handled properly?
- **Performance**: Could this be optimized for better performance?
- **Security**: Are there any security concerns?
- **Accessibility**: Is the code accessible to all users?
- **Maintainability**: Is the code easy to understand and maintain?
- **Testing**: Are tests comprehensive and appropriate?

## Documentation Standards

### Code Comments
```typescript
// ✅ Good - Clear, useful comments
/**
 * Validates an email address against RFC 5322 standard
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  // Implementation
}

// ❌ Bad - Unnecessary comments
// Function to validate email
function validateEmail(email: string) {
  // Check if email is valid
  return email.includes('@');
}
```

### JSDoc Guidelines
```typescript
// ✅ Good - Complete JSDoc
/**
 * Creates a new user in the database
 * @param userData - User data including email, name, and optional bio
 * @returns Promise<User> - The created user object
 * @throws {Error} If email already exists or validation fails
 * @example
 * const user = await createUser({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   bio: 'Software developer'
 * });
 */
export async function createUser(userData: CreateUserInput): Promise<User> {
  // Implementation
}
```

### README Updates
- Update feature documentation when adding new features
- Update API documentation when changing endpoints
- Update deployment documentation when changing infrastructure
- Update contribution guidelines when changing processes

## Performance Guidelines

### Frontend Optimization
```typescript
// ✅ Good - Optimized component with memoization
import React, { useMemo, memo } from 'react';

interface UserListProps {
  users: User[];
  filter: string;
  onUserSelect: (user: User) => void;
}

const UserList = memo(function UserList({ users, filter, onUserSelect }: UserListProps) {
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  return (
    <div className="space-y-2">
      {filteredUsers.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onSelect={onUserSelect}
        />
      ))}
    </div>
  );
});

// ❌ Bad - Unoptimized component
function UserList({ users, filter, onUserSelect }) {
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      {filteredUsers.map(user => (
        <UserCard key={user.id} user={user} onSelect={onUserSelect} />
      ))}
    </div>
  );
}
```

### Database Optimization
```typescript
// ✅ Good - Optimized database query
async function getActiveUsersInSpace(spaceId: number) {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(spaceMembers)
    .innerJoin(users, eq(spaceMembers.userId, users.id))
    .where(
      and(
        eq(spaceMembers.spaceId, spaceId),
        eq(spaceMembers.status, 'active')
      )
    )
    .orderBy(users.name);
}
```

## Security Guidelines

### Input Validation
```typescript
// ✅ Good - Comprehensive input validation
import { z } from 'zod';

const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message cannot exceed 1000 characters'),
  spaceId: z.number()
    .positive('Space ID must be positive'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    size: z.number().positive(),
  })).optional(),
});

export async function createMessage(input: unknown) {
  const validated = messageSchema.parse(input);
  // Process validated input
}
```

### Authentication Security
```typescript
// ✅ Good - Secure authentication middleware
export function requireAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  const userId = request.headers.get('x-user-id');

  if (!token || !userId) {
    throw new Error('Authentication required');
  }

  // Validate token and user ID
  // Return authenticated user context
}
```

### API Security
```typescript
// ✅ Good - Security headers and rate limiting
export async function GET(request: NextRequest) {
  // Add security headers
  const headers = new Headers({
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  });

  // Implement rate limiting
  if (!rateLimit(request, 100, 60 * 1000)) {
    return new Response('Too many requests', {
      status: 429,
      headers
    });
  }

  // Process request
  const data = await getData();

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}
```

## Release Process

### Version Management
- Use semantic versioning (SemVer)
- Update `package.json` version before release
- Create Git tag for each release
- Maintain changelog

### Release Checklist
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Build successful
- [ ] Security scan passed
- [ ] Performance tests pass

### Deployment Steps
1. Create release branch
2. Update version and changelog
3. Merge to main branch
4. Create Git tag
5. Deploy to staging environment
6. Run integration tests
7. Deploy to production
8. Monitor deployment

## Tools and Utilities

### Development Tools
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/generate-test-data.ts",
    "db:verify": "tsx src/db/verify-test-data.ts",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

### Git Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run linting
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed"
  exit 1
fi

# Run tests
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ All checks passed"
```

## Troubleshooting

### Common Development Issues

#### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf .next/types
npm run dev

# Check TypeScript configuration
npx tsc --noEmit
```

#### Database Issues
```bash
# Reset database
npm run db:migrate:down
npm run db:migrate
npm run db:seed

# Check database connection
turso db show group-spaces
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for dependency issues
npm audit
npm install
```

### Performance Issues
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer .next

# Check for memory leaks
npm run dev
# Use Chrome DevTools to profile memory usage
```

## Community Guidelines

### Communication
- Use clear, descriptive commit messages
- Provide context in pull requests
- Be responsive to code reviews
- Ask questions when unsure
- Share knowledge with the team

### Collaboration
- Review pull requests promptly
- Provide constructive feedback
- Help team members when needed
- Share learning and discoveries
- Participate in team discussions

### Professional Development
- Stay updated with new technologies
- Follow best practices
- Contribute to open source
- Attend conferences and meetups
- Share knowledge through blog posts or talks

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Workflow Status**: Active