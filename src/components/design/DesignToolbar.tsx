import { useRef } from 'react'
import { Upload, Type, Trash2, RotateCcw, Download } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'

interface DesignToolbarProps {
  canvas: any | null
  onAddText: () => void
  onUploadImage: (file: File) => void
  onDeleteSelected: () => void
  onResetDesign: () => void
  onExportDesign: () => any
}

export default function DesignToolbar({
  canvas,
  onAddText,
  onUploadImage,
  onDeleteSelected,
  onResetDesign,
  onExportDesign,
}: DesignToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onUploadImage(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddText = () => {
    onAddText()
  }

  const handleDeleteSelected = () => {
    const activeObject = canvas?.getActiveObject()
    if (activeObject) {
      onDeleteSelected()
    }
  }

  const handleResetDesign = () => {
    if (window.confirm('Are you sure you want to reset your design? All changes will be lost.')) {
      onResetDesign()
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upload Image Section */}
      <div className="space-y-2 sm:space-y-3">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700">Upload Image</Label>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Upload</span>
            <span className="sm:hidden">Image</span>
          </Button>
        </div>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
      </div>

      {/* Add Text Section */}
      <div className="space-y-2 sm:space-y-3">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700">Add Text</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
          onClick={handleAddText}
        >
          <Type className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Custom Text</span>
          <span className="sm:hidden">Text</span>
        </Button>
      </div>

      {/* Selected Object Actions */}
      <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700">Edit Design</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
            onClick={handleDeleteSelected}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
            onClick={handleResetDesign}
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Export Section - Hidden on mobile */}
      <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t hidden sm:block">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700">Export Design</Label>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
          onClick={() => {
            const json = onExportDesign()
            console.log('Exported design JSON:', json)
          }}
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          Export JSON (Console)
        </Button>
      </div>

      {/* Tips Section - Hidden on mobile */}
      <div className="pt-3 sm:pt-4 border-t hidden sm:block">
        <Label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-2">Tips</Label>
        <ul className="text-xs text-gray-500 space-y-1">
          <li>• Click and drag to move objects</li>
          <li>• Use corner handles to resize</li>
          <li>• Use rotation handle to rotate</li>
          <li>• Select an object to edit it</li>
        </ul>
      </div>
    </div>
  )
}
