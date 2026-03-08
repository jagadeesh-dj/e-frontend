import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface CarouselProps {
  children: React.ReactNode[]
  itemsPerView?: number
  autoPlay?: boolean
  autoPlayInterval?: number
  showArrows?: boolean
  showDots?: boolean
  className?: string
}

export default function Carousel({
  children,
  itemsPerView = 4,
  autoPlay = true,
  autoPlayInterval = 4000,
  showArrows = true,
  showDots = true,
  className,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalItems = children.length
  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const startAutoPlay = () => {
    if (autoPlay && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        if (!isHovered) {
          setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
        }
      }, autoPlayInterval)
    }
  }

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    startAutoPlay()
    return () => stopAutoPlay()
  }, [maxIndex, autoPlay, isHovered])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Responsive items per view
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return itemsPerView
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 768) return 2
    if (window.innerWidth < 1024) return 3
    return itemsPerView
  }

  const [currentItemsPerView, setCurrentItemsPerView] = useState(getItemsPerView())

  useEffect(() => {
    const handleResize = () => {
      setCurrentItemsPerView(getItemsPerView())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const visibleItems = children.slice(currentIndex, currentIndex + currentItemsPerView)
  const wrappedItems = visibleItems.length < currentItemsPerView
    ? [...visibleItems, ...children.slice(0, currentItemsPerView - visibleItems.length)]
    : visibleItems

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Track */}
      <div className="overflow-hidden">
        <motion.div
          initial={false}
          animate={{ x: `-${currentIndex * (100 / currentItemsPerView)}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="flex"
          style={{ width: `${children.length * (100 / currentItemsPerView)}%` }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className="px-2"
              style={{ width: `${100 / currentItemsPerView}%` }}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <Button
            onClick={goToPrevious}
            size="icon"
            variant="outline"
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all',
              currentIndex === 0 && 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            onClick={goToNext}
            size="icon"
            variant="outline"
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-all',
              currentIndex >= maxIndex && 'opacity-0 pointer-events-none'
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-8 bg-gradient-to-r from-primary to-primary-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
