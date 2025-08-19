// Enhanced utility functions for admin controller
// Focus on data processing and validation improvements

/**
 * Enhanced book subject detection with improved accuracy
 * @param title Book title
 * @param author Book author (optional)
 * @returns Detected subject with confidence score
 */
export interface SubjectDetectionResult {
  subject: string;
  confidence: number;
  alternativeSubjects?: string[];
}

export const detectBookSubject = (title: string, author?: string): SubjectDetectionResult => {
  const titleLower = title.toLowerCase();
  const authorLower = author?.toLowerCase() || '';

  // Enhanced subject detection patterns with Polish school subjects
  const subjectPatterns = {
    'Matematyka': {
      keywords: ['matematyka', 'algebra', 'geometria', 'liczby', 'równania', 'funkcje', 'pochodna', 'całka', 'statystyka', 'prawdopodobieństwo', 'trygonometria', 'analiza'],
      authors: ['kiełbasa', 'kurczab', 'nodzyński', 'babiański', 'krysicki', 'włodarski']
    },
    'Język polski': {
      keywords: ['polski', 'literatura', 'lektura', 'gramatyka', 'ortografia', 'składnia', 'poezja', 'dramat', 'epika', 'językoznawstwo', 'stylistyka'],
      authors: ['miłosz', 'mickiewicz', 'słowacki', 'sienkiewicz', 'żeromski', 'herbert', 'szymborska', 'gombrowicz']
    },
    'Historia': {
      keywords: ['historia', 'dzieje', 'chronologia', 'epoka', 'wojna', 'rewolucja', 'cywilizacja', 'starożytność', 'średniowiecze', 'nowożytność', 'współczesność'],
      authors: ['davies', 'tazbir', 'kieniewicz', 'jaroszewski', 'kosman']
    },
    'Geografia': {
      keywords: ['geografia', 'kontynenty', 'kraje', 'klimat', 'relief', 'hydrografia', 'ludność', 'gospodarka', 'kartografia', 'geologia'],
      authors: ['vidal', 'taylor', 'lijewski', 'kondracki']
    },
    'Biologia': {
      keywords: ['biologia', 'anatomia', 'fizjologia', 'genetyka', 'ewolucja', 'ekologia', 'botanika', 'zoologia', 'mikrobiologia', 'biochemia'],
      authors: ['darwin', 'campbell', 'alberts', 'stryer', 'berg']
    },
    'Chemia': {
      keywords: ['chemia', 'pierwiastki', 'związki', 'reakcje', 'kwasy', 'zasady', 'organiczna', 'nieorganiczna', 'stechiometria', 'termodynamika'],
      authors: ['atkins', 'zumdahl', 'housecroft', 'mcmurry']
    },
    'Fizyka': {
      keywords: ['fizyka', 'mechanika', 'termodynamika', 'elektromagnetyzm', 'optyka', 'jądrowa', 'kwantowa', 'fale', 'drgania', 'kinematyka'],
      authors: ['einstein', 'feynman', 'halliday', 'resnick', 'krane']
    },
    'Informatyka': {
      keywords: ['informatyka', 'programowanie', 'algorytmy', 'bazy danych', 'sieci', 'sztuczna inteligencja', 'java', 'python', 'javascript', 'html'],
      authors: ['cormen', 'sedgewick', 'knuth', 'stroustrup']
    },
    'Język angielski': {
      keywords: ['english', 'angielski', 'grammar', 'vocabulary', 'speaking', 'listening', 'reading', 'writing', 'oxford', 'cambridge'],
      authors: ['murphy', 'swan', 'thomson', 'carter', 'mccarthy']
    },
    'Język niemiecki': {
      keywords: ['deutsch', 'niemiecki', 'grammatik', 'wortschatz', 'sprechen', 'hören', 'lesen', 'schreiben'],
      authors: ['dreyer', 'schmitt', 'hall', 'scheiner']
    },
    'WOS': {
      keywords: ['wiedza o społeczeństwie', 'wos', 'socjologia', 'polityka', 'ekonomia', 'prawo', 'etyka', 'filozofia', 'obywatelstwo'],
      authors: ['giddens', 'bauman', 'bourdieu', 'habermas']
    },
    'Wychowanie fizyczne': {
      keywords: ['wychowanie fizyczne', 'sport', 'gimnastyka', 'atletyka', 'piłka', 'pływanie', 'fitness'],
      authors: ['osiński', 'grabowski']
    }
  };

  let bestMatch = { subject: 'Inne', confidence: 0, alternativeSubjects: [] as string[] };
  const alternatives: string[] = [];

  for (const [subject, patterns] of Object.entries(subjectPatterns)) {
    let confidence = 0;
    
    // Check title keywords with weighted importance
    const titleMatches = patterns.keywords.filter(keyword => 
      titleLower.includes(keyword)
    );
    
    // More points for exact matches, less for partial
    for (const match of titleMatches) {
      if (titleLower === match || titleLower.startsWith(match)) {
        confidence += 0.5; // High confidence for exact/start matches
      } else {
        confidence += 0.3; // Lower confidence for contains
      }
    }
    
    // Check author matches with high weight
    const authorMatches = patterns.authors.filter(author => 
      authorLower.includes(author)
    );
    confidence += authorMatches.length * 0.7;
    
    // Normalize confidence to max 1.0
    confidence = Math.min(confidence, 1.0);
    
    if (confidence > 0.2) {
      alternatives.push(subject);
    }
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { 
        subject, 
        confidence,
        alternativeSubjects: alternatives.filter(s => s !== subject).slice(0, 3) // Top 3 alternatives
      };
    }
  }

  return bestMatch;
};

/**
 * Enhanced data sanitization for book imports
 * @param data Raw data object from CSV
 * @returns Sanitized book data
 */
export const sanitizeBookData = (data: any) => {
  const sanitized = {
    title: data.title?.toString().trim() || '',
    author: data.author?.toString().trim() || '',
    isbn: data.isbn?.toString().replace(/[^0-9X-]/g, '') || '',
    publisher: data.publisher?.toString().trim() || '',
    year: undefined as number | undefined,
    price: undefined as number | undefined,
    condition: data.condition?.toString().trim().toLowerCase() || 'good',
    description: data.description?.toString().trim() || '',
    subject: data.subject?.toString().trim() || 'Inne'
  };

  // Enhanced year parsing
  if (data.year) {
    const yearStr = data.year.toString().trim();
    const yearNum = parseInt(yearStr);
    if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= new Date().getFullYear() + 5) {
      sanitized.year = yearNum;
    }
  }

  // Enhanced price parsing
  if (data.price) {
    const priceStr = data.price.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const priceNum = parseFloat(priceStr);
    if (!isNaN(priceNum) && priceNum >= 0 && priceNum <= 1000) { // Reasonable price range
      sanitized.price = Math.round(priceNum * 100) / 100; // Round to 2 decimal places
    }
  }

  // Validate condition
  const validConditions = ['excellent', 'very_good', 'good', 'fair', 'poor'];
  if (!validConditions.includes(sanitized.condition)) {
    sanitized.condition = 'good';
  }

  return sanitized;
};

/**
 * Enhanced ISBN validation
 * @param isbn ISBN string to validate
 * @returns true if valid, false otherwise
 */
export const isValidISBN = (isbn: string): boolean => {
  if (!isbn) return false;
  
  const cleanISBN = isbn.replace(/[^0-9X]/g, '');
  
  // ISBN-10 validation
  if (cleanISBN.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(cleanISBN[i]);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }
    const checkDigit = cleanISBN[9];
    const calculatedCheck = (11 - (sum % 11)) % 11;
    const expectedCheck = calculatedCheck === 10 ? 'X' : calculatedCheck.toString();
    return checkDigit === expectedCheck;
  }
  
  // ISBN-13 validation
  if (cleanISBN.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(cleanISBN[i]);
      if (isNaN(digit)) return false;
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = parseInt(cleanISBN[12]);
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return checkDigit === calculatedCheck;
  }
  
  return false;
};

/**
 * Enhanced text cleaning and normalization
 * @param text Input text
 * @returns Cleaned and normalized text
 */
export const normalizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[""„"]/g, '"') // Normalize quotes
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/–—/g, '-') // Normalize dashes
    .replace(/…/g, '...') // Normalize ellipsis
    .normalize('NFC'); // Unicode normalization
};

/**
 * Enhanced logging for admin actions
 * @param action Action performed
 * @param userId User ID
 * @param details Additional details
 */
export const logAdminAction = (action: string, userId: string, details?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[ADMIN] ${timestamp} - User ${userId} performed ${action}`;
  
  if (details) {
    console.log(logEntry, JSON.stringify(details, null, 2));
  } else {
    console.log(logEntry);
  }
};

/**
 * Enhanced object ID validation
 * @param id String to validate as MongoDB ObjectId
 * @returns true if valid ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};
