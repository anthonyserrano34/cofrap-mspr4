import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface GovernmentBreadcrumbProps {
  items: BreadcrumbItem[]
}

export function GovernmentBreadcrumb({ items }: GovernmentBreadcrumbProps) {
  return (
    <nav className="bg-gradient-to-r from-gray-100 to-blue-50 py-4 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <ol className="flex items-center space-x-3 text-sm">
          <li>
            <Link
              href="/"
              className="flex items-center text-[#1D2D50] hover:text-red-600 transition-colors font-medium"
            >
              <Home className="h-4 w-4 mr-2" />
              Accueil COFRAP
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 mx-3" />
              {item.href ? (
                <Link href={item.href} className="text-[#1D2D50] hover:text-red-600 transition-colors font-medium">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
