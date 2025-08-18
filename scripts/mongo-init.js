// MongoDB initialization script for production security
print("Starting MongoDB initialization...");

// Create application database
db = db.getSiblingDB(process.env.MONGO_DB_NAME || 'signumlbri');

// Create application user with limited privileges
db.createUser({
  user: process.env.MONGO_APP_USERNAME || 'signumlbri_user',
  pwd: process.env.MONGO_APP_PASSWORD || 'secure_app_password_2025',
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_DB_NAME || 'signumlbri'
    }
  ]
});

print("Application user created successfully");

// Create collections with validation schemas
print("Creating collections with validation...");

// Schools collection
db.createCollection("schools", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "address", "phone", "email", "createdAt"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 200,
          description: "School name must be a string between 2-200 characters"
        },
        address: {
          bsonType: "string",
          minLength: 5,
          maxLength: 500,
          description: "Address must be a string between 5-500 characters"
        },
        phone: {
          bsonType: "string",
          pattern: "^[0-9+\\-\\s()]+$",
          description: "Phone must contain only digits, +, -, spaces, and parentheses"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address"
        },
        website: {
          bsonType: "string",
          pattern: "^https?://.*",
          description: "Website must be a valid URL"
        },
        active: {
          bsonType: "bool",
          description: "Active status must be boolean"
        }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
});

// Users collection (internal school users)
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "firstName", "lastName", "role", "school", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address"
        },
        password: {
          bsonType: "string",
          minLength: 60,
          maxLength: 60,
          description: "Password must be a bcrypt hash (60 characters)"
        },
        firstName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 50,
          description: "First name must be 1-50 characters"
        },
        lastName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 50,
          description: "Last name must be 1-50 characters"
        },
        role: {
          bsonType: "string",
          enum: ["student", "seller", "admin", "headadmin"],
          description: "Role must be one of: student, seller, admin, headadmin"
        },
        active: {
          bsonType: "bool",
          description: "Active status must be boolean"
        }
      }
    }
  }
});

// Public Users collection (external e-commerce users)
db.createCollection("publicusers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "password", "firstName", "lastName", "phone", "school", "status", "createdAt"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Email must be a valid email address"
        },
        password: {
          bsonType: "string",
          minLength: 60,
          maxLength: 60,
          description: "Password must be a bcrypt hash"
        },
        firstName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 50,
          pattern: "^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\\s\\-']+$",
          description: "First name can contain only letters, spaces, hyphens, and apostrophes"
        },
        lastName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 50,
          pattern: "^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\\s\\-']+$",
          description: "Last name can contain only letters, spaces, hyphens, and apostrophes"
        },
        phone: {
          bsonType: "string",
          pattern: "^[0-9+\\-\\s()]{9,15}$",
          description: "Phone must be 9-15 characters with digits, +, -, spaces, parentheses"
        },
        status: {
          bsonType: "string",
          enum: ["pending", "active", "suspended", "banned", "rejected"],
          description: "Status must be one of: pending, active, suspended, banned, rejected"
        },
        totalBooksPublished: {
          bsonType: "int",
          minimum: 0,
          description: "Total books published must be non-negative integer"
        },
        totalBooksSold: {
          bsonType: "int",
          minimum: 0
        },
        totalMoneyEarned: {
          bsonType: "number",
          minimum: 0
        }
      }
    }
  }
});

// Books collection
db.createCollection("books", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "authors", "isbn", "publisher", "createdAt"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 1,
          maxLength: 500,
          description: "Title must be 1-500 characters"
        },
        authors: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "string",
            minLength: 1,
            maxLength: 100
          },
          description: "Must have at least one author"
        },
        isbn: {
          bsonType: "string",
          pattern: "^(978|979)?[0-9]{10,13}$",
          description: "ISBN must be 10 or 13 digits, optionally with 978/979 prefix"
        },
        publisher: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200
        },
        publishYear: {
          bsonType: "int",
          minimum: 1900,
          maximum: 2030
        },
        pages: {
          bsonType: "int",
          minimum: 1,
          maximum: 10000
        }
      }
    }
  }
});

// BookAds collection (e-commerce listings)
db.createCollection("bookads", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["owner", "book", "school", "originalPrice", "sellingPrice", "condition", "status", "createdAt"],
      properties: {
        originalPrice: {
          bsonType: "number",
          minimum: 0,
          maximum: 10000,
          description: "Original price must be between 0-10000 PLN"
        },
        sellingPrice: {
          bsonType: "number",
          minimum: 0,
          maximum: 10000,
          description: "Selling price must be between 0-10000 PLN"
        },
        condition: {
          bsonType: "string",
          enum: ["nowa", "bardzo-dobry", "dobry", "zadowalający"],
          description: "Condition must be one of the defined values"
        },
        status: {
          bsonType: "string",
          enum: ["draft", "pending_verification", "published", "reserved", "sold", "rejected"],
          description: "Status must be one of the defined workflow states"
        },
        description: {
          bsonType: "string",
          maxLength: 1000,
          description: "Description cannot exceed 1000 characters"
        },
        images: {
          bsonType: "array",
          maxItems: 5,
          items: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._\\-]+\\.(jpg|jpeg|png|webp)$"
          },
          description: "Maximum 5 images, only jpg/png/webp allowed"
        }
      }
    }
  }
});

// ShoppingCarts collection
db.createCollection("shoppingcarts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user", "school", "items", "status", "totalAmount", "createdAt"],
      properties: {
        status: {
          bsonType: "string",
          enum: ["active", "reserved", "completed", "expired", "cancelled"]
        },
        totalAmount: {
          bsonType: "number",
          minimum: 0,
          maximum: 100000
        },
        items: {
          bsonType: "array",
          maxItems: 50,
          description: "Maximum 50 items per cart"
        },
        reservationCode: {
          bsonType: "string",
          pattern: "^[A-Z0-9]{8}$",
          description: "Reservation code must be 8 alphanumeric characters"
        }
      }
    }
  }
});

// Create indexes for performance and uniqueness
print("Creating indexes...");

// Unique indexes
db.schools.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.publicusers.createIndex({ "email": 1 }, { unique: true });
db.books.createIndex({ "isbn": 1 }, { unique: true });

// Compound indexes for queries
db.users.createIndex({ "school": 1, "role": 1 });
db.publicusers.createIndex({ "school": 1, "status": 1 });
db.bookads.createIndex({ "school": 1, "status": 1 });
db.bookads.createIndex({ "owner": 1, "status": 1 });
db.shoppingcarts.createIndex({ "user": 1, "status": 1 });
db.shoppingcarts.createIndex({ "reservationCode": 1 }, { sparse: true });

// Text indexes for search
db.books.createIndex({ 
  "title": "text", 
  "authors": "text", 
  "publisher": "text" 
});

// TTL indexes for cleanup
db.shoppingcarts.createIndex(
  { "reservationExpires": 1 }, 
  { 
    expireAfterSeconds: 0,
    partialFilterExpression: { 
      "status": { $in: ["reserved"] },
      "reservationExpires": { $exists: true }
    }
  }
);

print("Database initialization completed successfully!");

// Create initial admin user if specified
if (process.env.INITIAL_ADMIN_EMAIL && process.env.INITIAL_ADMIN_PASSWORD) {
  print("Creating initial admin user...");
  
  // This will be handled by the application during first startup
  db.system_init.insertOne({
    type: "initial_admin_setup",
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD, // Will be hashed by app
    createdAt: new Date(),
    processed: false
  });
  
  print("Initial admin setup queued for application startup");
}
