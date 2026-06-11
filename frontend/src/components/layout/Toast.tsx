import { useEffect } from 'react'
import './Toast.css'

interface ToastProps {
  message: string
  type?: 'success' | 'danger' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const iconClass = {
    success: 'fa-check-circle',
    danger: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type]

  return (
    <div className={`toast-modern toast-${type}`}>
      <div className="toast-icon">
        <i className={`fas ${iconClass}`}></i>
      </div>
      <div className="toast-content">
        {message}
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close">
        <i className="fas fa-times"></i>
      </button>
      <div 
        className="toast-progress" 
        style={{ animationDuration: `${duration}ms` }}
      ></div>
    </div>
  )
}
