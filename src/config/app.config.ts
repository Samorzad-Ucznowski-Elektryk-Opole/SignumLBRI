/**
 * SignumLBRI Application Configuration - 2025 Ultra Edition
 * The most advanced book marketplace configuration
 * Optimized for ultimate performance, scalability and WOW factor
 */

// Define process for TypeScript without needing @types/node
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV?: 'development' | 'production' | 'test';
    SESSION_SECRET?: string;
    JWT_SECRET?: string;
  };
};

export interface ServerConfig {
  port: number;
  host: string;
  env: 'development' | 'production' | 'test';
  corsOrigins: string[];
  enableCompression: boolean;
  enableWebSockets: boolean;
  enableRealTime: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
  httpsPort?: number;
  enableHttp2: boolean;
  enableGraphQL: boolean;
}

export interface DatabaseConfig {
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      maxIdleTimeMS: number;
      serverSelectionTimeoutMS: number;
      retryWrites: boolean;
      w: 'majority';
      readPreference: 'primaryPreferred';
      authSource: string;
    };
  };
  redis: {
    url: string;
    options: {
      maxRetriesPerRequest: number;
      retryDelayOnFailover: number;
      connectTimeout: number;
      lazyConnect: boolean;
      keyPrefix: string;
    };
  };
  elasticsearch?: {
    node: string;
    auth?: {
      username: string;
      password: string;
    };
    maxRetries: number;
    requestTimeout: number;
  };
}

export interface SecurityConfig {
  session: {
    secret: string;
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  encryption: {
    algorithm: string;
    key: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  templates: {
    from: string;
    replyTo: string;
  };
  features: {
    showMail: boolean;
    queueEnabled: boolean;
  };
}

export interface UIConfig {
  theme: {
    defaultMode: 'light' | 'dark' | 'system';
    brandColors: {
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    typography: {
      fontFamily: {
        sans: string[];
        serif: string[];
        mono: string[];
      };
      fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
        '5xl': string;
        '6xl': string;
      };
    };
    animations: {
      duration: {
        fast: string;
        normal: string;
        slow: string;
      };
      easing: {
        ease: string;
        easeIn: string;
        easeOut: string;
        easeInOut: string;
      };
    };
  };
  features: {
    darkMode: boolean;
    animations: boolean;
    reducedMotion: boolean;
    glassmorphism: boolean;
    progressiveWebApp: boolean;
  };
  layout: {
    containerMaxWidth: string;
    sidebarWidth: string;
    headerHeight: string;
    footerHeight: string;
  };
}

export interface FeatureFlags {
  userRegistration: boolean;
  emailVerification: boolean;
  schoolVerification: boolean;
  bookRecommendations: boolean;
  realTimeNotifications: boolean;
  advancedSearch: boolean;
  fileUpload: boolean;
  socialLogin: boolean;
  multiLanguage: boolean;
  analytics: boolean;
}

export interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
  email: EmailConfig;
  ui: UIConfig;
  features: FeatureFlags;
  version: string;
  buildTimestamp: string;
}

// Default configuration with ultra-modern settings for WOW factor
const defaultConfig: AppConfig = {
  server: {
    port: 3000,
    host: 'localhost',
    env: 'development',
    corsOrigins: ['http://localhost:8080', 'https://localhost:8443'],
    enableCompression: true,
    enableWebSockets: true,
    enableRealTime: true,
    enableHttp2: true,
    enableGraphQL: true,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100,
    httpsPort: 8443
  },

  database: {
    mongodb: {
      uri: 'mongodb://signum_admin:signum_2025_secure@mongo:27017/signumlbri?authSource=admin',
      options: {
        maxPoolSize: 20,
        minPoolSize: 5,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primaryPreferred',
        authSource: 'admin'
      }
    },
    redis: {
      url: 'redis://:signum_redis_2025@redis:6379/0',
      options: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        connectTimeout: 10000,
        lazyConnect: true,
        keyPrefix: 'signum:'
      }
    },
    elasticsearch: {
      node: 'http://elasticsearch:9200',
      maxRetries: 3,
      requestTimeout: 30000
    }
  },

  security: {
    session: {
      secret: process.env.SESSION_SECRET || 'change-this-in-production-ultra-secure-2025',
      maxAge: 86400000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'ultra-secure-jwt-secret-2025-signum-lbri',
      expiresIn: '15m',
      refreshExpiresIn: '7d'
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      key: 'change-this-32-character-key-now!'
    },
    rateLimit: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100
    }
  },

  email: {
    smtp: {
      host: 'localhost',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    },
    templates: {
      from: 'SignumLBRI <noreply@signumlbri.edu>',
      replyTo: 'support@signumlbri.edu'
    },
    features: {
      showMail: false,
      queueEnabled: false
    }
  },

  ui: {
    theme: {
      defaultMode: 'system',
      brandColors: {
        primary: '#3B82F6',     // Blue-500
        secondary: '#6366F1',   // Indigo-500  
        accent: '#F59E0B',      // Amber-500
        neutral: '#6B7280',     // Gray-500
        success: '#10B981',     // Emerald-500
        warning: '#F59E0B',     // Amber-500
        error: '#EF4444',       // Red-500
        info: '#3B82F6'         // Blue-500
      },
      typography: {
        fontFamily: {
          sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
          serif: ['Merriweather', 'Georgia', 'serif'],
          mono: ['JetBrains Mono', 'Monaco', 'Consolas', 'monospace']
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
          '6xl': '3.75rem'
        }
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    },
    features: {
      darkMode: true,
      animations: true,
      reducedMotion: false,
      glassmorphism: true,
      progressiveWebApp: false
    },
    layout: {
      containerMaxWidth: '1280px',
      sidebarWidth: '280px',
      headerHeight: '64px',
      footerHeight: '80px'
    }
  },

  features: {
    userRegistration: true,
    emailVerification: false,
    schoolVerification: false,
    bookRecommendations: false,
    realTimeNotifications: false,
    advancedSearch: false,
    fileUpload: false,
    socialLogin: false,
    multiLanguage: true,
    analytics: false
  },

  version: '2.0.0',
  buildTimestamp: new Date().toISOString()
};

// Singleton configuration instance
let configInstance: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (!configInstance) {
    configInstance = defaultConfig;
  }
  return configInstance;
};

export const updateConfig = (updates: Partial<AppConfig>): AppConfig => {
  configInstance = { ...getConfig(), ...updates };
  return configInstance;
};

export { defaultConfig };
export default getConfig;
