/**
 * Configuration API pour le système COFRAP
 * 
 * IMPORTANT: Ce projet a été migré d'OpenFaaS vers NextJS API Routes
 * 
 * Architecture originale: Fonctions serverless OpenFaaS
 * Architecture actuelle: NextJS API Routes internes
 * 
 * Cette migration permet de faire une démo technique sans déployer OpenFaaS,
 * tout en conservant exactement la même logique métier et les mêmes interfaces.
 * 
 * Variables d'environnement:
 * - NEXT_PUBLIC_USE_NEXTJS_API=true (défaut) : Utilise les API Routes NextJS
 * - NEXT_PUBLIC_USE_NEXTJS_API=false : Utilise les fonctions OpenFaaS
 * - NEXT_PUBLIC_BASE_URL : URL de base pour NextJS (vide par défaut)
 * - NEXT_PUBLIC_OPENFAAS_GATEWAY : Gateway OpenFaaS (fallback)
 */

// Configuration de l'environnement
// Mode NextJS API Routes (remplace OpenFaaS pour la démo)
const USE_NEXTJS_API = process.env.NEXT_PUBLIC_USE_NEXTJS_API !== 'false'; // true par défaut
const OPENFAAS_GATEWAY = process.env.NEXT_PUBLIC_OPENFAAS_GATEWAY || 'http://localhost:8080';
const NEXTJS_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || '';

// Endpoints - NextJS API Routes ou OpenFaaS selon la configuration
export const API_ENDPOINTS = USE_NEXTJS_API ? {
  generatePassword: `${NEXTJS_BASE_URL}/api/generate-password`,
  generate2FA: `${NEXTJS_BASE_URL}/api/generate-2fa`,
  authenticate: `${NEXTJS_BASE_URL}/api/authenticate-user`,
  health: `${NEXTJS_BASE_URL}/api/health`
} : {
  generatePassword: `${OPENFAAS_GATEWAY}/function/generate-password`,
  generate2FA: `${OPENFAAS_GATEWAY}/function/generate-2fa`,
  authenticate: `${OPENFAAS_GATEWAY}/function/authenticate-user`,
  health: `${OPENFAAS_GATEWAY}/function/health`
};

// Configuration par défaut pour les appels fetch
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // 30 secondes timeout
};

// Types de réponses des fonctions OpenFaaS
export interface GeneratePasswordResponse {
  success: boolean;
  password?: string;
  qrcode_base64?: string;
  username?: string;
  generated_at?: string;
  message?: string;
  timestamp?: number;
  error_code?: string;
}

export interface Generate2FAResponse {
  success: boolean;
  totp_uri?: string;
  qrcode_base64?: string;
  username?: string;
  secret_length?: number;
  generated_at?: string;
  instructions?: string;
  message?: string;
  timestamp?: number;
  error_code?: string;
}

export interface AuthenticateResponse {
  success: boolean;
  authenticated?: boolean;
  expired?: boolean;
  username?: string;
  credentials_age_days?: number;
  message?: string;
  timestamp?: number;
  error_code?: string;
  expired_since?: string;
}

export interface HealthResponse {
  success: boolean;
  status?: string;
  service?: string;
  version?: string;
  timestamp?: number;
  uptime_check?: string;
  database_required?: boolean;
  encryption_required?: boolean;
  components?: {
    openfaas?: string;
    python_runtime?: string;
    shared_modules?: string;
  };
  client_info?: string;
  message?: string;
  error_code?: string;
}

// Classe d'erreur personnalisée pour les appels API
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Fonction utilitaire pour les appels API avec gestion d'erreurs
export async function callAPI<T>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<T> {
  try {
    console.log(`🔄 Appel API vers: ${endpoint}`);
    console.log('📤 Données envoyées:', data);

    const response = await fetch(endpoint, {
      method: 'POST',
      ...API_CONFIG,
      ...options,
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    
    console.log('📥 Réponse API:', responseData);

    if (!response.ok) {
      throw new APIError(
        responseData.message || `Erreur HTTP ${response.status}`,
        response.status,
        responseData.error_code,
        responseData
      );
    }

    return responseData as T;

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:', error);
    
    if (error instanceof APIError) {
      throw error;
    }

    // Gestion des erreurs réseau
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(
        'Impossible de contacter le serveur. Vérifiez que OpenFaaS est accessible.',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new APIError(
      'Erreur interne lors de l\'appel API',
      500,
      'INTERNAL_ERROR',
      error
    );
  }
} 