// SideBar.jsx
import React from 'react';
import { useSelector } from 'react-redux'; // Import useSelector to get user state
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

const SideBar = ({ isExpanded, onToggleSidebar, onMenuItemClick }) => {
  const location = useLocation();
  const activeItem = location.pathname.split('/')[1] || 'dashboard';
  const user = useSelector((state) => state.user.user); // Get the user object from Redux state

  const menu = [
    { name: 'Dashboard', path: 'dashboard', icon: <MdDashboard size={20} /> },
    { name: 'Add Candidates', path: 'add-candidates', icon: <MdPersonAdd size={20} /> },
    { name: 'Candidates', path: 'candidates', icon: <MdGroups size={20} /> },
    { name: 'Jobs', path: 'jobs', icon: <MdWork size={20} /> },
    { name: 'Hiring Agencies', path: 'hiring-agencies', icon: <MdBusiness size={20} /> },
    { name: 'Settings', path: 'settings', icon: <MdSettings size={20} /> },
  ];

  // Filter the menu based on the user's role
  const filteredMenu = menu.filter((item) => {
    // Normalize the user role to a consistent format (lowercase, underscores instead of spaces/hyphens)
    // This handles variations like "HIRING_AGENCY", "hiring agency", "hiring-agency", "Recruiter", etc.
    const normalizedUserRole = user?.role?.toLowerCase().replace(/[\s-]/g, '_');

    // Check if the normalized user role is one of the restricted roles
    const isRestrictedUser = normalizedUserRole === 'recruiter' || normalizedUserRole === 'hiring_agency';

    // Check if the current menu item is 'Candidates' or 'Hiring Agencies'
    const isRestrictedItem = item.path === 'hiring-agencies';

    // If the user is a restricted type (recruiter/agency) AND the item is a restricted item, filter it out.
    // Otherwise, keep the item.
    return !(isRestrictedUser && isRestrictedItem);
  });

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
        {filteredMenu.map((item, index) => (
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
