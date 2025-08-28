// App.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm } from './redux/actions/searchActions';
import { setUser, clearUser } from './redux/slices/userSlice'; // Import setUser and clearUser

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
import AiInterviewScheduler from './components/AiInterviewScheduler'; // Import the new AiInterviewScheduler component
import InterviewPortal from './components/InterviewPortal'; // Import the new InterviewPortal component
import InterviewResults from './components/InterviewResults'; // Import the new InterviewResults component
import InterviewResultsList from './components/InterviewResultsList'; // Import the new InterviewResultsList component
import DataListing from './components/DataListing'; // Import the new DataListing component
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
          case 'ai-interview-scheduler':
        title = 'Talaro Interview Manager';
        break;
      case 'interview-results':
        title = 'Interview Results';
        break;
      case 'data-listing':
        title = 'Interview Data Dashboard';
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
  
  // Add the user selector
  const user = useSelector((state) => state.user.user);

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [headerTitle, setHeaderTitle] = useState(getInitialHeaderTitle());

  // Effect to initialize Redux user state from localStorage on app load
  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        dispatch(setUser(user));
        // Ensure isLoggedIn state is consistent with localStorage
        if (!isLoggedIn) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage:", error);
        // Clear invalid data and log out if parsing fails
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        dispatch(clearUser());
        setIsLoggedIn(false);
        navigate('/login');
      }
    } else {
      // If no user data, ensure Redux state is cleared
      dispatch(clearUser());
    }
  }, [dispatch, isLoggedIn, navigate]); // Added isLoggedIn and navigate to dependencies

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
      // Only redirect to dashboard if user is on login/register pages or root
      if (currentPath === '/' || currentPath === '/login' || currentPath === '/register') {
        navigate('/dashboard', { replace: true });
      }
      // For all other authenticated routes (including /ai-interview-scheduler), stay on current page
    } else {
      // If not logged in, redirect to login unless already on login/register or public candidate pages
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
        title = 'All Users';
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
    // User data is already set in localStorage and dispatched to Redux by Login.jsx
    navigate('/dashboard'); // Navigate to dashboard
    window.location.reload(); // Force a full page reload after navigation
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    dispatch(clearUser()); // Clear user from Redux state on logout
    navigate('/login'); // Navigate to login page
    window.location.reload(); // Force a full page reload after navigation
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
              <Route 
                path="/ai-interview-scheduler" 
                element={<AiInterviewScheduler onTitleChange={updateHeaderTitle} />} 
              />
              <Route 
                path="/interview/:sessionKey" 
                element={<InterviewPortal />} 
              />
              <Route 
                path="/interview-results" 
                element={<InterviewResultsList />} 
              />
              <Route 
                path="/interview-results/:sessionId" 
                element={<InterviewResults />} 
              />
              <Route 
                path="/data-listing" 
                element={<DataListing />} 
              />
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
