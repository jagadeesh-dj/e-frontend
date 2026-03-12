import { useEffect, useRef, useState, forwardRef, useImperativeHandle, Ref } from 'react'
import * as fabric from 'fabric'

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
    const fabricCanvasRef = useRef<any>(null)
    const [isCanvasReady, setIsCanvasReady] = useState(false)
    const initializedRef = useRef(false)

    // Initialize Fabric canvas
    useEffect(() => {
      if (!canvasRef.current || initializedRef.current) return

      // Check if canvas already has a Fabric instance
      const existingCanvas = (canvasRef.current as any).__fabric
      if (existingCanvas) {
        existingCanvas.dispose()
      }

      // Create Fabric canvas
      const canvas = new (fabric as any).Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor,
        selection: true,
        preserveObjectStacking: true,
      })

      // Configure default object properties
      ;(fabric as any).Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#3b82f6',
        borderColor: '#3b82f6',
        cornerSize: 12,
        padding: 5,
        cornerStyle: 'circle',
        borderDashArray: [4, 4],
      })

      fabricCanvasRef.current = canvas
      setIsCanvasReady(true)
      initializedRef.current = true

      // Notify parent that canvas is ready
      onCanvasReady?.(canvas)

      // Add initial text guide
      const guideText = new (fabric as any).Text('Double-click to edit', {
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        fontSize: 16,
        fill: '#9ca3af',
        selectable: false,
        evented: false,
      })
      canvas.add(guideText)
      canvas.sendObjectToBack(guideText)

      // Cleanup on unmount
      return () => {
        if (canvas) {
          canvas.dispose()
        }
        initializedRef.current = false
      }
    }, []) // Empty dependency array - only initialize once

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      get canvas() {
        return fabricCanvasRef.current
      },

      addText: (text = 'Your Text') => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        // Remove guide text if it exists
        const objects = canvas.getObjects()
        const guideText = objects.find((obj: any) =>
          obj.type === 'text' &&
          obj.text === 'Double-click to edit' &&
          obj.fill === '#9ca3af'
        )
        if (guideText) {
          canvas.remove(guideText)
        }

        const newText = new (fabric as any).IText(text, {
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          fontSize: 32,
          fontFamily: 'Arial',
          fill: '#1f2937',
          fontWeight: 'bold',
        })

        canvas.add(newText)
        canvas.setActiveObject(newText)
        canvas.renderAll()
      },

      addImage: async (file: File) => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (f) => {
            const data = f.target?.result as string
            ;(fabric as any).Image.fromURL(data, (img: any) => {
              // Remove guide text if it exists
              const objects = canvas.getObjects()
              const guideText = objects.find((obj: any) =>
                obj.type === 'text' &&
                obj.text === 'Double-click to edit' &&
                obj.fill === '#9ca3af'
              )
              if (guideText) {
                canvas.remove(guideText)
              }

              // Scale image to fit canvas
              const maxWidth = canvasWidth * 0.8
              const maxHeight = canvasHeight * 0.8
              let scale = 1

              if (img.width > maxWidth || img.height > maxHeight) {
                scale = Math.min(maxWidth / img.width, maxHeight / img.height)
              }

              img.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
              })

              canvas.add(img)
              canvas.setActiveObject(img)
              canvas.renderAll()
              resolve()
            }, {
              crossOrigin: 'anonymous'
            })
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      },

      deleteSelected: () => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        const activeObject = canvas.getActiveObject()
        if (activeObject) {
          if (activeObject.type === 'activeSelection') {
            // Multiple objects selected
            const objects = (activeObject as any).getObjects()
            objects.forEach((obj: any) => canvas.remove(obj))
            canvas.discardActiveObject()
          } else {
            canvas.remove(activeObject)
          }
          canvas.renderAll()
        }
      },

      resetDesign: () => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return

        canvas.clear()
        canvas.setBackgroundColor(backgroundColor, () => {})

        // Add guide text back
        const guideText = new (fabric as any).Text('Double-click to edit', {
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: 'center',
          originY: 'center',
          fontSize: 16,
          fill: '#9ca3af',
          selectable: false,
          evented: false,
        })
        canvas.add(guideText)
        canvas.renderAll()
      },

      exportDesign: () => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return null
        return canvas.toJSON()
      },

      getCanvasJSON: () => {
        const canvas = fabricCanvasRef.current
        if (!canvas) return null
        return canvas.toJSON()
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
