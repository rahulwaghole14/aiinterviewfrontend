// App.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, Route, Routes, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm } from './redux/actions/searchActions';

import SideBar from './components/SideBar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddCandidates from './components/AddCandidates';
import Candidates from './components/Candidates';
import CandidateDetails from './components/CandidateDetails'; // Import the new CandidateDetails component
import Jobs from './components/Jobs';
import Settings from './components/Settings';
import Login from './components/Login';
import Register from './components/Registration';
import Profile from './components/Profile';
import HiringAgencies from './components/HiringAgency';
import "./App.css";

const initialTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', initialTheme);

const getInitialHeaderTitle = () => {
  const path = window.location.pathname.split('/')[1];
  const subPath = window.location.pathname.split('/')[2];
  let title = 'Dashboard';

  switch (path) {
    case 'dashboard':
      title = 'Dashboard';
      break;
    case 'add-candidates':
      title = 'Add Candidates';
      break;
    case 'candidates':
      title = subPath ? 'Candidate Details' : 'Candidates';
      break;
    case 'jobs':
      title = 'Jobs';
      break;
    case 'settings':
      title = 'Settings';
      break;
    case 'profile':
      title = 'User Profile';
      break;
    case 'hiring-agencies':
      title = 'Hiring Agencies';
      break;
    case 'login':
      title = 'Login';
      break;
    case 'register':
      title = 'Register';
      break;
    default:
      title = localStorage.getItem('authToken') ? 'Dashboard' : 'Login';
      break;
  }
  return title;
};


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [headerTitle, setHeaderTitle] = useState(getInitialHeaderTitle());

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (document.body.getAttribute('data-theme') !== savedTheme) {
      document.body.setAttribute('data-theme', savedTheme);
    }
  }, []);

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
    const token = localStorage.getItem('authToken');
    const isLoggedInState = !!token;

    if (isLoggedIn !== isLoggedInState) {
      setIsLoggedIn(isLoggedInState);
    }

    const currentPath = location.pathname;

    if (isLoggedInState) {
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      if (currentPath !== '/login' && currentPath !== '/register' && !currentPath.startsWith('/candidates/')) {
        navigate('/login', { replace: true });
      }
    }
  }, [location.pathname, navigate, isLoggedIn]);

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const path = pathParts[1];
    const subPath = pathParts[2];
    let title = 'Dashboard';

    switch (path) {
      case 'dashboard':
        title = 'Dashboard';
        break;
      case 'add-candidates':
        title = 'Add Candidates';
        break;
      case 'candidates':
        title = subPath ? 'Candidate Details' : 'Candidates';
        break;
      case 'jobs':
        title = 'Jobs';
        break;
      case 'settings':
        title = 'Settings';
        break;
      case 'profile':
        title = 'User Profile';
        break;
      case 'hiring-agencies':
        title = 'Hiring Agencies';
        break;
      case 'login':
        title = 'Login';
        break;
      case 'register':
        title = 'Register';
        break;
      default:
        title = isLoggedIn ? 'Dashboard' : 'Login';
        break;
    }
    setHeaderTitle(title);
  }, [location.pathname, isLoggedIn]);

  const updateHeaderTitle = (newTitle) => {
    setHeaderTitle(newTitle);
  };

  const handleToggleSidebar = () => {
    setIsSidebarExpanded((prev) => !prev);
  };

  const handleMobileSidebarToggle = () => {
    setSidebarMobileOpen((prev) => !prev);
  };

  const handleSidebarMenuItemClick = () => {
    if (isMobile) {
      setSidebarMobileOpen(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    window.location.reload();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
    window.location.reload();
  };

  const handleProfileMenuItemClick = (item) => {
    if (item === 'logout') {
      handleLogout();
    } else {
      navigate(`/${item}`);
    }
  };

  return (
    isLoggedIn ? (
      <div className={`app-container ${isSidebarExpanded ? 'expanded' : ''} ${sidebarMobileOpen ? 'sidebar-mobile-open' : ''}`}>
        {isMobile && sidebarMobileOpen && <div className="sidebar-mobile-overlay" onClick={handleMobileSidebarToggle}></div>}
        <SideBar
          isExpanded={isSidebarExpanded}
          onToggleSidebar={handleToggleSidebar}
          isMobile={isMobile}
          onMenuItemClick={handleSidebarMenuItemClick}
        />
        <div className="main-content">
          <Header
            headerTitle={headerTitle}
            searchTerm={useSelector((state) => state.search.searchTerm)}
            onSearchChange={(term) => dispatch(setSearchTerm(term))}
            onToggleSidebar={handleToggleSidebar}
            isMobile={isMobile}
            onMobileSidebarToggle={handleMobileSidebarToggle}
            onLogout={handleLogout}
            onProfileMenuItemClick={handleProfileMenuItemClick}
          />
          <div className="content-area">
            <Routes key={isLoggedIn ? "logged-in" : "logged-out"}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-candidates" element={<AddCandidates />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/candidates/:id" element={<CandidateDetails onTitleChange={updateHeaderTitle} />} /> {/* Use new component */}
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/settings" element={<Settings onTitleChange={updateHeaderTitle} />} />
              <Route path="/profile" element={<Profile onTitleChange={updateHeaderTitle} />} />
              <Route path="/hiring-agencies" element={<HiringAgencies />} />
            </Routes>
          </div>
        </div>
      </div>
    ) : (
      <Routes key={isLoggedIn ? "logged-in" : "logged-out"}>
        <Route path="/" element={<Login onLogin={handleLoginSuccess} autoFocusEmail={true} />} />
        <Route path="/login" element={<Login onLogin={handleLoginSuccess} autoFocusEmail={true} />} />
        <Route path="/register" element={<Register autoFocusUsername={true} />} />
        <Route path="*" element={<Login onLogin={handleLoginSuccess} autoFocusEmail={true} />} />
      </Routes>
    )
  );
}

export default App;
