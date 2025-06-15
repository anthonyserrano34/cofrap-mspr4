import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GovernmentFormProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

export function GovernmentForm({ title, description, icon, children }: GovernmentFormProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="flex flex-col space-y-1.5 p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 py-8">
          <CardTitle className="flex items-center text-[#1D2D50] text-xl">
            <div className="bg-[#1D2D50] p-2 mr-3 shadow-lg">
              <div className="text-white">{icon}</div>
            </div>
            <div>
              {title}
              <div className="w-12 h-0.5 bg-red-600 mt-1"></div>
            </div>
          </CardTitle>
          <CardDescription className="text-gray-600 ml-12 leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 bg-white">{children}</CardContent>
      </Card>
    </div>
  )
}
