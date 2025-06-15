import { Wifi } from "lucide-react"

export function FrenchHeader() {
  const gatewayUrl = process.env.NEXT_PUBLIC_OPENFAAS_GATEWAY || 'http://localhost:8080';
  const displayUrl = gatewayUrl.replace('http://', '').replace('https://', '');
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-1 shadow-sm">
                <div className="flex">
                  <div className="w-4 h-3 bg-[#1D2D50]"></div>
                  <div className="w-4 h-3 bg-white border-t border-b border-gray-300"></div>
                  <div className="w-4 h-3 bg-red-600"></div>
                </div>
              </div>
              <div>
                <span className="text-sm font-bold text-[#1D2D50]">COFRAP</span>
                <p className="text-xs text-gray-600">Compagnie Française de Réalisation d'Applicatifs Professionnels</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Wifi className="h-3 w-3" />
              <span className="font-mono">{displayUrl}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
