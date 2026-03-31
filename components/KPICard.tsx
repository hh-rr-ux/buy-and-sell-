import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: ReactNode
  iconBg?: string
  subtitle?: string
}

export default function KPICard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  iconBg = 'bg-blue-50',
  subtitle,
}: KPICardProps) {
  const trendPositive = trend !== undefined && trend > 0
  const trendNegative = trend !== undefined && trend < 0
  const trendNeutral = trend === undefined || trend === 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trendPositive
                ? 'bg-green-50 text-green-600'
                : trendNegative
                ? 'bg-red-50 text-red-600'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            {trendPositive ? (
              <TrendingUp size={12} />
            ) : trendNegative ? (
              <TrendingDown size={12} />
            ) : (
              <Minus size={12} />
            )}
            <span>{trendPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>

      <div className="mt-1">
        <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {subtitle && (
          <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
        )}
        {trendLabel && (
          <p className="text-gray-400 text-xs mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  )
}
