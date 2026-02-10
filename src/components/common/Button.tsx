import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-accuracy-medium to-accuracy-medium-light hover:from-accuracy-navy hover:to-accuracy-medium text-white shadow-md',
    secondary: 'bg-accuracy-gray bg-opacity-20 hover:bg-opacity-30 text-accuracy-navy border border-accuracy-gray',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-md',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-md',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-gray-900 shadow-md',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
