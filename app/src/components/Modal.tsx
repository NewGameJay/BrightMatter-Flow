import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  type?: 'success' | 'error' | 'info'
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-blue-500 bg-blue-50'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 border-2 ${getTypeStyles()}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>{getIcon()}</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        <div className="text-gray-700">
          {children}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
