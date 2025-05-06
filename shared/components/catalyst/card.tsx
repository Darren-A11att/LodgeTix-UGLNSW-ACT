import React from 'react'
import clsx from 'clsx'

// Card Container
type CardProps = {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      {children}
    </div>
  )
}

// Card Header
type CardHeaderProps = {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={clsx('border-b border-slate-200 p-4 pb-3 flex justify-between items-center', className)}>
      {children}
    </div>
  )
}

// Card Title
type CardTitleProps = {
  className?: string
  children: React.ReactNode
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={clsx('text-xl font-bold text-slate-900', className)}>
      {children}
    </h3>
  )
}

// Card Body
type CardBodyProps = {
  className?: string
  children: React.ReactNode
}

export function CardBody({ className, children }: CardBodyProps) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  )
}

// Card Footer
type CardFooterProps = {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={clsx('border-t border-slate-200 p-4 bg-slate-50', className)}>
      {children}
    </div>
  )
} 