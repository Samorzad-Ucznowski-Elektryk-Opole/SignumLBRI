# 🛠️ SignumLBRI - Development Guide

## 🚀 Quick Start dla Developerów

### ⚡ Super Fast Setup
1. **Sklonuj repo** → `git clone [URL]`
2. **Uruchom autostart** → `autostart.bat`  
3. **Otwórz przeglądarkę** → `http://localhost:3000`
4. **Gotowe!** 🎉

### 🔧 Development Scripts
```bash
# 🚀 Najprostsze uruchomienie (auto-wybór Docker/Node.js)
autostart.bat

# 🔍 Diagnostyka problemów  
diagnoza.bat

# 📋 Menu wyboru opcji
quick-debug.bat

# 🐳 Docker approach
start-local.bat        # Uruchom z Docker
stop-local.bat         # Zatrzymaj kontenery
debug-local.bat        # Diagnostyka Docker

# 📦 Node.js approach (bez Docker)
start-local-nodejs.bat # Uruchom bezpośrednio z Node.js
```

---

## 🏗️ Architektura Aplikacji

### 📁 Struktura Projektu
```
SignumLBRI/
├── 🖥️  src/                    # Backend source code
│   ├── 🎮 controllers/         # Route handlers (MVC Controllers)
│   ├── 📊 models/              # MongoDB models (Mongoose)
│   ├── 🛠️  util/               # Utility functions  
│   ├── 🌍 lang/                # Internationalization
│   └── ⚙️  config/             # Configuration files
├── 📄 views/                   # Frontend templates (Pug)
├── 🎨 public/                  # Static assets (CSS, JS, images)
├── 🐳 docker/                  # Docker configuration
├── 📋 scripts/                 # Development & deployment scripts
└── 📚 docs/                    # Project documentation
```

### 🎯 Tech Stack
- **Backend**: Node.js + TypeScript + Express
- **Database**: MongoDB + Mongoose ODM
- **Frontend**: Pug templates + TailwindCSS + Bootstrap
- **Auth**: Passport.js (Local Strategy)
- **Validation**: Express-validator
- **Build**: Webpack + TypeScript compiler
- **Container**: Docker + Docker Compose

---

## 🧑‍💻 Development Workflow

### 📝 1. Coding Standards

#### TypeScript Configuration
```typescript
// Zawsze używaj strict mode
"strict": true
"noImplicitAny": true  
"strictNullChecks": true

// Preferowane patterns
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Async/await zamiast callbacks
async function getUser(id: string): Promise<UserDocument> {
  return await User.findById(id);
}
```

#### ESLint Rules
```javascript
// Konfiguracja w .eslintrc
"rules": {
  "no-console": "warn",           // Użyj logger zamiast console
  "no-unused-vars": "error",      // Usuń nieużywane zmienne  
  "prefer-const": "error",        // const > let gdy możliwe
  "@typescript-eslint/no-explicit-any": "warn"
}
```

### 🗄️ 2. Database Patterns

#### Mongoose Model Example
```typescript
// models/Book.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface BookDocument extends Document {
  title: string;
  isbn: string;
  publisher: string;
  year: number;
  createdAt: Date;
}

const bookSchema = new Schema<BookDocument>({
  title: { type: String, required: true, maxlength: 200 },
  isbn: { type: String, required: true, unique: true, length: 13 },
  publisher: { type: String, required: true, maxlength: 100 },
  year: { type: Number, required: true, min: 1900, max: 2030 },
}, { timestamps: true });

export const Book = mongoose.model<BookDocument>('Book', bookSchema);
```

#### Query Patterns
```typescript
// ✅ Good - with error handling
async function getBooksBySchool(schoolId: string): Promise<BookDocument[]> {
  try {
    return await BookListing
      .find({ school: schoolId, status: 'accepted' })
      .populate('book')
      .populate('bookOwner', 'profile.name profile.surname')
      .sort({ createdAt: -1 })
      .limit(50);
  } catch (error) {
    logger.error('Failed to fetch books by school', { schoolId, error });
    throw new Error('Database query failed');
  }
}

// ❌ Bad - no error handling, too broad query
function getAllBooks() {
  return BookListing.find({}).populate('book bookOwner school');
}
```

### 🎮 3. Controller Patterns

#### Request Handling
```typescript
// controllers/book.ts
import { Request, Response } from 'express';
import { validationResult, check } from 'express-validator';

export async function createBook(req: Request, res: Response): Promise<void> {
  // 1. Validation
  await check('isbn').isLength({ min: 13, max: 13 }).run(req);
  await check('title').isLength({ min: 1, max: 200 }).run(req);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return req.flashError(null, errors.array());
  }

  try {
    // 2. Authorization check
    if (!req.user.canAddBooks()) {
      return req.flashError(null, req.language.errors.permissionDenied);
    }

    // 3. Business logic
    const bookData = {
      title: req.body.title,
      isbn: req.body.isbn,
      owner: req.user._id,
      school: req.user.school
    };

    const book = new Book(bookData);
    await book.save();

    // 4. Success response
    req.flash('success', { msg: req.language.success.bookCreated });
    res.redirect('/book/manage');
    
  } catch (error) {
    // 5. Error handling
    logger.error('Book creation failed', { userId: req.user._id, error });
    return req.flashError(error, req.language.errors.internal);
  }
}
```

---

## 🧪 Testing Strategy

### 🔬 Unit Tests
```typescript
// tests/controllers/book.test.ts
import { Book } from '../../src/models/Book';
import { createBook } from '../../src/controllers/book';
import { MockRequest, MockResponse } from 'jest-mock-express';

describe('BookController', () => {
  describe('createBook', () => {
    it('should create book with valid data', async () => {
      // Arrange
      const req = new MockRequest({
        body: { title: 'Test Book', isbn: '1234567890123' },
        user: { _id: 'user123', canAddBooks: () => true }
      });
      const res = new MockResponse();

      // Act  
      await createBook(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith('/book/manage');
      expect(Book.findOne({ isbn: '1234567890123' })).toBeTruthy();
    });
  });
});
```

---

## 🔧 Development Commands

### 📦 Package Management
```bash
# Instalacja dependencies
npm install

# Build development
npm run dev

# Build production  
npm run build

# Run tests
npm test

# Security audit
npm run security:audit
```

---

**🎉 Happy Coding! 📚**
