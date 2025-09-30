// src/components/dashboard/DashboardWidget.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSettings, FiMaximize2, FiMinimize2, FiX, FiRefreshCw, FiMove } from 'react-icons/fi';
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
  lastWidgetPosition,
  onDragStart,
  isDragging,
  children 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleRemove = () => {
    if (onRemoveWidget) {
      onRemoveWidget(widget.id);
    }
  };

  const handleResize = (newSize) => {
    if (onUpdateWidget) {
      onUpdateWidget(widget.id, { size: newSize });
    }
  };

  const handleMouseDown = (e) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Use the new drag system
    if (onDragStart) {
      onDragStart(widget.id, e);
    }
  };

  // Remove old drag logic - now handled by the new drag system

  // Remove old drag logic - now handled by the new drag system

  const widgetContent = (
    <>
      {isExpanded && <div className="widget-backdrop" onClick={() => setIsExpanded(false)} />}
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
        onMouseDown={handleMouseDown}
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
                onMouseDown={handleMouseDown}
                title="Drag to move widget"
              >
                <FiMove />
              </button>
              <button 
                className="widget-control-btn settings"
                onClick={handleSettings}
                title="Widget settings"
              >
                <FiSettings />
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

      {/* Widget Settings Panel */}
      {showSettings && isEditing && (
        <div className="widget-settings">
          <h4>Widget Settings</h4>
          <div className="settings-group">
            <label>Size</label>
            <div className="size-controls">
              <button 
                className={`size-btn ${widget.size?.w === 1 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, w: 1 })}
              >
                Small
              </button>
              <button 
                className={`size-btn ${widget.size?.w === 2 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, w: 2 })}
              >
                Medium
              </button>
              <button 
                className={`size-btn ${widget.size?.w === 3 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, w: 3 })}
              >
                Large
              </button>
            </div>
          </div>
          <div className="settings-group">
            <label>Height</label>
            <div className="height-controls">
              <button 
                className={`height-btn ${widget.size?.h === 1 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, h: 1 })}
              >
                Short
              </button>
              <button 
                className={`height-btn ${widget.size?.h === 2 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, h: 2 })}
              >
                Medium
              </button>
              <button 
                className={`height-btn ${widget.size?.h === 3 ? 'active' : ''}`}
                onClick={() => handleResize({ ...widget.size, h: 3 })}
              >
                Tall
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );

  return widgetContent;
};

export default DashboardWidget;
