import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatCard({ title, value, icon: Icon, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p
              className={`mt-1 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </p>
          )}
        </div>
        <div className="p-3 bg-admin-light rounded-lg">
          <Icon className="w-8 h-8 text-admin-dark" />
        </div>
      </div>
    </div>
  )
}



