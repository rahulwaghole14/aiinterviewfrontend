// src/components/dashboard/DashboardWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiMaximize2, FiMinimize2, FiX, FiRefreshCw, FiMove, FiDatabase } from 'react-icons/fi';
import WidgetDataSettings from './WidgetDataSettings';
import './DashboardWidget.css';

const DashboardWidget = ({ 
  widget, 
  index, 
  isEditing = false, 
  onUpdateWidget, 
  onRemoveWidget,
  onRefreshWidget,
  onMoveWidget,
  onSwapWidget,
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDataSettings, setShowDataSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragPreview, setDragPreview] = useState(null);
  const widgetRef = useRef(null);

  const handleRefresh = async () => {
    if (onRefreshWidget) {
      setIsRefreshing(true);
      try {
        await onRefreshWidget(widget.id);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleDataSettings = () => {
    setShowDataSettings(!showDataSettings);
  };

  const handleRemove = () => {
    if (onRemoveWidget) {
      onRemoveWidget(widget.id);
    }
  };


  const handleDragHandleMouseDown = (e) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Visual feedback during drag
    if (widgetRef.current) {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      widgetRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      widgetRef.current.style.zIndex = '1000';
    }
    
    // Calculate preview position
    const gridContainer = document.querySelector('.dashboard-grid-container');
    if (gridContainer) {
      const gridRect = gridContainer.getBoundingClientRect();
      const relativeX = e.clientX - gridRect.left;
      const relativeY = e.clientY - gridRect.top;
      
      const colWidth = gridRect.width / 4;
      const rowHeight = 220;
      
      const newCol = Math.floor(relativeX / colWidth);
      const newRow = Math.floor(relativeY / rowHeight);
      
      const clampedCol = Math.max(0, Math.min(3, newCol));
      const clampedRow = Math.max(0, newRow);
      
      setDragPreview({ x: clampedCol, y: clampedRow });
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging || !isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragPreview(null);
    
    // Reset transform
    if (widgetRef.current) {
      widgetRef.current.style.transform = '';
      widgetRef.current.style.zIndex = '';
    }
    
    // Use the preview position if available
    if (dragPreview) {
      const currentPos = widget.position || { x: 0, y: 0 };
      if (currentPos.x !== dragPreview.x || currentPos.y !== dragPreview.y) {
        if (onMoveWidget) {
          onMoveWidget(widget.id, { x: dragPreview.x, y: dragPreview.y });
        }
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isEditing]);

  const widgetContent = (
    <>
      {/* Data Settings Modal - Render outside widget container */}
      {showDataSettings && isEditing && (
        <>
          <div className="widget-backdrop" onClick={() => setShowDataSettings(false)} />
          <WidgetDataSettings
            widget={widget}
            onUpdateWidget={onUpdateWidget}
            onClose={() => setShowDataSettings(false)}
          />
        </>
      )}
      
      {/* Backdrop for expanded widget - positioned behind the widget */}
      {isExpanded && !showDataSettings && (
        <div className="widget-backdrop" onClick={() => setIsExpanded(false)} />
      )}
      
      <div 
        ref={widgetRef}
        className={`dashboard-widget ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          gridColumn: `${(widget.position?.x || 0) + 1} / span ${widget.size?.w || 1}`,
          gridRow: `${(widget.position?.y || 0) + 1} / span ${widget.size?.h || 1}`,
          ...(isExpanded && {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '85vw',
            height: '85vh',
            maxWidth: '1200px',
            maxHeight: '800px',
            zIndex: 1000,
            gridColumn: 'unset',
            gridRow: 'unset'
          })
        }}
      >
      {/* Widget Header */}
      <div className="widget-header">
        <div className="widget-title">
          <h3>{widget.title}</h3>
          {widget.subtitle && <span className="widget-subtitle">{widget.subtitle}</span>}
        </div>
        
        <div className="widget-controls">
          {onRefreshWidget && (
            <button 
              className="widget-control-btn refresh"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh data"
            >
              <FiRefreshCw className={isRefreshing ? 'spinning' : ''} />
            </button>
          )}
          
          <button 
            className="widget-control-btn expand"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          
          {isEditing && (
            <>
              <button 
                className="widget-control-btn drag-handle"
                onMouseDown={handleDragHandleMouseDown}
                title="Drag to move widget"
              >
                <FiMove />
              </button>
              <button 
                className="widget-control-btn data-settings"
                onClick={handleDataSettings}
                title="Data source settings"
              >
                <FiDatabase />
              </button>
              <button 
                className="widget-control-btn remove"
                onClick={handleRemove}
                title="Remove widget"
              >
                <FiX />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className={`widget-content ${widget.type === 'chart' ? 'chart-widget' : ''}`}>
        {isRefreshing ? (
          <div className="widget-loading">
            <div className="loading-spinner"></div>
            <p>Refreshing...</p>
          </div>
        ) : (
          children
        )}
      </div>


      </div>
    </>
  );

  return widgetContent;
};

export default DashboardWidget;
