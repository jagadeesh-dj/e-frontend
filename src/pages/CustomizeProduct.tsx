import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Check, Palette, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import DesignEditor, { DesignEditorRef } from '../components/design/DesignEditor'
import DesignToolbar from '../components/design/DesignToolbar'
import { formatPrice } from '../lib/utils'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { fetchUser } from '../store/slices/authSlice'
import { customizationsApi, productsApi } from '../api'
import { Product, CustomizationTemplate, CustomizationField } from '../types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'

export default function CustomizeProduct() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const editorRef = useRef<DesignEditorRef>(null)
  
  const [product, setProduct] = useState<Product | null>(null)
  const [template, setTemplate] = useState<CustomizationTemplate | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [assetIds, setAssetIds] = useState<Record<string, string>>({})
  
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [canvasFabric, setCanvasFabric] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!productId) return
      setIsLoading(true)
      try {
        const prodRes = await productsApi.get(productId)
        setProduct(prodRes.data.data)

        const tplRes = await customizationsApi.getProductTemplate(productId)
        const tplData = tplRes.data.data
        setTemplate(tplData)
        
        // Initialize default field values
        const initialValues: Record<string, any> = {}
        if (tplData?.fields) {
          tplData.fields.forEach((field: CustomizationField) => {
            if (field.default_value) {
              initialValues[field.name] = field.default_value
            }
          })
        }
        setFieldValues(initialValues)
      } catch (error) {
        dispatch(addToast({
          type: 'error',
          title: 'Error loading product',
          message: 'Failed to load customization data',
        }))
        navigate('/products')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [productId, navigate, dispatch])

  const handleFieldValueChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleFieldImageUpload = async (fieldName: string, file: File) => {
    try {
      const res = await customizationsApi.uploadAsset(file)
      const data = res.data.data
      
      setAssetIds(prev => ({ ...prev, [fieldName]: data.id }))
      setFieldValues(prev => ({ ...prev, [fieldName]: data.file_path }))

      dispatch(addToast({
        type: 'success',
        title: 'Image uploaded',
        message: 'Your image has been uploaded successfully',
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Failed to upload image',
      }))
    }
  }

  const handleCanvasReady = (canvas: any) => {
    setCanvasFabric(canvas)
  }

  const handleAddText = () => {
    editorRef.current?.addText('Your Text')
  }

  const handleUploadImage = async (file: File) => {
    try {
      await editorRef.current?.addImage(file)
      // Also upload to server to keep asset tracked if needed
      await customizationsApi.uploadAsset(file)
      
      dispatch(addToast({
        type: 'success',
        title: 'Image added',
        message: 'Your image has been added to the canvas',
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Upload failed',
        message: 'Failed to add image. Please try again.',
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

  const handleAddToCart = async () => {
    if (!product || !template || !editorRef.current) return

    // Validation
    const requiredFields = template.fields?.filter(f => f.is_required) || []
    for (const field of requiredFields) {
      if (!fieldValues[field.name]) {
        dispatch(addToast({
          type: 'error',
          title: 'Missing Required Field',
          message: `Please complete the "${field.label}" field.`,
        }))
        return
      }
    }

    setIsAdding(true)

    try {
      const designData = editorRef.current.getCanvasJSON()
      const previewImage = editorRef.current.canvas?.toDataURL ? editorRef.current.canvas.toDataURL({ format: 'png' }) : undefined

      // 1. Save Customization
      const saveRes = await customizationsApi.saveCustomization({
        template_id: template.id,
        product_id: product.id,
        session_id: user ? undefined : localStorage.getItem('session_id') || undefined,
        field_values: fieldValues,
        design_data: designData,
        preview_image_url: previewImage
      })

      const customizationId = saveRes.data.data.id

      // 2. Add to Cart with the Customization ID
      await customizationsApi.addCustomizedProductToCart({
        customization_id: customizationId,
        quantity: 1,
        session_id: user ? undefined : localStorage.getItem('session_id') || undefined,
      })

      setAdded(true)
      dispatch(addToast({
        type: 'success',
        title: 'Added to cart',
        message: 'Your customized product has been added to the cart',
      }))

      setTimeout(() => {
        setAdded(false)
        navigate('/cart')
      }, 1500)
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Failed to add to cart',
        message: error.response?.data?.message || 'An error occurred',
      }))
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading customization tools...</p>
        </div>
      </div>
    )
  }

  if (!product || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Product or template not found</p>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate Base Price and Price Adjustments
  let totalPrice = Number(product.price) || 0
  if (template.base_price_adjustment) {
    totalPrice += Number(template.base_price_adjustment)
  }
  template.fields?.forEach(field => {
    if (field.options && fieldValues[field.name]) {
      const selectedOption = field.options.find(opt => opt.value === fieldValues[field.name])
      if (selectedOption?.price_adjustment) {
        totalPrice += Number(selectedOption.price_adjustment)
      }
    }
  })

  // Get primary print area dimensions to size the canvas
  const primaryPrintArea = template.print_areas?.[0]
  const printAreaWidthMm = primaryPrintArea?.width_mm || 200
  const printAreaHeightMm = primaryPrintArea?.height_mm || 200
  // Convert mm to a rough pixel estimate for canvas scaling (assuming ~3.78 px/mm)
  const maxCanvasWidth = 350
  const scaleRatio = maxCanvasWidth / Math.max(printAreaWidthMm, 1)
  const canvasWidth = Math.min(Math.round(printAreaWidthMm * scaleRatio), 400)
  const canvasHeight = Math.min(Math.round(printAreaHeightMm * scaleRatio), 400)

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
                {template.name} - {template.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl sm:text-3xl font-bold text-gray-900">{formatPrice(totalPrice)}</div>
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
          {/* Left/Top: Product Image + Canvas Preview */}
          <div className="flex-1 space-y-4 sm:space-y-6">
            <Card className="card-premium overflow-hidden">
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
                <div className="aspect-square max-w-[280px] sm:max-w-[350px] mx-auto relative flex items-center justify-center">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-contain drop-shadow-lg opacity-40 mix-blend-multiply"
                  />
                  {/* Canvas overlay exactly over the preview image representing print area */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="relative pointer-events-auto shadow-sm ring-1 ring-black/5" style={{ width: canvasWidth, height: canvasHeight }}>
                        <DesignEditor
                          key={product.id}
                          ref={editorRef}
                          canvasWidth={canvasWidth}
                          canvasHeight={canvasHeight}
                          backgroundColor="#ffffff"
                          onCanvasReady={handleCanvasReady}
                        />
                     </div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap shadow-md">
                    Print Area: {printAreaWidthMm}x{printAreaHeightMm}mm
                  </div>
                </div>
              </div>
            </Card>

            {/* Design Tools Toolbar */}
            <Card className="card-premium p-3 sm:p-4">
              <h2 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900">Canvas Tools</h2>
              <DesignToolbar
                canvas={canvasFabric}
                onAddText={handleAddText}
                onUploadImage={handleUploadImage}
                onDeleteSelected={handleDeleteSelected}
                onResetDesign={handleResetDesign}
                onExportDesign={handleExportDesign}
              />
            </Card>
          </div>

          {/* Right/Bottom: Options & Actions */}
          <div className="w-full lg:w-80 xl:w-96 space-y-4 sm:space-y-6">
            
            {/* Dynamic Template Fields */}
            {template.fields && template.fields.length > 0 && (
              <Card className="card-premium p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold mb-4 text-gray-900">Personalization</h2>
                <div className="space-y-5">
                  {template.fields.map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-semibold flex items-center justify-between">
                        {field.label}
                        {field.is_required && <span className="text-red-500 text-xs">* Required</span>}
                      </Label>
                      
                      {/* TEXT FIELD */}
                      {field.type === 'text' && (
                        <Input 
                          placeholder={field.placeholder || ''} 
                          maxLength={field.max_length || undefined}
                          value={fieldValues[field.name] || ''}
                          onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                        />
                      )}

                      {/* SELECT FIELD */}
                      {field.type === 'select' && field.options && (
                        <Select
                          value={fieldValues[field.name] || ''}
                          onValueChange={(val) => handleFieldValueChange(field.name, val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || 'Select an option...'} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map(opt => (
                              <SelectItem key={opt.id} value={opt.value}>
                                {opt.label || opt.value} {opt.price_adjustment > 0 ? `(+${formatPrice(opt.price_adjustment)})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* COLOR FIELD */}
                      {field.type === 'color' && field.options && (
                        <div className="flex flex-wrap gap-2">
                          {field.options.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleFieldValueChange(field.name, opt.value)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${fieldValues[field.name] === opt.value ? 'border-primary scale-110 shadow-md' : 'border-transparent'}`}
                              style={{ backgroundColor: opt.color_hex || opt.value }}
                              title={`${opt.label || opt.value} ${opt.price_adjustment > 0 ? `(+${formatPrice(opt.price_adjustment)})` : ''}`}
                            />
                          ))}
                        </div>
                      )}

                      {/* IMAGE FIELD */}
                      {field.type === 'image' && (
                        <div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFieldImageUpload(field.name, e.target.files[0])
                              }
                            }}
                          />
                          {fieldValues[field.name] && (
                            <div className="mt-2 flex items-center gap-2 text-green-600 text-xs font-medium">
                              <Check className="w-4 h-4" /> Uploaded successfully
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Add to Cart Card */}
            <Card className="card-premium p-4 sm:p-6 sticky top-4 lg:top-24">
              <h2 className="text-base sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900">Ready to Order?</h2>
              <div className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full btn-premium text-sm sm:text-base"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAdding || isLoading}
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : added ? (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Add to Cart - {formatPrice(totalPrice)}
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
