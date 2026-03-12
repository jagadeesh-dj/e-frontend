import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Check, Palette } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import DesignEditor, { DesignEditorRef } from '../components/design/DesignEditor'
import DesignToolbar from '../components/design/DesignToolbar'
import { getProductById } from '../data/products'
import { formatPrice } from '../lib/utils'
import { useAppDispatch } from '../store/hooks'
import { optimisticAddToCart } from '../store/slices/cartSlice'
import { addToast } from '../store/slices/uiSlice'
import { Product } from '../types'

export default function CustomizeProduct() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const editorRef = useRef<DesignEditorRef>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [canvasFabric, setCanvasFabric] = useState<any>(null)

  useEffect(() => {
    if (productId) {
      const found = getProductById(productId)
      if (found) {
        setProduct(found)
      } else {
        // Product not found, redirect to products
        navigate('/products')
      }
    }
  }, [productId, navigate])

  const handleCanvasReady = (canvas: any) => {
    setCanvasFabric(canvas)
  }

  const handleAddText = () => {
    editorRef.current?.addText('Your Text')
  }

  const handleUploadImage = async (file: File) => {
    try {
      await editorRef.current?.addImage(file)
      dispatch(addToast({
        type: 'success',
        title: 'Image uploaded',
        message: 'Your image has been added to the canvas',
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Failed to upload image. Please try again.',
      }))
    }
  }

  const handleDeleteSelected = () => {
    editorRef.current?.deleteSelected()
  }

  const handleResetDesign = () => {
    editorRef.current?.resetDesign()
  }

  const handleExportDesign = () => {
    return editorRef.current?.exportDesign() || null
  }

  const handleAddToCart = () => {
    if (!product || !editorRef.current) return

    setIsAdding(true)

    // Get the canvas JSON representation
    const designData = editorRef.current.getCanvasJSON()

    // Create a customized product item
    const customizedProduct = {
      ...product,
      custom_design: designData,
      design_preview: editorRef.current.canvas?.toDataURL ? editorRef.current.canvas.toDataURL({ format: 'png' }) : undefined,
    } as Product

    setTimeout(() => {
      // Add to cart with custom design data
      dispatch(optimisticAddToCart({
        product: customizedProduct,
        quantity: 1,
      }))

      // Store in localStorage
      const cartKey = `custom_product_${product.id}_${Date.now()}`
      localStorage.setItem(cartKey, JSON.stringify({
        productId: product.id,
        productName: product.name,
        design: designData,
        price: product.price,
        timestamp: new Date().toISOString(),
      }))

      setIsAdding(false)
      setAdded(true)

      dispatch(addToast({
        type: 'success',
        title: 'Added to cart',
        message: 'Your customized product has been added to the cart',
      }))

      setTimeout(() => setAdded(false), 2000)
    }, 500)
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Loading product...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="app-container py-4 sm:py-6 px-3 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-3 sm:mb-4 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Back to Product
          </Link>

          <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-2 text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Customizable
              </Badge>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{product.name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Design your own {product.name.toLowerCase()}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-3xl font-bold text-gray-900">{formatPrice(product.price)}</div>
              {product.originalPrice && (
                <div className="text-xs sm:text-lg text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Editor Layout - Stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left: Product Image + Canvas Preview */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            {/* Product Image Preview */}
            <Card className="card-premium overflow-hidden">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
                <div className="aspect-square max-w-[280px] sm:max-w-[350px] mx-auto relative">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                  {/* Canvas overlay indicator */}
                  <div className="absolute inset-0 border-2 border-dashed border-blue-300 rounded-lg opacity-50"></div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap">
                    Print Area Preview
                  </div>
                </div>
              </div>
            </Card>

            {/* Canvas Editor */}
            <Card className="card-premium p-3 sm:p-4">
              <div className="flex flex-col items-center">
                <h2 className="text-sm sm:text-lg font-semibold mb-3 text-gray-900 text-center">Design Canvas</h2>
                <div className="bg-white p-2 sm:p-4 rounded-lg shadow-inner w-full flex justify-center">
                  <div className="relative" style={{ maxWidth: '100%', overflow: 'auto' }}>
                    <DesignEditor
                      key={product.id}
                      ref={editorRef}
                      canvasWidth={300}
                      canvasHeight={300}
                      backgroundColor="#ffffff"
                      onCanvasReady={handleCanvasReady}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Canvas: 300x300px (represents printable area)
                </p>
              </div>
            </Card>

            {/* Product Info - Mobile */}
            <Card className="card-premium p-4 lg:hidden">
              <h3 className="font-semibold text-base mb-2 text-gray-900">Product Details</h3>
              <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
              {product.features && (
                <div className="space-y-2">
                  <h4 className="font-medium text-xs text-gray-700">Features:</h4>
                  <ul className="grid grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Toolbar & Actions - Sticky on desktop */}
          <div className="w-full lg:w-80 xl:w-96 space-y-4 sm:space-y-6">
            {/* Design Toolbar */}
            <Card className="card-premium p-3 sm:p-4">
              <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Design Tools</h2>
              <div className="space-y-3 sm:space-y-4">
                <DesignToolbar
                  canvas={canvasFabric}
                  onAddText={handleAddText}
                  onUploadImage={handleUploadImage}
                  onDeleteSelected={handleDeleteSelected}
                  onResetDesign={handleResetDesign}
                  onExportDesign={handleExportDesign}
                />
              </div>
            </Card>

            {/* Add to Cart Card */}
            <Card className="card-premium p-4 sm:p-6 sticky top-4 lg:top-24">
              <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Ready to Order?</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Once you're satisfied with your design, add it to your cart.
              </p>

              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full btn-premium text-sm sm:text-base"
                  size="lg"
                  onClick={handleAddToCart}
                  loading={isAdding}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-sm sm:text-base"
                  size="lg"
                  onClick={() => navigate('/cart')}
                >
                  View Cart
                </Button>
              </div>

              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Your design will be saved for checkout.
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Info - Desktop */}
        <Card className="card-premium p-4 sm:p-6 mt-4 sm:mt-6 hidden lg:block">
          <h3 className="font-semibold text-lg mb-3 text-gray-900">Product Details</h3>
          <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
          {product.features && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Features:</h4>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
