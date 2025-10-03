import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import './CustomDropdown.css';

const CustomDropdown = ({ 
  value, 
  options, 
  onChange, 
  placeholder = "Select...",
  className = "",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    console.log('CustomDropdown handleSelect called with:', optionValue, 'type:', typeof optionValue);
    console.log('Current value before change:', value, 'type:', typeof value);
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;
  
  // Debug logging
  console.log('CustomDropdown render:', {
    value,
    valueType: typeof value,
    options: options.map(opt => ({ value: opt.value, valueType: typeof opt.value, label: opt.label })),
    selectedOption,
    displayText
  });
  

  return (
    <>
      <div className={`custom-dropdown ${className} ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          className={`custom-dropdown-button ${isOpen ? 'open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className="dropdown-selected-text">{displayText}</span>
          <FiChevronDown className={`dropdown-icon ${isOpen ? 'open' : ''}`} />
        </button>
      </div>

      {isOpen && !disabled && ReactDOM.createPortal(
        <div 
          className="custom-dropdown-menu custom-dropdown-portal"
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`custom-dropdown-item ${value === option.value ? 'active' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default CustomDropdown;

