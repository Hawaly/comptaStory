import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'info';
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', className = '' }: StatCardProps) {
  const variantClasses = {
    default: 'border-l-gray-400 bg-white',
    brand: 'border-l-brand-orange bg-gradient-to-br from-white to-orange-50',
    success: 'border-l-green-500 bg-gradient-to-br from-white to-green-50',
    warning: 'border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50',
    info: 'border-l-blue-500 bg-gradient-to-br from-white to-blue-50',
  };
  
  const iconVariantClasses = {
    default: 'text-gray-600',
    brand: 'text-brand-orange',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  };
  
  return (
    <div className={`rounded-2xl shadow-elegant border-l-4 ${variantClasses[variant]} p-6 transition-all duration-300 hover:shadow-elegant-lg hover:scale-105 animate-fade-in ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">{title}</p>
        <div className={`p-2.5 rounded-xl bg-white shadow-md ${iconVariantClasses[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
