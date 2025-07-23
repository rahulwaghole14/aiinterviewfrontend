// App.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Import useDispatch
import { setSearchTerm } from './redux/actions/searchActions'; // Import your search action

import SideBar from './components/SideBar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddCandidates from './components/AddCandidates';
import Interviews from './components/Interviews';
import Candidates from './components/Candidates';
import Jobs from './components/Jobs';
import Settings from './components/Settings';
import Login from './components/Login'; // Import Login component
import Register from './components/Registration'; // Import Register component
import Profile from './components/Profile'; // Import Profile component
import "./App.css";

function App() { // Renamed AppContent back to App as it's no longer wrapped by Provider here
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate
  const dispatch = useDispatch(); // Get dispatch function

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false); // desktop expanded/collapsed
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false); // mobile sidebar open/close
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // New state for mobile detection
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for authentication status
  const [headerTitle, setHeaderTitle] = useState(''); // New state for dynamic header title
  const sidebarTimeout = useRef(null);

  const path = location.pathname.split('/')[1] || 'dashboard';
  const subPath = location.pathname.split('/')[2];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Set initial header title based on path
    const getTitle = (currentPath) => {
      switch (currentPath) {
        case 'dashboard':
          return 'Dashboard';
        case 'add-candidates':
          return 'Add Candidates';
        case 'interviews':
          return 'Interviews';
        case 'candidates':
          return 'Candidates';
        case 'jobs':
          return 'Jobs';
        case 'settings':
          return 'Settings';
        case 'profile':
          return 'Profile';
        default:
          return 'IntelliHire';
      }
    };
    setHeaderTitle(getTitle(path));

  }, [location.pathname, path]);

  // Handle sidebar expansion on desktop (hover)
  const handleMouseEnter = () => {
    if (!isMobile) {
      clearTimeout(sidebarTimeout.current);
      setIsSidebarExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      sidebarTimeout.current = setTimeout(() => {
        setIsSidebarExpanded(false);
      }, 300); // Collapse after 300ms
    }
  };

  // Handle sidebar toggle for mobile and desktop click
  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarMobileOpen((prev) => !prev);
    } else {
      setIsSidebarExpanded((prev) => !prev);
    }
  };

  // Close mobile sidebar when a menu item is clicked
  const handleMenuItemClick = () => {
    if (isMobile) {
      setSidebarMobileOpen(false);
    }
  };

  const handleLogout = () => {
    // Perform logout actions (e.g., clear tokens, session)
    setIsLoggedIn(false);
    navigate('/login'); // Redirect to login page
  };

  const handleProfileMenuItemClick = (path) => {
    if (path === 'logout') {
      handleLogout();
    } else {
      navigate(path);
    }
  };

  // Function to update header title from child components (e.g., Profile)
  const updateHeaderTitle = (newTitle) => {
    setHeaderTitle(newTitle);
  };


  return (
    isLoggedIn ? (
      <div className={`app-container${isSidebarExpanded && !isMobile ? ' expanded' : ''}${sidebarMobileOpen && isMobile ? ' sidebar-mobile-open' : ''}`}>
        <SideBar
          isExpanded={isSidebarExpanded || (isMobile && sidebarMobileOpen)}
          onToggleSidebar={handleToggleSidebar}
          onMenuItemClick={handleMenuItemClick}
        />
        <div className="main-content">
          <Header
            title={headerTitle}
            isSidebarExpanded={isSidebarExpanded}
            sidebarMobileOpen={sidebarMobileOpen} // <-- Pass this prop
            onToggleSidebar={handleToggleSidebar}
            isMobile={isMobile}
            onLogout={handleLogout}
            onProfileMenuItemClick={handleProfileMenuItemClick}
          />
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} /> {/* Default route after login */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-candidates" element={<AddCandidates />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile onTitleChange={updateHeaderTitle} />} />
              {/* Removed /profile/edit route as "Edit Details" menu item is removed */}
            </Routes>
          </div>
        </div>
      </div>
    ) : (
      // Render login/register pages if not logged in
      <Routes>
        <Route path="/" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/register" element={<Register />} />
        {/* Fallback for any other path if not logged in, redirect to login */}
        <Route path="*" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
      </Routes>
    )
  );
}

export default App;
