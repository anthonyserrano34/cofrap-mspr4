"use client";

import type React from "react";
import { useState } from "react";
import { Smartphone, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchHeader } from "@/components/ui/french-header";
import { GovernmentBreadcrumb } from "@/components/ui/government-breadcrumb";
import { GovernmentForm } from "@/components/ui/government-form";
import { generate2FA } from "@/lib/cofrap-api";

export default function Generate2FAPage() {
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		secret?: string;
		qrCode?: string;
		message?: string;
	} | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		console.log("🔄 Appel API - Génération 2FA:", { username });

		try {
			const response = await generate2FA(username);
			setResult(response);
			console.log("✅ Réponse API:", response);
		} catch (error) {
			console.error("❌ Erreur API:", error);
			setResult({
				success: false,
				message: "Erreur lors de la génération du 2FA",
			});
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setUsername("");
		setResult(null);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<FrenchHeader />
			<GovernmentBreadcrumb items={[{ label: "Configuration 2FA" }]} />

			<div className="container mx-auto px-4 py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[#1D2D50] mb-2">
						Configuration 2FA
					</h1>
					<div className="w-16 h-0.5 bg-red-600 mx-auto"></div>
				</div>

				{!result || (result && !result.success) ? (
					<GovernmentForm
						title="Authentification à Deux Facteurs"
						description="Configurez l'authentification à deux facteurs via protocole TOTP pour renforcer la sécurité de votre compte."
						icon={<Smartphone className="h-5 w-5" />}
					>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div>
								<label
									htmlFor="username"
									className="block text-sm font-semibold text-gray-700 mb-3"
								>
									Nom d'utilisateur{" "}
									<span className="text-red-600">*</span>
								</label>
								<Input
									id="username"
									type="text"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									placeholder="Saisissez le nom d'utilisateur"
									required
									className="w-full h-12 border-2 border-gray-300 focus:border-[#1D2D50] rounded-none"
								/>
								<p className="text-xs text-gray-500 mt-2">
									Utilisez le même nom d'utilisateur que lors
									de la création du compte.
								</p>
							</div>

							<Button
								type="submit"
								className="w-full h-12 bg-[#1D2D50] hover:bg-[#1D2D50]/90 text-white font-semibold rounded-none"
								disabled={loading || !username.trim()}
							>
								{loading
									? "Génération en cours..."
									: "Générer la configuration 2FA"}
							</Button>
						</form>

						{result && !result.success && (
							<div className="mt-6 bg-red-50 p-4 border-l-4 border-red-400">
								<div className="flex items-start">
									<XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-red-800 mb-1">
											Erreur de génération 2FA
										</h4>
										<p className="text-sm text-red-700">
											{result.message ||
												"Une erreur s'est produite lors de la génération du 2FA."}
										</p>
									</div>
								</div>
							</div>
						)}
					</GovernmentForm>
				) : (
					<GovernmentForm
						title="2FA Configuré avec Succès"
						description={`L'authentification à deux facteurs pour "${username}" est maintenant active.`}
						icon={<CheckCircle className="h-5 w-5" />}
					>
						<div className="space-y-6">
							{result.secret && (
								<div className="bg-gray-50 p-4 border-l-4 border-[#1D2D50]">
									<h4 className="font-semibold text-[#1D2D50] mb-2">
										Secret TOTP
									</h4>
									<div className="bg-white p-3 font-mono text-sm break-all border">
										{result.secret}
									</div>
									<p className="text-xs text-gray-600 mt-2">
										Clé secrète pour la configuration
										manuelle de l'authentificateur.
									</p>
								</div>
							)}

							{result.qrCode && (
								<div className="text-center">
									<h4 className="font-semibold text-[#1D2D50] mb-4">
										Code QR TOTP
									</h4>
									<div className="bg-white p-6 border inline-block">
										<img
											src={
												result.qrCode ||
												"/placeholder.svg"
											}
											alt="QR Code TOTP"
											className="mx-auto"
											width={200}
											height={200}
										/>
									</div>
									<p className="text-sm text-gray-600 mt-3">
										Scannez ce code avec Google
										Authenticator, Microsoft Authenticator
										ou une application similaire.
									</p>
								</div>
							)}

							<div className="bg-blue-50 p-4 border-l-4 border-blue-400">
								<div className="flex items-start">
									<AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-blue-800 mb-2">
											Instructions de configuration
										</h4>
										<ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
											<li>
												Téléchargez une application
												d'authentification (Google
												Authenticator, Microsoft
												Authenticator)
											</li>
											<li>
												Ouvrez l'application et
												sélectionnez "Ajouter un compte"
											</li>
											<li>
												Scannez le code QR ci-dessus ou
												saisissez manuellement la clé
												secrète
											</li>
											<li>
												Votre code à 6 chiffres sera
												généré automatiquement toutes
												les 30 secondes
											</li>
										</ol>
									</div>
								</div>
							</div>

							<div className="flex gap-4 pt-4">
								<Button
									onClick={resetForm}
									variant="outline"
									className="flex-1 h-12 rounded-none"
								>
									Configurer un autre 2FA
								</Button>
								<Button
									onClick={() =>
										(window.location.href = "/login")
									}
									className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-none"
								>
									Tester la connexion
								</Button>
							</div>
						</div>
					</GovernmentForm>
				)}
			</div>
		</div>
	);
}
