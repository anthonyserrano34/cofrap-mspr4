interface FrenchAccentProps {
  className?: string
}

export function FrenchAccent({ className = "" }: FrenchAccentProps) {
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <div className="w-6 h-1 bg-[#1D2D50] rounded-full"></div>
      <div className="w-6 h-1 bg-gray-300 rounded-full"></div>
      <div className="w-6 h-1 bg-red-600 rounded-full"></div>
    </div>
  )
}
