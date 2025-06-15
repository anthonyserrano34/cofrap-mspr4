import Link from "next/link"
import type React from "react"

interface GovernmentCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  number: string
  badge?: string
}

export function GovernmentCard({ href, icon, title, description, number, badge }: GovernmentCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white border-2 border-gray-200 hover:border-[#1D2D50] transition-all duration-300 h-full shadow-lg hover:shadow-xl">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-gray-100 group-hover:bg-[#1D2D50] p-3 transition-all duration-300 shadow-sm">
              <div className="text-[#1D2D50] group-hover:text-white transition-colors duration-300">{icon}</div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-300 group-hover:text-red-600 transition-colors duration-300">
                {number}
              </span>
              {badge && (
                <div className="mt-2">
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 uppercase tracking-wide">
                    {badge}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-[#1D2D50] mb-3 group-hover:text-red-600 transition-colors duration-300">
              {title}
            </h3>

            <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-[#1D2D50] group-hover:text-red-600 transition-colors duration-300">
              Accéder au service →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
