import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'button', showLabels = true, className = '' }) => {
  const { theme, isSystemTheme, toggleTheme, setSystemTheme, setLightTheme, setDarkTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate dropdown position
  const calculatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 128; // min-width from CSS
      const viewportWidth = window.innerWidth;
      
      // Calculate if dropdown would go off-screen to the right
      const wouldOverflowRight = rect.right - dropdownWidth < 0;
      
      const position = {
        top: rect.bottom + 2,
        ...(wouldOverflowRight 
          ? { left: rect.left } // Use left positioning if right would overflow
          : { right: viewportWidth - rect.right } // Use right positioning normally
        )
      };
      
      console.log('Dropdown position calculated:', position, 'Trigger rect:', rect, 'Would overflow right:', wouldOverflowRight);
      setDropdownPosition(position);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      calculatePosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Recalculate position on window resize and scroll
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const handleThemeSelect = (themeFunction) => {
    themeFunction();
    setIsOpen(false);
  };

  if (variant === 'dropdown') {
    return (
      <>
        <div className={`theme-dropdown ${className}`}>
          <div 
            ref={triggerRef}
            className="theme-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="theme-icon">
              {isSystemTheme ? <FaDesktop /> : theme === 'dark' ? <FaMoon /> : <FaSun />}
            </span>
            {showLabels && <span className="theme-label">Theme</span>}
          </div>
        </div>
        {isOpen && createPortal(
          <div 
            ref={dropdownRef}
            className="theme-dropdown-menu"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`
            }}
          >
            <button
              className={`theme-option ${theme === 'light' && !isSystemTheme ? 'active' : ''}`}
              onClick={() => handleThemeSelect(setLightTheme)}
            >
              <FaSun className="theme-option-icon" />
              <span>Light</span>
            </button>
            <button
              className={`theme-option ${theme === 'dark' && !isSystemTheme ? 'active' : ''}`}
              onClick={() => handleThemeSelect(setDarkTheme)}
            >
              <FaMoon className="theme-option-icon" />
              <span>Dark</span>
            </button>
            <button
              className={`theme-option ${isSystemTheme ? 'active' : ''}`}
              onClick={() => handleThemeSelect(setSystemTheme)}
            >
              <FaDesktop className="theme-option-icon" />
              <span>System</span>
            </button>
          </div>,
          document.body
        )}
      </>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`theme-switch ${className}`}>
        <label className="theme-switch-label">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
            className="theme-switch-input"
          />
          <span className="theme-switch-slider">
            <span className="theme-switch-icon">
              {theme === 'dark' ? <FaMoon /> : <FaSun />}
            </span>
          </span>
          {showLabels && <span className="theme-switch-text">Dark Mode</span>}
        </label>
      </div>
    );
  }

  // Default button variant
  return (
    <button
      className={`theme-toggle-button ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <span className="theme-toggle-icon">
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
      </span>
      {showLabels && (
        <span className="theme-toggle-text">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
