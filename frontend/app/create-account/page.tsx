"use client";

import type React from "react";
import { useState } from "react";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchHeader } from "@/components/ui/french-header";
import { GovernmentBreadcrumb } from "@/components/ui/government-breadcrumb";
import { GovernmentForm } from "@/components/ui/government-form";
import { mockCreateAccount } from "@/lib/mock-api";

export default function CreateAccountPage() {
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		password?: string;
		qrCode?: string;
		message?: string;
	} | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		console.log("🔄 Appel API - Création de compte:", { username });

		try {
			const response = await mockCreateAccount(username);
			setResult(response);
			console.log("✅ Réponse API:", response);
		} catch (error) {
			console.error("❌ Erreur API:", error);
			setResult({
				success: false,
				message: "Erreur lors de la création du compte",
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
			<GovernmentBreadcrumb items={[{ label: "Création de compte" }]} />

			<div className="container mx-auto px-4 py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[#1D2D50] mb-2">
						Création de Compte
					</h1>
					<div className="w-16 h-0.5 bg-red-600 mx-auto"></div>
				</div>

				{!result ? (
					<GovernmentForm
						title="Nouveau Compte Utilisateur"
						description="Saisissez un nom d'utilisateur pour générer automatiquement un mot de passe sécurisé conforme aux standards de sécurité."
						icon={<UserPlus className="h-5 w-5" />}
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
									Le nom d'utilisateur doit être unique dans
									le système.
								</p>
							</div>

							<Button
								type="submit"
								className="w-full h-12 bg-[#1D2D50] hover:bg-[#1D2D50]/90 text-white font-semibold rounded-none"
								disabled={loading || !username.trim()}
							>
								{loading
									? "Création en cours..."
									: "Créer le compte"}
							</Button>
						</form>
					</GovernmentForm>
				) : (
					<GovernmentForm
						title="Compte Créé avec Succès"
						description={`Le compte utilisateur "${username}" a été créé et configuré avec succès.`}
						icon={<CheckCircle className="h-5 w-5" />}
					>
						<div className="space-y-6">
							{result.password && (
								<div className="bg-gray-50 p-4 border-l-4 border-[#1D2D50]">
									<h4 className="font-semibold text-[#1D2D50] mb-2">
										Mot de passe généré
									</h4>
									<div className="bg-white p-3 font-mono text-sm break-all border">
										{result.password}
									</div>
									<p className="text-xs text-gray-600 mt-2">
										Mot de passe de 24 caractères généré
										automatiquement selon les standards de
										sécurité.
									</p>
								</div>
							)}

							{result.qrCode && (
								<div className="text-center">
									<h4 className="font-semibold text-[#1D2D50] mb-4">
										Code QR d'Authentification
									</h4>
									<div className="bg-white p-6 border inline-block">
										<img
											src={
												result.qrCode ||
												"/placeholder.svg"
											}
											alt="QR Code du mot de passe"
											className="mx-auto"
											width={200}
											height={200}
										/>
									</div>
									<p className="text-sm text-gray-600 mt-3">
										Scannez ce code QR avec votre
										application mobile pour récupérer le mot
										de passe.
									</p>
								</div>
							)}

							<div className="bg-blue-50 p-4 border-l-4 border-blue-400">
								<div className="flex items-start">
									<AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-blue-800 mb-1">
											Information importante
										</h4>
										<p className="text-sm text-blue-700">
											Conservez précieusement ces
											informations d'authentification.
											Elles sont nécessaires pour
											configurer l'authentification à deux
											facteurs.
										</p>
									</div>
								</div>
							</div>

							<div className="flex gap-4 pt-4">
								<Button
									onClick={resetForm}
									variant="outline"
									className="flex-1 h-12 rounded-none"
								>
									Créer un autre compte
								</Button>
								<Button
									onClick={() =>
										(window.location.href = "/generate-2fa")
									}
									className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-none"
								>
									Configurer 2FA
								</Button>
							</div>
						</div>
					</GovernmentForm>
				)}
			</div>
		</div>
	);
}
