/**
 * API Cliente pour le système COFRAP
 * Fonctions pour interagir avec les services OpenFaaS d'authentification
 */

import {
  API_ENDPOINTS,
  callAPI,
  APIError,
  GeneratePasswordResponse,
  Generate2FAResponse,
  AuthenticateResponse,
  HealthResponse
} from './api-config';

// Mode simulation pour les tests offline
const SIMULATION_MODE = process.env.NEXT_PUBLIC_SIMULATION_MODE === 'true';

// Données de simulations
const SIMULATION_DATA = {
  users: new Map<string, {
    password: string;
    totp_secret: string;
    created: number;
  }>(),
  
  generateMockPassword: () => "Xp9K#mL2@vN8$wQ4!rT6^eY1",
  generateMockQR: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  generateMockTOTPURI: (username: string) => `otpauth://totp/COFRAP:${username}?secret=JBSWY3DPEHPK3PXP&issuer=COFRAP`,
  currentTime: () => Date.now()
};

/**
 * Crée un nouveau compte utilisateur avec génération automatique de mot de passe
 * @param username - Nom d'utilisateur à créer
 * @returns Promesse contenant le mot de passe généré et le QR code
 */
export async function createAccount(username: string): Promise<{
  success: boolean;
  password?: string;
  qrCode?: string;
  message?: string;
  error_code?: string;
}> {
  try {
    // Validation côté client
    if (!username || typeof username !== 'string') {
      throw new APIError('Le nom d\'utilisateur est requis', 400, 'MISSING_USERNAME');
    }

    const trimmedUsername = username.trim().toLowerCase();
    
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      throw new APIError(
        'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères',
        400,
        'INVALID_USERNAME_LENGTH'
      );
    }

    // Mode simulation
    if (SIMULATION_MODE) {
      console.log('🧪 Mode simulation activé pour createAccount');
      
      // Simule l'utilisateur déjà existant
      if (SIMULATION_DATA.users.has(trimmedUsername)) {
        return {
          success: false,
          message: `L'utilisateur ${trimmedUsername} existe déjà`,
          error_code: 'USER_EXISTS'
        };
      }

      // Simule la création
      const mockPassword = SIMULATION_DATA.generateMockPassword();
      const mockQR = SIMULATION_DATA.generateMockQR();
      
      SIMULATION_DATA.users.set(trimmedUsername, {
        password: mockPassword,
        totp_secret: 'JBSWY3DPEHPK3PXP',
        created: SIMULATION_DATA.currentTime()
      });

      return {
        success: true,
        password: mockPassword,
        qrCode: mockQR,
        message: `Compte créé avec succès pour ${trimmedUsername} (mode simulation)`
      };
    }

    // Appel à la fonction OpenFaaS generate-password
    const response = await callAPI<GeneratePasswordResponse>(
      API_ENDPOINTS.generatePassword,
      { username: trimmedUsername }
    );

    if (!response.success) {
      throw new APIError(
        response.message || 'Échec de la génération du mot de passe',
        400,
        response.error_code || 'GENERATION_FAILED'
      );
    }

    // Conversion du QR code base64 en data URL pour l'affichage
    const qrCodeDataUrl = response.qrcode_base64 
      ? `data:image/png;base64,${response.qrcode_base64}`
      : undefined;

    return {
      success: true,
      password: response.password,
      qrCode: qrCodeDataUrl,
      message: response.message || `Compte créé avec succès pour ${trimmedUsername}`
    };

  } catch (error) {
    if (error instanceof APIError) {
      return {
        success: false,
        message: error.message,
        error_code: error.code
      };
    }

    return {
      success: false,
      message: 'Erreur lors de la création du compte',
      error_code: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Génère un secret TOTP et QR code pour l'authentification à deux facteurs
 * @param username - Nom d'utilisateur pour lequel générer le 2FA
 * @returns Promesse contenant l'URI TOTP et le QR code
 */
export async function generate2FA(username: string): Promise<{
  success: boolean;
  secret?: string;
  qrCode?: string;
  instructions?: string;
  message?: string;
  error_code?: string;
}> {
  try {
    // Validation côté client
    if (!username || typeof username !== 'string') {
      throw new APIError('Le nom d\'utilisateur est requis', 400, 'MISSING_USERNAME');
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Mode simulation
    if (SIMULATION_MODE) {
      console.log('🧪 Mode simulation activé pour generate2FA');
      
      // Vérifie si l'utilisateur existe
      if (!SIMULATION_DATA.users.has(trimmedUsername)) {
        return {
          success: false,
          message: `Utilisateur ${trimmedUsername} non trouvé. Créez d'abord le compte.`,
          error_code: 'USER_NOT_FOUND'
        };
      }

      const mockTOTPURI = SIMULATION_DATA.generateMockTOTPURI(trimmedUsername);
      const mockQR = SIMULATION_DATA.generateMockQR();

      return {
        success: true,
        secret: mockTOTPURI,
        qrCode: mockQR,
        instructions: "Scannez ce code avec Google Authenticator (simulation)",
        message: `2FA configuré avec succès pour ${trimmedUsername} (mode simulation)`
      };
    }

    // Appel à la fonction OpenFaaS generate-2fa
    const response = await callAPI<Generate2FAResponse>(
      API_ENDPOINTS.generate2FA,
      { username: trimmedUsername }
    );

    if (!response.success) {
      throw new APIError(
        response.message || 'Échec de la génération du secret 2FA',
        400,
        response.error_code || 'GENERATION_FAILED'
      );
    }

    // Conversion du QR code base64 en data URL pour l'affichage
    const qrCodeDataUrl = response.qrcode_base64 
      ? `data:image/png;base64,${response.qrcode_base64}`
      : undefined;

    return {
      success: true,
      secret: response.totp_uri, // L'URI TOTP complet pour l'authenticator
      qrCode: qrCodeDataUrl,
      instructions: response.instructions,
      message: response.message || `2FA configuré avec succès pour ${trimmedUsername}`
    };

  } catch (error) {
    if (error instanceof APIError) {
      return {
        success: false,
        message: error.message,
        error_code: error.code
      };
    }

    return {
      success: false,
      message: 'Erreur lors de la configuration 2FA',
      error_code: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Authentifie un utilisateur avec mot de passe et code TOTP
 * @param credentials - Identifiants de l'utilisateur
 * @returns Promesse contenant le résultat de l'authentification
 */
export async function authenticate(credentials: {
  username: string;
  password: string;
  totpCode: string;
}): Promise<{
  success: boolean;
  authenticated?: boolean;
  expired?: boolean;
  message?: string;
  error_code?: string;
  username?: string;
  credentials_age_days?: number;
  expired_since?: string;
}> {
  try {
    // Validation côté client
    const { username, password, totpCode } = credentials;

    if (!username || typeof username !== 'string') {
      throw new APIError('Le nom d\'utilisateur est requis', 400, 'MISSING_USERNAME');
    }

    if (!password || typeof password !== 'string') {
      throw new APIError('Le mot de passe est requis', 400, 'MISSING_PASSWORD');
    }

    if (!totpCode || typeof totpCode !== 'string' || totpCode.length !== 6) {
      throw new APIError('Le code TOTP doit contenir 6 chiffres', 400, 'INVALID_TOTP_CODE');
    }

    if (!/^\d{6}$/.test(totpCode)) {
      throw new APIError('Le code TOTP doit contenir uniquement des chiffres', 400, 'INVALID_TOTP_FORMAT');
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Mode simulation
    if (SIMULATION_MODE) {
      console.log('🧪 Mode simulation activé pour authenticate');
      
      const user = SIMULATION_DATA.users.get(trimmedUsername);
      if (!user) {
        return {
          success: false,
          authenticated: false,
          message: `Utilisateur ${trimmedUsername} non trouvé`,
          error_code: 'USER_NOT_FOUND'
        };
      }

      // Simule la vérification du mot de passe
      if (password !== user.password) {
        return {
          success: false,
          authenticated: false,
          message: 'Mot de passe incorrect',
          error_code: 'INVALID_PASSWORD'
        };
      }

      // Simule la vérification TOTP (accepte 123456 comme code valide)
      if (totpCode !== '123456') {
        return {
          success: false,
          authenticated: false,
          message: 'Code TOTP invalide (utilisez 123456 en simulation)',
          error_code: 'INVALID_TOTP'
        };
      }

      // Simule la vérification d'expiration (6 mois)
      const ageMs = SIMULATION_DATA.currentTime() - user.created;
      const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
      const expired = ageDays > 180; // 6 mois

      if (expired) {
        return {
          success: true,
          authenticated: false,
          expired: true,
          message: 'Compte expiré, renouvellement nécessaire',
          username: trimmedUsername,
          credentials_age_days: ageDays
        };
      }

      return {
        success: true,
        authenticated: true,
        expired: false,
        message: 'Authentification réussie (mode simulation)',
        username: trimmedUsername,
        credentials_age_days: ageDays
      };
    }

    // Appel à la fonction OpenFaaS authenticate-user
    const response = await callAPI<AuthenticateResponse>(
      API_ENDPOINTS.authenticate,
      {
        username: trimmedUsername,
        password: password,
        totp_code: totpCode
      }
    );

    return {
      success: response.success || false,
      authenticated: response.authenticated,
      expired: response.expired,
      message: response.message,
      error_code: response.error_code,
      username: response.username,
      credentials_age_days: response.credentials_age_days,
      expired_since: response.expired_since
    };

  } catch (error) {
    if (error instanceof APIError) {
      return {
        success: false,
        authenticated: false,
        message: error.message,
        error_code: error.code
      };
    }

    return {
      success: false,
      authenticated: false,
      message: 'Erreur lors de l\'authentification',
      error_code: 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Vérifie la connectivité avec le gateway OpenFaaS
 */
export async function checkConnection(): Promise<{
  connected: boolean;
  gateway: string;
  message: string;
  health_data?: any;
}> {
  try {
    const gateway = API_ENDPOINTS.generatePassword.split('/function/')[0];
    
    // Mode simulation
    if (SIMULATION_MODE) {
      return {
        connected: true,
        gateway: gateway + ' (simulation)',
        message: 'Mode simulation activé - pas de connexion réelle'
      };
    }
    
    // Test via la nouvelle fonction health d'abord
    try {
      const healthResponse = await callAPI<HealthResponse>(
        API_ENDPOINTS.health,
        { client_info: 'Frontend connectivity test' }
      );

      if (healthResponse.success) {
        return {
          connected: true,
          gateway: gateway,
          message: `Connecté à ${healthResponse.service || 'OpenFaaS'} v${healthResponse.version || '1.0'}`,
          health_data: healthResponse
        };
      } else {
        return {
          connected: false,
          gateway: gateway,
          message: healthResponse.message || 'Erreur dans la fonction health'
        };
      }
    } catch (healthError) {
      // Fallback sur l'endpoint système d'OpenFaaS
      const response = await fetch(`${gateway}/healthz`, {
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
      });

      return {
        connected: response.ok,
        gateway: gateway,
        message: response.ok 
          ? 'Connexion OpenFaaS établie (fonction health indisponible)' 
          : `Erreur de connexion: ${response.status}`
      };
    }

  } catch (error) {
    return {
      connected: false,
      gateway: API_ENDPOINTS.generatePassword.split('/function/')[0],
      message: 'Impossible de contacter OpenFaaS'
    };
  }
}

/**
 * Vérifie le statut de santé du système COFRAP via la fonction health
 * @returns Promesse contenant les informations de santé du système
 */
export async function getSystemHealth(): Promise<{
  success: boolean;
  health_data?: any;
  message?: string;
  error_code?: string;
}> {
  try {
    console.log('🔄 Vérification de l\'état de santé du système...');
    
    if (SIMULATION_MODE) {
      console.log('🧪 Mode simulation - santé simulée');
      return {
        success: true,
        health_data: {
          status: 'healthy',
          service: 'COFRAP Authentication System (simulation)',
          version: '1.0.0',
          components: {
            openfaas: '✅ Simulé',
            python_runtime: '✅ Simulé',
            shared_modules: '✅ Simulé'
          }
        },
        message: 'Système en bonne santé (mode simulation)'
      };
    }

    const response = await callAPI<HealthResponse>(
      API_ENDPOINTS.health,
      { client_info: 'Frontend health check' }
    );

    if (response.success) {
      console.log('✅ Vérification de santé réussie');
      return {
        success: true,
        health_data: response,
        message: 'Système en bonne santé'
      };
    } else {
      return {
        success: false,
        message: response.message || 'Erreur lors de la vérification de santé',
        error_code: response.error_code
      };
    }

  } catch (error) {
    if (error instanceof APIError) {
      return {
        success: false,
        message: error.message,
        error_code: error.code
      };
    }

    return {
      success: false,
      message: 'Erreur lors de la vérification de santé',
      error_code: 'UNKNOWN_ERROR'
    };
  }
} 