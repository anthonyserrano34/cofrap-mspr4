"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FrenchHeader } from "@/components/ui/french-header";
import { GovernmentBreadcrumb } from "@/components/ui/government-breadcrumb";
import { GovernmentForm } from "@/components/ui/government-form";
import { checkConnection } from "@/lib/cofrap-api";
import { API_ENDPOINTS } from "@/lib/api-config";

export default function TestConnectionPage() {
	const [connection, setConnection] = useState<{
		connected: boolean;
		gateway: string;
		message: string;
	} | null>(null);
	const [loading, setLoading] = useState(false);

	const testConnection = async () => {
		setLoading(true);
		try {
			const result = await checkConnection();
			setConnection(result);
		} catch (error) {
			setConnection({
				connected: false,
				gateway: API_ENDPOINTS.generatePassword.split("/function/")[0],
				message: "Erreur lors du test de connectivité",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		testConnection();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50">
			<FrenchHeader />
			<GovernmentBreadcrumb items={[{ label: "Test de Connectivité" }]} />

			<div className="container mx-auto px-4 py-12">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[#1D2D50] mb-2">
						Test de connectivité OpenFaaS
					</h1>
					<div className="w-16 h-0.5 bg-red-600 mx-auto"></div>
				</div>

				<GovernmentForm
					title="Diagnostic du Système"
					description="Vérification de la connexion aux services OpenFaaS"
					icon={<AlertCircle className="h-5 w-5" />}
				>
					<div className="space-y-6">
						{/* Configuration */}
						<div className="bg-gray-50 p-4 border-l-4 border-[#1D2D50]">
							<h4 className="font-semibold text-[#1D2D50] mb-3">
								Configuration
							</h4>
							<div className="space-y-2 text-sm">
								<div>
									<strong>Gateway OpenFaaS:</strong>
									<span className="ml-2 font-mono text-blue-600">
										{
											API_ENDPOINTS.generatePassword.split(
												"/function/"
											)[0]
										}
									</span>
								</div>
								<div>
									<strong>Endpoints:</strong>
								</div>
								<ul className="ml-4 space-y-1">
									<li>
										•{" "}
										<span className="font-mono text-xs">
											{API_ENDPOINTS.generatePassword}
										</span>
									</li>
									<li>
										•{" "}
										<span className="font-mono text-xs">
											{API_ENDPOINTS.generate2FA}
										</span>
									</li>
									<li>
										•{" "}
										<span className="font-mono text-xs">
											{API_ENDPOINTS.authenticate}
										</span>
									</li>
								</ul>
							</div>
						</div>

						{/* Status de connexion */}
						{connection && (
							<div
								className={`p-4 border-l-4 ${
									connection.connected
										? "bg-green-50 border-green-400"
										: "bg-red-50 border-red-400"
								}`}
							>
								<div className="flex items-start">
									{connection.connected ? (
										<CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
									) : (
										<XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
									)}
									<div>
										<h4
											className={`font-semibold mb-1 ${
												connection.connected
													? "text-green-800"
													: "text-red-800"
											}`}
										>
											{connection.connected
												? "Connexion Établie"
												: "Connexion Échouée"}
										</h4>
										<p
											className={`text-sm ${
												connection.connected
													? "text-green-700"
													: "text-red-700"
											}`}
										>
											{connection.message}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Instructions */}
						<div className="bg-blue-50 p-4 border-l-4 border-blue-400">
							<div className="flex items-start">
								<AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
								<div>
									<h4 className="font-semibold text-blue-800 mb-2">
										Instructions
									</h4>
									<div className="text-sm text-blue-700 space-y-2">
										<p>
											<strong>
												Si la connexion échoue :
											</strong>
										</p>
										<ol className="list-decimal list-inside space-y-1 ml-2">
											<li>
												Vérifiez que OpenFaaS est
												démarré
											</li>
											<li>
												Vérifiez que le port 8080 est
												accessible
											</li>
											<li>
												Modifiez l'URL dans le fichier{" "}
												<code>.env.local</code>
											</li>
										</ol>

										<p className="mt-3">
											<strong>
												Pour l'intégration :
											</strong>
										</p>
										<ol className="list-decimal list-inside space-y-1 ml-2">
											<li>
												Demandez l'IP de l'instance
												OpenFaaS
											</li>
											<li>
												Modifiez{" "}
												<code>
													NEXT_PUBLIC_OPENFAAS_GATEWAY=http://IP_OPENFAAS:8080
												</code>
											</li>
											<li>
												Relancez le test de connectivité
											</li>
										</ol>
									</div>
								</div>
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-4 pt-4">
							<Button
								onClick={testConnection}
								disabled={loading}
								className="flex-1 h-12 bg-[#1D2D50] hover:bg-[#1D2D50]/90 rounded-none"
							>
								{loading ? (
									<>
										<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
										Test en cours...
									</>
								) : (
									<>
										<RefreshCw className="h-4 w-4 mr-2" />
										Retester la connexion
									</>
								)}
							</Button>
							<Button
								onClick={() => (window.location.href = "/")}
								variant="outline"
								className="flex-1 h-12 rounded-none"
							>
								Retour à l'accueil
							</Button>
						</div>
					</div>
				</GovernmentForm>
			</div>
		</div>
	);
}
