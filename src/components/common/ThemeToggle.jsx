import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import './ThemeToggle.css';

const ThemeToggle = ({ variant = 'button', showLabels = true, className = '' }) => {
  const { theme, isSystemTheme, toggleTheme, setSystemTheme, setLightTheme, setDarkTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (themeFunction) => {
    themeFunction();
    setIsOpen(false);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`theme-dropdown ${isOpen ? 'open' : ''} ${className}`} ref={dropdownRef}>
        <div 
          className="theme-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="theme-icon">
            {isSystemTheme ? <FaDesktop /> : theme === 'dark' ? <FaMoon /> : <FaSun />}
          </span>
          {showLabels && <span className="theme-label">Theme</span>}
        </div>
        <div className="theme-dropdown-menu">
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
        </div>
      </div>
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
