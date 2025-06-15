// Simulation des appels API pour le PoC
// Ces fonctions seront remplacées par de vrais appels aux fonctions OpenFaaS

export const mockCreateAccount = async (username: string) => {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Génération d'un mot de passe aléatoire de 24 caractères
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const password = generatePassword()

  // Génération d'un QR code simulé (en réalité, ce serait généré côté backend)
  const qrCodeData = `Password:${password}|User:${username}`
  const qrCodeUrl = await generateQRCode(qrCodeData)

  return {
    success: true,
    password,
    qrCode: qrCodeUrl,
    message: `Compte créé pour ${username}`,
  }
}

export const mockGenerate2FA = async (username: string) => {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Génération d'un secret TOTP simulé
  const generateSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    let secret = ""
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return secret
  }

  const secret = generateSecret()

  // Génération d'un QR code TOTP simulé
  const totpUrl = `otpauth://totp/COFRAP:${username}?secret=${secret}&issuer=COFRAP`
  const qrCodeUrl = await generateQRCode(totpUrl)

  return {
    success: true,
    secret,
    qrCode: qrCodeUrl,
    message: `2FA configuré pour ${username}`,
  }
}

export const mockLogin = async (credentials: {
  username: string
  password: string
  totpCode: string
}) => {
  // Simulation d'un délai réseau
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulation de différents scénarios
  const scenarios = [
    { success: true, message: "Authentification réussie ! Bienvenue dans le système COFRAP." },
    {
      success: false,
      expired: true,
      message: "Votre compte a expiré. Veuillez créer un nouveau compte pour continuer.",
    },
    { success: false, message: "Identifiants incorrects ou code 2FA invalide." },
  ]

  // Sélection aléatoire d'un scénario pour la démo
  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)]

  console.log("🎭 Scénario simulé:", randomScenario)

  return randomScenario
}

// Fonction utilitaire pour générer des QR codes
const generateQRCode = async (data: string): Promise<string> => {
  // Simulation d'un QR code avec une image placeholder
  // En production, ceci utiliserait une vraie librairie QR code
  const size = 200
  const encodedData = encodeURIComponent(data)

  // Utilisation d'un service de génération de QR code public pour la démo
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`
}
