import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface OccasionCardProps {
  title: string
  slug: string
  image: string
  description?: string
  color?: string
}

function OccasionCard({ title, slug, image, description, color = 'from-primary-500 to-primary-600' }: OccasionCardProps) {
  return (
    <Link to={`/products?occasion=${slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        className="group relative overflow-hidden rounded-2xl h-64 md:h-72"
      >
        {/* Background Image */}
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t opacity-80 group-hover:opacity-90 transition-opacity',
          color
        )} />
        
        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-white/80 text-sm mb-4 line-clamp-2">
              {description}
            </p>
          )}
          
          {/* CTA */}
          <div className="flex items-center gap-2 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
            <span>Shop Collection</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

interface OccasionCollectionsProps {
  occasions?: Array<{
    title: string
    slug: string
    image: string
    description?: string
  }>
}

export default function OccasionCollections({
  occasions = [
    {
      title: 'Birthday',
      slug: 'birthday',
      image: 'https://images.unsplash.com/photo-1530103862676-de3c9a59af57?w=600',
      description: 'Celebrate another year of joy',
    },
    {
      title: 'Anniversary',
      slug: 'anniversary',
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600',
      description: 'Commemorate your special day',
    },
    {
      title: 'Valentine',
      slug: 'valentine',
      image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600',
      description: 'Express your love',
    },
    {
      title: 'Wedding',
      slug: 'wedding',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
      description: 'Perfect gifts for the big day',
    },
  ],
}: OccasionCollectionsProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-4">
            Special Occasions
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Shop by Occasion
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect gift for every special moment in life
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {occasions.map((occasion, index) => (
            <OccasionCard key={occasion.slug} {...occasion} />
          ))}
        </div>
      </div>
    </section>
  )
}
