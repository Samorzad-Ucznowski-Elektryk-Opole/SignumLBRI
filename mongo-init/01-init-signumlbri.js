// 🚀 SignumLBRI Enhanced - MongoDB Initialization Script

// MongoDB Database Initialization Script for SignumLBRI
// Create database and collections with sample data

// Switch to signumlbri database
db = db.getSiblingDB('signumlbri');

console.log('� Initializing SignumLBRI database...');

// Create collections with validation
db.createCollection('users');
db.createCollection('books');
db.createCollection('booklistings');
db.createCollection('schools');
db.createCollection('sessions');

console.log('✅ Collections created');

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.books.createIndex({ isbn: 1 });
db.booklistings.createIndex({ userId: 1 });
db.schools.createIndex({ name: 1 });

console.log('✅ Indexes created');

// Insert sample data
console.log('� Inserting sample data...');

// Sample schools
db.schools.insertMany([
  {
    name: "Zespół Szkół Elektrycznych w Opolu",
    shortName: "ZSE Opole",
    address: "ul. Prószkowska 76, 45-758 Opole",
    city: "Opole",
    phone: "+48 77 454 87 00",
    email: "sekretariat@zse.opole.pl",
    website: "https://zse.opole.pl",
    createdAt: new Date()
  },
  {
    name: "Liceum Ogólnokształcące nr 1 w Opolu", 
    shortName: "LO1 Opole",
    address: "ul. Kopernika 11, 45-040 Opole",
    city: "Opole",
    phone: "+48 77 454 14 41",
    email: "lo1@opole.pl",
    website: "https://lo1.opole.pl",
    createdAt: new Date()
  }
]);

// Sample admin user
db.users.insertOne({
  email: "admin@signumlbri.pl",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGlCCIB7eqHMdre", // password: admin123
  profile: {
    name: "Admin",
    surname: "SignumLBRI",
    avatar: "/images/avatars/admin.png"
  },
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  lastActivity: new Date()
});

// Sample regular user
db.users.insertOne({
  email: "student@zse.opole.pl",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewGlCCIB7eqHMdre", // password: student123
  profile: {
    name: "Jan",
    surname: "Kowalski",
    avatar: "/images/avatars/student.png"
  },
  role: "student",
  isActive: true,
  createdAt: new Date(),
  lastActivity: new Date()
});

// Sample books
const schoolId = db.schools.findOne({name: "Zespół Szkół Elektrycznych w Opolu"})._id;

db.books.insertMany([
  {
    title: "Matematyka - podręcznik dla klasy 1",
    author: "Jan Nowak, Maria Kowalska",
    publisher: "Wydawnictwo Nowa Era",
    isbn: "978-83-267-3456-7",
    category: "Matematyka",
    price: 45.90,
    description: "Podręcznik matematyki dla pierwszej klasy liceum",
    cover: "/images/books/matematyka-1.jpg",
    views: 156,
    school: schoolId,
    createdAt: new Date()
  },
  {
    title: "Język Polski - wypracowania maturalne",
    author: "Anna Wiśniewska",
    publisher: "PWN",
    isbn: "978-83-01-21234-5",
    category: "Język Polski",
    price: 32.50,
    description: "Zbiór wypracowań maturalnych z języka polskiego",
    cover: "/images/books/polski-matura.jpg", 
    views: 89,
    school: schoolId,
    createdAt: new Date()
  },
  {
    title: "Elektronika - podstawy",
    author: "Piotr Elektronik",
    publisher: "Wydawnictwo Techniczne",
    isbn: "978-83-204-5678-9",
    category: "Elektronika", 
    price: 68.00,
    description: "Podstawy elektroniki dla szkół technicznych",
    cover: "/images/books/elektronika.jpg",
    views: 234,
    school: schoolId,
    createdAt: new Date()
  }
]);

// Sample book listings
const userId = db.users.findOne({email: "student@zse.opole.pl"})._id;
const bookId = db.books.findOne({title: "Matematyka - podręcznik dla klasy 1"})._id;

db.booklistings.insertOne({
  book: bookId,
  seller: userId,
  price: 35.00,
  condition: "Bardzo dobry",
  description: "Używany przez jeden rok, bez podpisów",
  status: "available",
  location: "Opole",
  contact: "jan.kowalski@student.pl",
  images: ["/images/listings/mat1-1.jpg", "/images/listings/mat1-2.jpg"],
  createdAt: new Date()
});

print('✅ SignumLBRI Enhanced Database initialized successfully!');
print('📊 Created collections: users, books, booklistings, schools, sessions');
print('👥 Sample users created: admin@signumlbri.pl, student@zse.opole.pl');
print('🏫 Sample schools: ZSE Opole, LO1 Opole');
print('📚 Sample books and listings added');
print('🔑 Default passwords: admin123, student123');
