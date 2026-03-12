import { Product } from '../types'
import { mockProducts } from './mockData'

// Get all customizable products from mock data
export const customizableProducts: Product[] = mockProducts.filter((p) => p.is_customizable)

// Helper function to get product by ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((p) => p.id === id)
}

// Helper function to get all customizable products
export const getCustomizableProducts = (): Product[] => {
  return customizableProducts
}
