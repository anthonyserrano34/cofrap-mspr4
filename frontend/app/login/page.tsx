"use client";

import type React from "react";
import { useState } from "react";
import { LogIn, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchHeader } from "@/components/ui/french-header";
import { GovernmentBreadcrumb } from "@/components/ui/government-breadcrumb";
import { GovernmentForm } from "@/components/ui/government-form";
import { authenticate } from "@/lib/cofrap-api";

export default function LoginPage() {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
		totpCode: "",
	});
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		success: boolean;
		message: string;
		expired?: boolean;
	} | null>(null);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (
			!formData.username.trim() ||
			!formData.password.trim() ||
			!formData.totpCode.trim()
		)
			return;

		setLoading(true);
		console.log("🔄 Appel API - Connexion:", formData);

		try {
			const response = await authenticate(formData);
			setResult({
				success: response.success && response.authenticated === true,
				message: response.message || "",
				expired: response.expired,
			});
			console.log("✅ Réponse API:", response);
		} catch (error) {
			console.error("❌ Erreur API:", error);
			setResult({
				success: false,
				message: "Erreur lors de la connexion",
			});
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData({ username: "", password: "", totpCode: "" });
		setResult(null);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<FrenchHeader />
			<GovernmentBreadcrumb items={[{ label: "Authentification" }]} />

			<div className="container mx-auto px-4 py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[#1D2D50] mb-2">
						Authentification
					</h1>
					<div className="w-16 h-0.5 bg-red-600 mx-auto"></div>
				</div>

				{!result || (result && !result.success && !result.expired) ? (
					<GovernmentForm
						title="Connexion Sécurisée"
						description="Authentifiez-vous avec vos identifiants et votre code d'authentification à deux facteurs."
						icon={<LogIn className="h-5 w-5" />}
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
									value={formData.username}
									onChange={(e) =>
										handleInputChange(
											"username",
											e.target.value
										)
									}
									placeholder="Saisissez votre nom d'utilisateur"
									required
									className="w-full h-12 border-2 border-gray-300 focus:border-[#1D2D50] rounded-none"
								/>
							</div>

							<div>
								<label
									htmlFor="password"
									className="block text-sm font-semibold text-gray-700 mb-3"
								>
									Mot de passe{" "}
									<span className="text-red-600">*</span>
								</label>
								<Input
									id="password"
									type="password"
									value={formData.password}
									onChange={(e) =>
										handleInputChange(
											"password",
											e.target.value
										)
									}
									placeholder="Saisissez votre mot de passe"
									required
									className="w-full h-12 border-2 border-gray-300 focus:border-[#1D2D50] rounded-none"
								/>
							</div>

							<div>
								<label
									htmlFor="totpCode"
									className="block text-sm font-semibold text-gray-700 mb-3"
								>
									Code d'authentification 2FA{" "}
									<span className="text-red-600">*</span>
								</label>
								<Input
									id="totpCode"
									type="text"
									value={formData.totpCode}
									onChange={(e) =>
										handleInputChange(
											"totpCode",
											e.target.value
												.replace(/\D/g, "")
												.slice(0, 6)
										)
									}
									placeholder="000000"
									required
									className="w-full h-12 border-2 border-gray-300 focus:border-[#1D2D50] rounded-none text-center text-lg tracking-widest"
									maxLength={6}
								/>
								<p className="text-xs text-gray-500 mt-2">
									Code à 6 chiffres généré par votre
									application d'authentification.
								</p>
							</div>

							<Button
								type="submit"
								className="w-full h-12 bg-[#1D2D50] hover:bg-[#1D2D50]/90 text-white font-semibold rounded-none"
								disabled={
									loading ||
									!formData.username.trim() ||
									!formData.password.trim() ||
									formData.totpCode.length !== 6
								}
							>
								{loading
									? "Authentification en cours..."
									: "Se connecter"}
							</Button>
						</form>

						{result && !result.success && !result.expired && (
							<div className="mt-6 bg-red-50 p-4 border-l-4 border-red-400">
								<div className="flex items-start">
									<XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
									<div>
										<h4 className="font-semibold text-red-800 mb-1">
											Erreur d'authentification
										</h4>
										<p className="text-sm text-red-700">
											{result.message ||
												"Vérifiez vos identifiants et réessayez."}
										</p>
									</div>
								</div>
							</div>
						)}
					</GovernmentForm>
				) : (
					<GovernmentForm
						title={
							result.success
								? "Authentification Réussie"
								: result.expired
								? "Compte Expiré"
								: "Échec d'Authentification"
						}
						description={result.message}
						icon={
							result.success ? (
								<CheckCircle className="h-5 w-5" />
							) : result.expired ? (
								<AlertTriangle className="h-5 w-5" />
							) : (
								<XCircle className="h-5 w-5" />
							)
						}
					>
						<div className="space-y-6">
							{result.success && (
								<div className="bg-green-50 p-4 border-l-4 border-green-400">
									<div className="flex items-start">
										<CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
										<div>
											<h4 className="font-semibold text-green-800 mb-1">
												Connexion autorisée
											</h4>
											<p className="text-sm text-green-700">
												Vous êtes maintenant authentifié
												sur le système COFRAP. Votre
												session est sécurisée et
												conforme aux standards de
												sécurité.
											</p>
										</div>
									</div>
								</div>
							)}

							{result.expired && (
								<div className="bg-red-50 p-4 border-l-4 border-red-400">
									<div className="flex items-start">
										<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
										<div>
											<h4 className="font-semibold text-red-800 mb-2">
												Compte expiré
											</h4>
											<p className="text-sm text-red-700 mb-3">
												Votre compte a expiré pour des
												raisons de sécurité. Vous devez
												créer un nouveau compte pour
												continuer.
											</p>
											<Button
												onClick={() =>
													(window.location.href =
														"/create-account")
												}
												className="bg-red-600 hover:bg-red-700 rounded-none"
											>
												Créer un nouveau compte
											</Button>
										</div>
									</div>
								</div>
							)}

							{!result.success && !result.expired && (
								<div className="bg-red-50 p-4 border-l-4 border-red-400">
									<div className="flex items-start">
										<XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
										<div>
											<h4 className="font-semibold text-red-800 mb-1">
												Authentification échouée
											</h4>
											<p className="text-sm text-red-700">
												Vérifiez vos identifiants et
												votre code 2FA, puis réessayez.
												Assurez-vous que le code n'a pas
												expiré.
											</p>
										</div>
									</div>
								</div>
							)}

							<div className="flex gap-4 pt-4">
								<Button
									onClick={resetForm}
									variant="outline"
									className="flex-1 h-12 rounded-none"
								>
									Nouvelle tentative
								</Button>
								<Button
									onClick={() => (window.location.href = "/")}
									variant="secondary"
									className="flex-1 h-12 rounded-none"
								>
									Retour à l'accueil
								</Button>
							</div>
						</div>
					</GovernmentForm>
				)}
			</div>
		</div>
	);
}
