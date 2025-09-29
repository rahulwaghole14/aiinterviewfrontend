// src/components/dashboard/CustomizableDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiPlus, FiSettings, FiSave, FiRotateCcw } from 'react-icons/fi';
import DashboardWidget from './DashboardWidget';
import WidgetLibrary from './WidgetLibrary';
import { fetchDashboardData } from '../../redux/slices/dashboardSlice';
import { useNotification } from '../../hooks/useNotification';
import './CustomizableDashboard.css';

// Widget Components
import KPICard from './widgets/KPICard';
import ChartWidget from './widgets/ChartWidget';
import ActivityFeed from './widgets/ActivityFeed';
import PerformanceMetrics from './widgets/PerformanceMetrics';
import TrendAnalysis from './widgets/TrendAnalysis';
import RealTimeUpdates from './widgets/RealTimeUpdates';

const CustomizableDashboard = () => {
  const dispatch = useDispatch();
  const notify = useNotification();
  const dashboardData = useSelector((state) => state.dashboard.dashboardData);
  const loading = useSelector((state) => state.dashboard.status === 'loading');

  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [widgets, setWidgets] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);

  // Default widget configuration
  const defaultWidgets = [
    {
      id: 'total-resumes',
      type: 'kpi',
      title: 'Total Resumes',
      subtitle: 'Uploaded this month',
      size: { w: 1, h: 1 },
      position: { x: 0, y: 0 },
      config: {
        value: dashboardData?.resume_stats?.total_uploads || 1247,
        change: '+12%',
        trend: 'up',
        color: 'primary'
      }
    },
    {
      id: 'total-candidates',
      type: 'kpi',
      title: 'Total Candidates',
      subtitle: 'Active candidates',
      size: { w: 1, h: 1 },
      position: { x: 1, y: 0 },
      config: {
        value: dashboardData?.candidate_stats?.total_candidates || 892,
        change: '+8%',
        trend: 'up',
        color: 'success'
      }
    },
    {
      id: 'total-jobs',
      type: 'kpi',
      title: 'Total Jobs',
      subtitle: 'Posted this month',
      size: { w: 1, h: 1 },
      position: { x: 2, y: 0 },
      config: {
        value: dashboardData?.job_stats?.total_jobs || 156,
        change: '+15%',
        trend: 'up',
        color: 'info'
      }
    },
    {
      id: 'total-interviews',
      type: 'kpi',
      title: 'Total Interviews',
      subtitle: 'Completed this month',
      size: { w: 1, h: 1 },
      position: { x: 3, y: 0 },
      config: {
        value: dashboardData?.interview_stats?.total_interviews || 423,
        change: '+23%',
        trend: 'up',
        color: 'warning'
      }
    },
    {
      id: 'candidate-distribution',
      type: 'chart',
      title: 'Candidate Distribution',
      subtitle: 'By domain',
      size: { w: 2, h: 2 },
      position: { x: 0, y: 1 },
      config: {
        chartType: 'doughnut',
        data: dashboardData?.candidate_stats?.domain_distribution || [
          { name: 'Data Science', value: 25 },
          { name: 'Product Management', value: 20 },
          { name: 'DevOps', value: 18 },
          { name: 'Cybersecurity', value: 15 },
          { name: 'Cloud Computing', value: 22 }
        ],
        colors: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
      }
    },
    {
      id: 'resume-trends',
      type: 'chart',
      title: 'Resume Upload Trends',
      subtitle: 'Daily uploads',
      size: { w: 2, h: 2 },
      position: { x: 2, y: 1 },
      config: {
        chartType: 'line',
        data: dashboardData?.resume_stats?.daily_trend || [
          { date: '2025-01-20', uploads: 45 },
          { date: '2025-01-21', uploads: 52 },
          { date: '2025-01-22', uploads: 38 },
          { date: '2025-01-23', uploads: 61 },
          { date: '2025-01-24', uploads: 48 },
          { date: '2025-01-25', uploads: 55 },
          { date: '2025-01-26', uploads: 42 }
        ],
        colors: ['#8b5cf6']
      }
    },
    {
      id: 'recent-activities',
      type: 'activity',
      title: 'Recent Activities',
      subtitle: 'Latest updates',
      size: { w: 2, h: 2 },
      position: { x: 0, y: 3 },
      config: {
        limit: 10,
        showTimestamps: true
      }
    },
    {
      id: 'performance-metrics',
      type: 'performance',
      title: 'Performance Metrics',
      subtitle: 'Key indicators',
      size: { w: 2, h: 2 },
      position: { x: 2, y: 3 },
      config: {
        metrics: [
          { name: 'Interview Success Rate', value: '87%', trend: 'up' },
          { name: 'Average Response Time', value: '2.3s', trend: 'down' },
          { name: 'Candidate Satisfaction', value: '4.2/5', trend: 'up' }
        ]
      }
    }
  ];

  // Initialize widgets from localStorage or default
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (error) {
        console.error('Error loading saved widgets:', error);
        setWidgets(defaultWidgets);
      }
    } else {
      setWidgets(defaultWidgets);
    }
  }, []);

  // Save widgets to localStorage
  const saveWidgets = useCallback((widgetsToSave) => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgetsToSave));
    setLastSaved(new Date());
  }, []);

  // Handle widget move
  const handleWidgetMove = (widgetId, newPosition) => {
    // Find the widget being moved
    const movingWidget = widgets.find(w => w.id === widgetId);
    if (!movingWidget) return;

    // Check if the new position is occupied
    const isOccupied = widgets.some(widget => {
      if (widget.id === widgetId) return false;
      return widget.position?.x === newPosition.x && widget.position?.y === newPosition.y;
    });

    if (isOccupied) {
      // Find the widget at the target position and swap
      const targetWidget = widgets.find(w => 
        w.id !== widgetId && 
        w.position?.x === newPosition.x && 
        w.position?.y === newPosition.y
      );
      
      if (targetWidget) {
        // Swap positions
        const updatedWidgets = widgets.map(widget => {
          if (widget.id === widgetId) {
            return { ...widget, position: targetWidget.position };
          } else if (widget.id === targetWidget.id) {
            return { ...widget, position: movingWidget.position };
          }
          return widget;
        });
        
        setWidgets(updatedWidgets);
        saveWidgets(updatedWidgets);
      }
    } else {
      // Move to empty position
      const updatedWidgets = widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, position: newPosition };
        }
        return widget;
      });
      
      setWidgets(updatedWidgets);
      saveWidgets(updatedWidgets);
    }
  };

  // Handle widget swap
  const handleWidgetSwap = (sourceId, targetId) => {
    const sourceIndex = widgets.findIndex(w => w.id === sourceId);
    const targetIndex = widgets.findIndex(w => w.id === targetId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const sourceWidget = newWidgets[sourceIndex];
    const targetWidget = newWidgets[targetIndex];

    // Swap positions
    newWidgets[sourceIndex] = {
      ...sourceWidget,
      position: targetWidget.position
    };
    newWidgets[targetIndex] = {
      ...targetWidget,
      position: sourceWidget.position
    };

    setWidgets(newWidgets);
    saveWidgets(newWidgets);
  };

  // Helper function to check if a position is occupied
  const isPositionOccupied = (x, y, w, h, excludeId = null) => {
    return widgets.some(widget => {
      if (widget.id === excludeId) return false;
      
      const widgetX = widget.position?.x || 0;
      const widgetY = widget.position?.y || 0;
      const widgetW = widget.size?.w || 1;
      const widgetH = widget.size?.h || 1;
      
      // Check for overlap
      return !(x + w <= widgetX || x >= widgetX + widgetW || 
               y + h <= widgetY || y >= widgetY + widgetH);
    });
  };

  // Helper function to find the next available position
  const findAvailablePosition = (w, h) => {
    const maxX = 4 - w;
    const maxY = 10; // Maximum rows to check
    
    // Try to find a position row by row
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        if (!isPositionOccupied(x, y, w, h)) {
          return { x, y };
        }
      }
    }
    
    // If no position found, place at the end
    return { x: 0, y: Math.max(...widgets.map(w => (w.position?.y || 0) + (w.size?.h || 1))) };
  };

  // Add widget from library
  const handleAddWidget = (widgetTemplate) => {
    const size = widgetTemplate.defaultSize || { w: 1, h: 1 };
    const position = findAvailablePosition(size.w, size.h);
    
    const newWidget = {
      ...widgetTemplate,
      id: `${widgetTemplate.type}-${Date.now()}`,
      position,
      size
    };

    const updatedWidgets = [...widgets, newWidget];
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    setShowWidgetLibrary(false);
    notify.success('Widget added successfully!');
  };

  // Update widget configuration
  const handleUpdateWidget = (widgetId, updates) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
  };

  // Remove widget
  const handleRemoveWidget = (widgetId) => {
    const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
    setWidgets(updatedWidgets);
    saveWidgets(updatedWidgets);
    notify.success('Widget removed successfully!');
  };

  // Refresh widget data
  const handleRefreshWidget = async (widgetId) => {
    try {
      await dispatch(fetchDashboardData()).unwrap();
      notify.success('Widget data refreshed!');
    } catch (error) {
      notify.error('Failed to refresh widget data');
    }
  };

  // Reset to default layout
  const handleResetLayout = () => {
    setWidgets(defaultWidgets);
    saveWidgets(defaultWidgets);
    notify.success('Dashboard reset to default layout!');
  };

  // Render widget content based on type
  const renderWidgetContent = (widget) => {
    switch (widget.type) {
      case 'kpi':
        return <KPICard config={widget.config} />;
      case 'chart':
        return <ChartWidget config={widget.config} />;
      case 'activity':
        return <ActivityFeed config={widget.config} data={dashboardData} />;
      case 'performance':
        return <PerformanceMetrics config={widget.config} />;
      case 'trend':
        return <TrendAnalysis config={widget.config} data={dashboardData} />;
      case 'realtime':
        return <RealTimeUpdates config={widget.config} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  return (
    <div className="customizable-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Executive Dashboard</h1>
          <p>Customize your dashboard by dragging and resizing widgets</p>
        </div>
        
        <div className="dashboard-controls">
          {lastSaved && (
            <span className="last-saved">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          
          <button
            className={`control-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            <FiSettings />
            {isEditing ? 'Exit Edit' : 'Edit Layout'}
          </button>
          
          {isEditing && (
            <>
              <button
                className="control-btn add-widget"
                onClick={() => setShowWidgetLibrary(true)}
              >
                <FiPlus />
                Add Widget
              </button>
              
              <button
                className="control-btn reset"
                onClick={handleResetLayout}
              >
                <FiRotateCcw />
                Reset Layout
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-grid-container">
          {widgets
            .sort((a, b) => {
              // Sort by Y position first, then X position
              const aY = a.position?.y || 0;
              const bY = b.position?.y || 0;
              const aX = a.position?.x || 0;
              const bX = b.position?.x || 0;
              
              if (aY !== bY) {
                return aY - bY;
              }
              return aX - bX;
            })
            .map((widget, index) => (
            <DashboardWidget
              key={widget.id}
              widget={widget}
              index={index}
              isEditing={isEditing}
              onUpdateWidget={handleUpdateWidget}
              onRemoveWidget={handleRemoveWidget}
              onRefreshWidget={handleRefreshWidget}
              onMoveWidget={handleWidgetMove}
              onSwapWidget={handleWidgetSwap}
            >
              {renderWidgetContent(widget)}
            </DashboardWidget>
          ))}
        </div>
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={handleAddWidget}
          onClose={() => setShowWidgetLibrary(false)}
        />
      )}
    </div>
  );
};

export default CustomizableDashboard;
