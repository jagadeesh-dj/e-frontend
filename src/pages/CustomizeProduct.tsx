import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Check, Palette, Loader2, Sparkles, Upload, Type, Image as ImageIcon, Trash2, RotateCcw, Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatPrice, cn } from '../lib/utils'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { addToast } from '../store/slices/uiSlice'
import { customizationsApi, productsApi } from '../api'
import { Product, CustomizationTemplate, CustomizationField } from '../types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import DesignEditor, { DesignEditorRef } from '../components/design/DesignEditor'
import DesignToolbar from '../components/design/DesignToolbar'

export default function CustomizeProduct() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const editorRef = useRef<DesignEditorRef>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [template, setTemplate] = useState<CustomizationTemplate | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [assetIds, setAssetIds] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'design' | 'specs'>('design')

  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [canvasFabric, setCanvasFabric] = useState<any>(null)
  const [hasDesignChanges, setHasDesignChanges] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!uid) return
      setIsLoading(true)
      try {
        const prodRes = await productsApi.get(uid)
        setProduct(prodRes.data.data)

        const tplRes = await customizationsApi.getProductTemplate(uid)
        const tplData = tplRes.data.data
        setTemplate(tplData)

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
          title: 'Retrieval Error',
          message: 'Unable to load the personalization suite.',
        }))
        navigate('/products')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [uid, navigate, dispatch])

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
        title: 'Upload Successful',
        message: 'Your asset has been securely stored.',
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Upload Error',
        message: 'Failed to process asset.',
      }))
    }
  }

  const handleCanvasReady = (canvas: any) => {
    setCanvasFabric(canvas)
  }

  const handleAddText = () => {
    editorRef.current?.addText('Typography')
    setHasDesignChanges(true)
  }

  const handleUploadImage = async (file: File) => {
    try {
      await editorRef.current?.addImage(file)
      await customizationsApi.uploadAsset(file)
      setHasDesignChanges(true)

      dispatch(addToast({
        type: 'success',
        title: 'Asset Integrated',
        message: 'Your image has been placed on the canvas.',
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        title: 'Integration Error',
        message: 'Failed to place the asset. Please try again.',
      }))
    }
  }

  const handleDeleteSelected = () => {
    editorRef.current?.deleteSelected()
    setHasDesignChanges(true)
  }

  const handleResetDesign = () => {
    editorRef.current?.resetDesign()
    setHasDesignChanges(true)
  }

  const handleExportDesign = () => {
    return editorRef.current?.exportDesign() || null
  }

  const handleAddToCart = async () => {
    if (!product || !template || !editorRef.current) return

    const requiredFields = template.fields?.filter(f => f.is_required) || []
    for (const field of requiredFields) {
      if (!fieldValues[field.name]) {
        dispatch(addToast({
          type: 'error',
          title: 'Missing Details',
          message: `The "${field.label}" specification is required.`,
        }))
        return
      }
    }

    setIsAdding(true)

    try {
      const designData = editorRef.current.getCanvasJSON()
      const previewImage = editorRef.current.canvas?.toDataURL ? editorRef.current.canvas.toDataURL({ format: 'png' }) : undefined

      const saveRes = await customizationsApi.saveCustomization({
        template_id: template.id,
        product_id: product.id,
        session_id: user ? undefined : localStorage.getItem('session_id') || undefined,
        field_values: fieldValues,
        design_data: designData,
        preview_image_url: previewImage
      })

      const customizationId = saveRes.data.data.id

      await customizationsApi.addCustomizedProductToCart({
        customization_id: customizationId,
        quantity: 1,
        session_id: user ? undefined : localStorage.getItem('session_id') || undefined,
      })

      setAdded(true)
      dispatch(addToast({
        type: 'success',
        title: 'Acquired',
        message: 'Your bespoke creation has been placed in your bag.',
      }))

      setTimeout(() => {
        setAdded(false)
        navigate('/cart')
      }, 1500)
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Transaction Error',
        message: error.response?.data?.message || 'An error occurred during addition.',
      }))
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-700 animate-spin mx-auto mb-4" />
          <p className="font-serif text-xl text-amber-900/50 animate-pulse">Opening Atelier...</p>
        </div>
      </div>
    )
  }

  if (!product || !template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9f6]">
        <p className="font-serif text-3xl text-gray-900 mb-6">Service Unavailable</p>
        <Link to="/products">
          <Button className="h-12 px-8 bg-gray-900 text-white rounded-none uppercase tracking-[0.2em] text-xs hover:bg-amber-900 transition-colors">
            Return to Gallery
          </Button>
        </Link>
      </div>
    )
  }

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

  const primaryPrintArea = template.print_areas?.[0]
  const printAreaWidthMm = primaryPrintArea?.width_mm || 200
  const printAreaHeightMm = primaryPrintArea?.height_mm || 200
  const maxCanvasWidth = 350
  const scaleRatio = maxCanvasWidth / Math.max(printAreaWidthMm, 1)
  const canvasWidth = Math.min(Math.round(printAreaWidthMm * scaleRatio), 400)
  const canvasHeight = Math.min(Math.round(printAreaHeightMm * scaleRatio), 400)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9f6] to-[#f5f2ee] pb-24">
      {/* Header with Back Navigation */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={`/products/${product.uid}`}
              className="inline-flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-amber-700 transition-colors group"
            >
              <ArrowLeft className="w-3 h-3 mr-2 transition-transform group-hover:-translate-x-1" />
              Return to Piece
            </Link>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="rounded-none border-amber-900/20 text-amber-700 bg-amber-50 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Bespoke
              </Badge>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold">Total Investment</div>
                <div className="font-serif text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden border-b border-gray-200 bg-white sticky top-[73px] z-30">
        <div className="flex">
          <button
            onClick={() => setActiveTab('design')}
            className={cn(
              "flex-1 py-4 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors border-b-2",
              activeTab === 'design' ? 'border-amber-700 text-amber-700 bg-amber-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Design Studio
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={cn(
              "flex-1 py-4 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors border-b-2",
              activeTab === 'specs' ? 'border-amber-700 text-amber-700 bg-amber-50/50' : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            Specifications
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">

          {/* Left Column - Design Studio */}
          <div className={cn("flex-1 space-y-6", activeTab !== 'design' && 'hidden lg:block')}>
            
            {/* Product Info Card */}
            <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-6 p-6 border-b border-gray-100">
                  <div className="w-20 h-20 overflow-hidden bg-[#f0f0f0] flex-shrink-0">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-serif text-2xl lg:text-3xl text-gray-900 truncate mb-2">{product.name}</h1>
                    <p className="text-sm font-light text-gray-500">{template.name} — {template.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas Section */}
            <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-serif text-xl text-gray-900 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-amber-700" />
                    Design Canvas
                  </h2>
                  <Badge variant="outline" className="rounded-none border-gray-200 text-gray-500 text-[10px] uppercase tracking-wider">
                    {printAreaWidthMm}×{printAreaHeightMm}mm
                  </Badge>
                </div>

                <div className="relative aspect-square max-w-md mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-sm shadow-inner overflow-hidden">
                  {/* Product Base Image */}
                  <img
                    src={product.images[0] || 'https://via.placeholder.com/600'}
                    alt={product.name}
                    className="w-full h-full object-contain opacity-60 mix-blend-multiply"
                  />
                  
                  {/* Canvas Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative bg-white/60 backdrop-blur-[1px] shadow-lg ring-1 ring-black/5" style={{ width: canvasWidth, height: canvasHeight }}>
                      <DesignEditor
                        key={product.id}
                        ref={editorRef}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        backgroundColor="transparent"
                        onCanvasReady={handleCanvasReady}
                      />
                    </div>
                  </div>

                  {/* Canvas Guide Lines */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border border-dashed border-gray-300/50" />
                  </div>
                </div>

                {/* Toolbar */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <DesignToolbar
                    canvas={canvasFabric}
                    onAddText={handleAddText}
                    onUploadImage={handleUploadImage}
                    onDeleteSelected={handleDeleteSelected}
                    onResetDesign={handleResetDesign}
                    onExportDesign={handleExportDesign}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm lg:hidden">
              <CardContent className="p-4">
                <Button
                  className="w-full h-12 bg-gray-900 hover:bg-amber-900 text-white uppercase text-xs tracking-[0.2em] rounded-none transition-colors"
                  onClick={() => setActiveTab('specs')}
                >
                  Configure Specifications
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Specifications & Actions */}
          <div className={cn("w-full lg:w-96 xl:w-[420px] space-y-6 flex-shrink-0", activeTab !== 'specs' && 'hidden lg:block')}>
            
            {/* Specifications Form */}
            {template.fields && template.fields.length > 0 && (
              <Card className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-serif text-xl text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                    Specifications
                  </h2>
                  
                  <div className="space-y-6">
                    {template.fields.map(field => (
                      <div key={field.id} className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 flex items-center justify-between">
                          {field.label}
                          {field.is_required && <span className="text-amber-700 ml-2" title="Required">*</span>}
                        </label>

                        {/* TEXT FIELD */}
                        {field.type === 'text' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            maxLength={field.max_length || undefined}
                            value={fieldValues[field.name] || ''}
                            onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                            className="w-full h-12 border border-gray-200 bg-white px-4 text-sm font-light focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/20 transition-all placeholder:text-gray-300"
                          />
                        )}

                        {/* SELECT FIELD */}
                        {field.type === 'select' && field.options && (
                          <Select
                            value={fieldValues[field.name] || ''}
                            onValueChange={(val) => handleFieldValueChange(field.name, val)}
                          >
                            <SelectTrigger className="w-full h-12 border border-gray-200 bg-white px-4 text-sm font-light focus:ring-1 focus:ring-amber-700/20 focus:border-amber-700 rounded-none">
                              <SelectValue placeholder={field.placeholder || 'Select...'} />
                            </SelectTrigger>
                            <SelectContent className="rounded-none border-gray-200">
                              {field.options.map(opt => (
                                <SelectItem key={opt.id} value={opt.value} className="text-sm font-light">
                                  {opt.label || opt.value}
                                  {opt.price_adjustment > 0 && (
                                    <span className="text-amber-700 ml-2">+{formatPrice(opt.price_adjustment)}</span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* COLOR FIELD */}
                        {field.type === 'color' && field.options && (
                          <div className="flex flex-wrap gap-3 pt-1">
                            {field.options.map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleFieldValueChange(field.name, opt.value)}
                                className={cn(
                                  "w-12 h-12 rounded-sm transition-all shadow-sm hover:shadow-md",
                                  fieldValues[field.name] === opt.value 
                                    ? 'ring-2 ring-amber-700 ring-offset-2 scale-105' 
                                    : 'hover:scale-105'
                                )}
                                style={{ backgroundColor: opt.color_hex || opt.value }}
                                title={`${opt.label || opt.value}${opt.price_adjustment > 0 ? ` (+${formatPrice(opt.price_adjustment)})` : ''}`}
                              />
                            ))}
                          </div>
                        )}

                        {/* IMAGE FIELD */}
                        {field.type === 'image' && (
                          <div className="border border-gray-200 bg-gray-50/50 p-4 hover:border-amber-700/50 transition-colors">
                            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                              <Upload className="w-5 h-5 text-gray-400" />
                              <span className="text-xs text-gray-500 uppercase tracking-wider">Upload Asset</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleFieldImageUpload(field.name, e.target.files[0])
                                  }
                                }}
                              />
                            </label>
                            {fieldValues[field.name] && (
                              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-[10px] uppercase tracking-widest text-green-700 font-semibold">
                                <Check className="w-3 h-3" /> 
                                Asset Secured
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons - Sticky */}
            <div className="sticky top-[180px] lg:top-[140px]">
              <Card className="border-gray-200/50 bg-white shadow-lg shadow-gray-200/50">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-serif text-lg text-gray-900 mb-4 pb-4 border-b border-gray-100">Finalize</h2>
                  
                  <div className="space-y-3">
                    <Button
                      className="w-full h-14 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-amber-900 hover:to-amber-800 text-white uppercase text-xs tracking-[0.25em] rounded-none transition-all shadow-md hover:shadow-lg"
                      onClick={handleAddToCart}
                      disabled={isAdding || isLoading}
                    >
                      {isAdding ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Securing...</>
                      ) : added ? (
                        <><Check className="w-4 h-4 mr-2" /> Secured in Bag</>
                      ) : (
                        <><ShoppingCart className="w-4 h-4 mr-2" /> Add to Bag</>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full h-12 border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 uppercase text-[10px] tracking-[0.2em] rounded-none transition-colors bg-transparent"
                      onClick={() => navigate('/cart')}
                    >
                      View Bag
                    </Button>
                  </div>

                  {/* Info Note */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 text-center">
                      Your customization will be preserved
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
