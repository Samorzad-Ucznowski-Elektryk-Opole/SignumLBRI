// Type definitions for missing elements
import { Request, Response } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    flashError: (err?: any, msg?: string | string[], redirect?: boolean) => void;
    language?: string;
    flash?: (type: string, message?: string) => any;
  }
}

declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}
