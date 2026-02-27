/**
 * Widget Container Component
 * Generic container for dashboard widgets with consistent styling
 */
import { useState } from 'react';

export default function WidgetContainer({ 
  widget, 
  children, 
  onPrimaryAction,
  loading = false 
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-2',
    large: 'col-span-1 md:col-span-3',
    full: 'col-span-1 md:col-span-4',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${sizeClasses[widget.size] || sizeClasses.medium}`}>
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{widget.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-gray-800">{widget.title}</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {widget.primary_action && onPrimaryAction && (
            <button
              onClick={() => onPrimaryAction(widget.primary_action)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                widget.primary_action.style === 'success'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : widget.primary_action.style === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {widget.primary_action.label}
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {isExpanded && (
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}
