import { Shield, UserPlus, Smartphone, LogIn, Building2 } from "lucide-react";
import { FrenchHeader } from "@/components/ui/french-header";
import { GovernmentCard } from "@/components/ui/government-card";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<FrenchHeader />

			<div className="container mx-auto px-4 py-16">
				{/* Header */}
				<div className="text-center mb-16">
					<div className="flex justify-center items-center mb-6">
						<div className="bg-[#1D2D50] p-4 shadow-lg">
							<Building2 className="h-12 w-12 text-white" />
						</div>
						<div className="ml-4 text-left">
							<h1 className="text-3xl font-bold text-[#1D2D50] leading-tight">
								COFRAP
							</h1>
							<p className="text-sm text-gray-600 uppercase tracking-wide">
								Compagnie Française de Réalisation{" "}
							</p>
							<p className="text-sm text-gray-600 uppercase tracking-wide">
								d'Applicatifs Professionnels
							</p>
							<div className="flex items-center mt-1">
								<div className="w-3 h-1 bg-[#1D2D50]"></div>
								<div className="w-3 h-1 bg-white border border-gray-300"></div>
								<div className="w-3 h-1 bg-red-600"></div>
							</div>
						</div>
					</div>

					<div className="max-w-4xl mx-auto">
						<h2 className="text-2xl font-semibold text-gray-800 mb-4">
							Système de Création de Comptes Sécurisé
						</h2>
						<div className="w-24 h-0.5 bg-red-600 mx-auto mb-6"></div>
						<p className="text-lg text-gray-600 leading-relaxed">
							Plateforme d'authentification à deux facteurs pour
							la gestion sécurisée des comptes utilisateurs dans
							l'infrastructure cloud COFRAP.
						</p>
					</div>
				</div>

				{/* Cards */}
				<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
					<GovernmentCard
						href="/create-account"
						icon={<UserPlus className="h-8 w-8" />}
						title="Création de Compte"
						description="Génération automatique et sécurisée de mots de passe avec authentification par QR code"
						number="01"
						badge="Sécurisé"
					/>

					<GovernmentCard
						href="/generate-2fa"
						icon={<Smartphone className="h-8 w-8" />}
						title="Configuration 2FA"
						description="Mise en place de l'authentification à deux facteurs via protocole TOTP"
						number="02"
						badge="TOTP"
					/>

					<GovernmentCard
						href="/login"
						icon={<LogIn className="h-8 w-8" />}
						title="Authentification"
						description="Connexion sécurisée avec vérification des identifiants et validation 2FA"
						number="03"
						badge="Multi-facteurs"
					/>
				</div>

				{/* Information */}
				{/* <div className="bg-white border-l-4 border-[#1D2D50] p-6 max-w-4xl mx-auto shadow-lg">
					<div className="flex items-start">
						<div className="bg-[#1D2D50] p-3 mr-4">
							<Shield className="h-6 w-6 text-white" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-[#1D2D50] mb-2">
								Sécurité et Conformité
							</h3>
							<p className="text-gray-700 leading-relaxed">
								Ce système respecte les standards de sécurité
								les plus élevés et s'intègre parfaitement dans
								l'infrastructure cloud via des fonctions
								serverless OpenFaaS déployées sur Kubernetes.
							</p>
						</div>
					</div>
				</div> */}
			</div>

			{/* Footer */}
			{/* <footer className="bg-[#1D2D50] text-white py-8 mt-16">
				<div className="container mx-auto px-4 text-center">
					<div className="flex justify-center items-center mb-4">
						<img
							src="/epsi-logo.png"
							alt="Logo COFRAP"
							className="mx-auto w-24 h-auto"
						/>
					</div>
					<h4 className="text-lg font-bold mb-2">COFRAP</h4>
					<p className="text-sm opacity-90 mb-4">
						Compagnie Française de Réalisation d'Applicatifs
						Professionnels
					</p>
					<p className="text-sm opacity-75">
						MSPR TPRE921 - EPSI Montpellier - 2025
					</p>
					<p className="text-xs opacity-75">
						Anthony SERRANO - Sofiane AMAR - Damien BOUSQUET - Leo AZNAR
					</p>
				</div>
			</footer> */}
		</div>
	);
}
