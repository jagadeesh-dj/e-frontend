import { useEffect, useRef, useState, forwardRef, useImperativeHandle, Ref } from 'react'

interface CanvasObject {
  id: string
  type: 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  content?: string
  imageData?: string
  fontSize?: number
  fill?: string
  selected?: boolean
}

interface DesignEditorProps {
  canvasWidth?: number
  canvasHeight?: number
  backgroundColor?: string
  onCanvasReady?: (canvas: any) => void
}

export interface DesignEditorRef {
  canvas: any | null
  addText: (text?: string) => void
  addImage: (file: File) => Promise<void>
  deleteSelected: () => void
  resetDesign: () => void
  exportDesign: () => any
  getCanvasJSON: () => any
}

const DesignEditor = forwardRef<DesignEditorRef, DesignEditorProps>(
  ({ canvasWidth = 400, canvasHeight = 400, backgroundColor = '#ffffff', onCanvasReady }, ref: Ref<DesignEditorRef>) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null)
    const canvasObjectsRef = useRef<CanvasObject[]>([])
    const selectedObjectRef = useRef<string | null>(null)
    const [isCanvasReady, setIsCanvasReady] = useState(false)
    const initializedRef = useRef(false)

    const redrawCanvas = () => {
      const ctx = canvasContextRef.current
      if (!ctx) return

      // Clear canvas with background color
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // Draw objects
      canvasObjectsRef.current.forEach((obj) => {
        if (obj.type === 'text') {
          ctx.font = `${obj.fontSize || 16}px Arial`
          ctx.fillStyle = obj.fill || '#1f2937'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.content || '', obj.x, obj.y)
        } else if (obj.type === 'image' && obj.imageData) {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height)
            if (obj.selected) {
              ctx.strokeStyle = '#3b82f6'
              ctx.lineWidth = 2
              ctx.strokeRect(obj.x - obj.width / 2, obj.y - obj.height / 2, obj.width, obj.height)
            }
          }
          img.src = obj.imageData
        }

        // Draw selection border
        if (obj.selected) {
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])
          if (obj.type === 'text') {
            const textWidth = ctx.measureText(obj.content || '').width
            ctx.strokeRect(obj.x - textWidth / 2 - 5, obj.y - (obj.fontSize || 16) / 2 - 5, textWidth + 10, (obj.fontSize || 16) + 10)
          }
          ctx.setLineDash([])
        }
      })
    }

    // Initialize canvas
    useEffect(() => {
      if (!canvasRef.current || initializedRef.current) return

      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      canvasRef.current.width = canvasWidth
      canvasRef.current.height = canvasHeight
      canvasContextRef.current = ctx

      // Draw initial guide text
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      ctx.font = '16px Arial'
      ctx.fillStyle = '#9ca3af'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Double-click to edit', canvasWidth / 2, canvasHeight / 2)

      setIsCanvasReady(true)
      initializedRef.current = true

      // Notify parent
      onCanvasReady?.(canvasRef.current)

      return () => {
        initializedRef.current = false
      }
    }, []) // Empty dependency array - only initialize once

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      get canvas() {
        return canvasRef.current
      },

      addText: (text = 'Your Text') => {
        const newObj: CanvasObject = {
          id: Math.random().toString(),
          type: 'text',
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          width: 0,
          height: 32,
          content: text,
          fontSize: 32,
          fill: '#1f2937',
          selected: true,
        }
        canvasObjectsRef.current.forEach((obj) => (obj.selected = false))
        canvasObjectsRef.current.push(newObj)
        selectedObjectRef.current = newObj.id
        redrawCanvas()
      },

      addImage: async (file: File) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (f) => {
            const imageData = f.target?.result as string
            const img = new Image()
            img.onload = () => {
              const maxWidth = canvasWidth * 0.8
              const maxHeight = canvasHeight * 0.8
              let scale = 1

              if (img.width > maxWidth || img.height > maxHeight) {
                scale = Math.min(maxWidth / img.width, maxHeight / img.height)
              }

              const newObj: CanvasObject = {
                id: Math.random().toString(),
                type: 'image',
                x: canvasWidth / 2,
                y: canvasHeight / 2,
                width: img.width * scale,
                height: img.height * scale,
                imageData,
                selected: true,
              }
              canvasObjectsRef.current.forEach((obj) => (obj.selected = false))
              canvasObjectsRef.current.push(newObj)
              selectedObjectRef.current = newObj.id
              redrawCanvas()
              resolve()
            }
            img.src = imageData
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      },

      deleteSelected: () => {
        if (selectedObjectRef.current) {
          canvasObjectsRef.current = canvasObjectsRef.current.filter((obj) => obj.id !== selectedObjectRef.current)
          selectedObjectRef.current = null
          redrawCanvas()
        }
      },

      resetDesign: () => {
        canvasObjectsRef.current = []
        selectedObjectRef.current = null
        const ctx = canvasContextRef.current
        if (ctx) {
          ctx.fillStyle = backgroundColor
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
          ctx.font = '16px Arial'
          ctx.fillStyle = '#9ca3af'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('Double-click to edit', canvasWidth / 2, canvasHeight / 2)
        }
      },

      exportDesign: () => {
        return {
          objects: canvasObjectsRef.current,
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor,
        }
      },

      getCanvasJSON: () => {
        return {
          objects: canvasObjectsRef.current,
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor,
        }
      },
    }), [canvasWidth, canvasHeight, backgroundColor])

    return (
      <div className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg">
        <canvas ref={canvasRef} />
        {!isCanvasReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-gray-500">Loading canvas...</div>
          </div>
        )}
      </div>
    )
  }
)

DesignEditor.displayName = 'DesignEditor'

export default DesignEditor
