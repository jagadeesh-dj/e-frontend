import { Badge } from '../ui/badge'
import { cn } from '../../lib/utils'

interface SectionHeaderProps {
  badge?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center' | 'right'
  showDivider?: boolean
  className?: string
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
  showDivider = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-12', align === 'center' && 'text-center', align === 'right' && 'text-right', className)}>
      {badge && (
        <Badge variant="soft" size="lg" className="mb-4 bg-primary-100 text-primary-700">
          {badge}
        </Badge>
      )}
      
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
        {title}
      </h2>
      
      {subtitle && (
        <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      
      {showDivider && (
        <div className={cn(
          'mt-6 h-1 w-20 bg-gradient-to-r from-primary to-primary-600 rounded-full',
          align === 'center' && 'mx-auto',
          align === 'right' && 'ml-auto'
        )} />
      )}
    </div>
  )
}
