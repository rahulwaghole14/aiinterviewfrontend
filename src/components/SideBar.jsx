// SideBar.jsx
import React from 'react';
import {
  MdDashboard,
  MdPersonAdd,
  MdGroups,
  MdWork,
  MdSettings,
  MdBusiness, // Import new icon for Hiring Agencies
} from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/RSL_Logo.png'; // Assuming you have a logo image
// Remove isMobile from props
const SideBar = ({ isExpanded, onToggleSidebar, onMenuItemClick }) => {
  const location = useLocation();
  const activeItem = location.pathname.split('/')[1] || 'dashboard';

  const menu = [
    { name: 'Dashboard', path: 'dashboard', icon: <MdDashboard size={20} /> },
    { name: 'Add Candidates', path: 'add-candidates', icon: <MdPersonAdd size={20} /> },
    // Removed 'Interviews' tab
    { name: 'Candidates', path: 'candidates', icon: <MdGroups size={20} /> },
    { name: 'Jobs', path: 'jobs', icon: <MdWork size={20} /> },
    { name: 'Hiring Agencies', path: 'hiring-agencies', icon: <MdBusiness size={20} /> }, // New item
    { name: 'Settings', path: 'settings', icon: <MdSettings size={20} /> },
  ];

  // Remove handleMenuItemClick as it was only for mobile sidebar auto-closing
  const handleMenuItemClick = () => {
    // This function can remain if you want to perform other actions on click,
    // but the `if (isMobile)` condition is now removed.
  };

  return (
    <div className="sidebar">
      <Link className="logo-link" to="/" onClick={onMenuItemClick}>
        <img
          src={logo}
          alt="Logo"
          className="logo"
        />
        {isExpanded && <h2 className="brand-name">IntelliHire</h2>}
      </Link>

      <ul className="sidebar-menu">
        {menu.map((item, index) => (
          <li key={index}>
            <Link
              to={`/${item.path}`}
              className={`sidebar-item ${
                activeItem === item.path ? 'active' : ''
              }`}
              title={!isExpanded ? item.name : ''}
              onClick={onMenuItemClick}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {isExpanded && <span>{item.name}</span>}
            </Link>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        {/* You can add footer items here, e.g., user profile, logout */}
      </div>
    </div>
  );
};

export default SideBar;
