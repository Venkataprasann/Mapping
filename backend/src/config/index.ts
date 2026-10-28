import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'syncroute-super-secret-key',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_SERVER_API_KEY || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  }
};
