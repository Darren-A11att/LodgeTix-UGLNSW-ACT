import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx'; // Utility for conditional classes

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  href?: string; // If provided, renders as a Link
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className,
  type = 'button', // Default type for button element
  ...props
}) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center border border-transparent font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Size styles
  const sizeStyles = {
    xs: 'px-2 py-1 text-xs rounded-sm',
    sm: 'px-2.5 py-1.5 text-sm rounded-md',
    md: 'px-3 py-2 text-sm rounded-md', // Match example styles
    lg: 'px-3.5 py-2.5 text-sm rounded-md',
    xl: 'px-4 py-2.5 text-base rounded-md',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary-600 focus:ring-primary-500', // Use theme primary color
    secondary: 'bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-primary-500', // Use theme secondary focus
    soft: 'bg-primary-50 text-primary-700 shadow-sm hover:bg-primary-100 focus:ring-primary-500', // Use theme primary color
    link: 'text-primary hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500', // Link style
  };

  const combinedClassName = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    className // Allow overriding with custom classes
  );

  // If href is provided, render as a React Router Link
  if (href) {
    return (
      <Link to={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  // Otherwise, render as a button
  return (
    <button type={type} className={combinedClassName} {...props}>
      {children}
    </button>
  );
};

export default Button; 