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
  MdCalendarToday, // Import new icon for AI Interview Scheduler
  MdAssessment, // Import new icon for Interview Results
  MdDataUsage, // Import new icon for Data Listing
} from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/talaro-logo.png'; // Talaro logo

const SideBar = ({ isExpanded, onToggleSidebar, onMenuItemClick }) => {
  const location = useLocation();
  const activeItem = location.pathname.split('/')[1] || 'dashboard';
  const user = useSelector((state) => state.user.user); // Get the user object from Redux state

  const menu = [
    { name: 'Dashboard', path: 'dashboard', icon: <MdDashboard size={20} /> },
    { name: 'Add Candidates', path: 'add-candidates', icon: <MdPersonAdd size={20} /> },
    { name: 'Candidates', path: 'candidates', icon: <MdGroups size={20} /> },
    { name: 'Jobs', path: 'jobs', icon: <MdWork size={20} /> },
    { name: 'Hiring Agencies', path: 'hiring-agencies', icon: <MdBusiness size={20} />, restrictedRoles: ['recruiter', 'hiring_agency'] },
    { name: 'Talaro Interview Scheduler', path: 'ai-interview-scheduler', icon: <MdCalendarToday size={20} />, allowedRoles: ['company', 'admin'] },
    // { name: 'Interview Results', path: 'interview-results', icon: <MdAssessment size={20} />, allowedRoles: ['company', 'admin'] },
    { name: 'Settings', path: 'settings', icon: <MdSettings size={20} /> },
  ];

  // Filter the menu based on the user's role
  const filteredMenu = menu.filter((item) => {
    const normalizedUserRole = user?.role?.toLowerCase().replace(/[\s-]/g, '_');

    // If item has restrictedRoles, check if user's role is in that list
    if (item.restrictedRoles?.includes(normalizedUserRole)) {
      return false;
    }

    // If item has allowedRoles, check if user's role is in that list
    if (item.allowedRoles && !item.allowedRoles.includes(normalizedUserRole)) {
      return false;
    }

    return true;
  });

  return (
    <div className="sidebar">
      <Link className="logo-link" to="/" onClick={onMenuItemClick}>
        <img
          src={logo}
          alt="Logo"
          className="logo"
        />
        {isExpanded && <h2 className="brand-name">Talaro</h2>}
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
