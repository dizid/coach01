import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { Agent, fetch as undiciFetch } from 'undici';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Force IPv4 connections to avoid IPv6 timeout issues with Neon
const agent = new Agent({ connect: { family: 4 } });
neonConfig.fetchFunction = (url, opts) => undiciFetch(url, { ...opts, dispatcher: agent });

// Tagged template function for parameterized SQL queries
export const sql = neon(process.env.DATABASE_URL);
