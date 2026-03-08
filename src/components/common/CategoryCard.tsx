import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CategoryCardProps {
  name: string
  slug: string
  icon?: string
  image?: string
  count?: number
  color?: string
  className?: string
}

export default function CategoryCard({
  name,
  slug,
  icon,
  image,
  count,
  color = 'from-primary-50 to-primary-100',
  className,
}: CategoryCardProps) {
  return (
    <Link to={`/products?category=${slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/10 transition-all duration-300',
          className
        )}
      >
        {/* Background Gradient */}
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', color)} />
        
        <div className="relative p-6 text-center">
          {/* Icon/Image Container */}
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className={cn(
              'w-full h-full rounded-2xl bg-gradient-to-br flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300',
              color
            )}>
              {image ? (
                <img src={image} alt={name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                icon || '📁'
              )}
            </div>
            
            {/* Hover Ring */}
            <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/0 group-hover:ring-primary/30 transition-all duration-300" />
          </div>

          {/* Category Name */}
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          
          {/* Product Count */}
          {count !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {count} products
            </p>
          )}

          {/* Arrow Icon - Show on Hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  )
}
