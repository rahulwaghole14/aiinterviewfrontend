// src/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiMenu, FiChevronLeft, FiX } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm } from '../redux/slices/searchSlice';
import { searchService } from '../services/searchService';

const Header = ({
  headerTitle, // Changed from 'title' to 'headerTitle' to match prop name in App.jsx
  isSidebarExpanded,
  sidebarMobileOpen,
  onToggleSidebar, // For desktop sidebar expand/collapse
  isMobile,
  onLogout,
  onProfileMenuItemClick,
  onMobileSidebarToggle // New prop for mobile sidebar open/close
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for desktop search input
  const searchModalInputRef = useRef(null); // Ref for mobile search modal input

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname.split('/')[1];
    switch (path) {
      case 'candidates': return 'Candidates';
      case 'jobs': return 'Jobs';
      case 'hiring-agencies': return 'Hiring Agencies';
      case 'ai-interview-scheduler': return 'Interview Scheduler';
      case 'settings': return 'Settings';
      case 'interview-results': return 'Interviews';
      default: return null;
    }
  };
  const reduxSearchTerm = useSelector((state) => state.search?.searchTerm || ''); // Get current Redux search term
  
  // Get data from Redux stores for search
  const candidates = useSelector((state) => state.candidates?.allCandidates || []);
  const jobs = useSelector((state) => state.jobs?.allJobs || []);
  const domains = useSelector((state) => state.jobs?.domains || []);
  const hiringAgencies = useSelector((state) => state.hiringAgencies?.hiringAgencies || []);
  const companies = useSelector((state) => state.companies?.companies || []);
  const recruiters = useSelector((state) => state.recruiters?.recruiters || []);
  const interviewSlots = useSelector((state) => state.interviewSlots?.slots || []);
  const interviews = useSelector((state) => state.interviews?.interviews || []);

  // Debug data availability
  useEffect(() => {
    console.log('Search data updated:', {
      candidates: candidates.length,
      jobs: jobs.length,
      domains: domains.length,
      hiringAgencies: hiringAgencies.length,
      companies: companies.length,
      recruiters: recruiters.length,
      interviewSlots: interviewSlots.length,
      interviews: interviews.length,
    });
  }, [candidates, jobs, domains, hiringAgencies, companies, recruiters, interviewSlots, interviews]);

  // Update search service with latest data
  useEffect(() => {
    searchService.updateData('candidates', candidates);
    searchService.updateData('jobs', jobs);
    searchService.updateData('domains', domains);
    searchService.updateData('hiringAgencies', hiringAgencies);
    searchService.updateData('companies', companies);
    searchService.updateData('recruiters', recruiters);
    searchService.updateData('interviewSlots', interviewSlots);
    searchService.updateData('interviews', interviews);
  }, [candidates, jobs, domains, hiringAgencies, companies, recruiters, interviewSlots, interviews]);

  // Sync localSearchTerm with Redux searchTerm when Redux searchTerm changes
  useEffect(() => {
    setLocalSearchTerm(reduxSearchTerm);
  }, [reduxSearchTerm]);


  // Effect to clear search dropdown when clicking outside search input/modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close profile menu if clicked outside
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      // If clicked outside the search input, remove only suggestions
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        !isSearchModalOpen // Only clear if modal is not open
      ) {
        setSearchResults([]); // Only clear suggestions, keep search term
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchModalOpen]); // Added isSearchModalOpen to dependency array


  const handleSearch = async (e) => {
    const term = e.target.value;
    setLocalSearchTerm(term);
    dispatch(setSearchTerm(term)); // Update Redux search term immediately

    if (term && term.length >= 2) {
      setIsSearching(true);
      
      try {
        // Always fetch fresh data for search
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
          console.log('Fetching fresh data for search...');
          // Force fetch all data types for comprehensive search
          const dataTypes = ['candidates', 'jobs', 'domains', 'hiringAgencies', 'companies', 'recruiters', 'interviewSlots', 'interviews'];
          
          try {
            const fetchPromises = dataTypes.map(async (type) => {
              console.log(`Fetching ${type}...`);
              return await searchService.fetchDataIfNeeded(type, authToken, true); // Force refresh
            });
            
            // Wait for all fetch operations to complete
            await Promise.all(fetchPromises);
            console.log('All data fetching complete');
          } catch (fetchError) {
            console.error('Error fetching search data:', fetchError);
          }
        }
        
        // Use search service for comprehensive search
        const currentTab = getCurrentTab();
        const allResults = searchService.search(term, { limit: 20 }); // Get more results to show both similar ones
        
        // Sort results: current tab first, then by relevance
        const sortedResults = allResults.sort((a, b) => {
          // Current tab results first
          if (a.type === currentTab && b.type !== currentTab) return -1;
          if (b.type === currentTab && a.type !== currentTab) return 1;
          
          // Then by relevance
          return b.relevance - a.relevance;
        });
        
        console.log('Current tab:', currentTab);
        console.log('All search results (showing both similar):', sortedResults.map(r => ({ title: r.title, type: r.type })));
        
        setSearchResults(sortedResults.slice(0, 10));
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleProfileMenuOptionClick = (path) => {
    setIsProfileMenuOpen(false);
    if (path === 'logout') {
      onLogout();
      // navigate('/login'); // Handled by onLogout prop
    } else {
      onProfileMenuItemClick(path);
    }
  };

  const toggleSearchModal = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
    // When opening the modal, set localSearchTerm to the current Redux searchTerm
    if (!isSearchModalOpen) { // If modal is about to open
      setLocalSearchTerm(reduxSearchTerm);
      // Focus the input when modal opens
      setTimeout(() => {
        searchModalInputRef.current?.focus();
      }, 0);
    } else { // If modal is about to close
      // Only clear local state, keep Redux search term for component filtering
      setLocalSearchTerm('');
      setSearchResults([]);
      // Don't clear Redux search term - let components handle their own search state
    }
  };

  const handleSearchResultClick = (result) => {
    console.log('Search result clicked:', result);
    console.log('Navigating to:', result.detailPath && result.type === 'Candidates' ? result.detailPath : result.path);
    
    // Keep the original search term for component sorting, don't change it to result title
    // setLocalSearchTerm(result.title);        // Don't change local search term
    // dispatch(setSearchTerm(result.title));   // Don't change Redux search term
    
    // Navigate to the appropriate component
    if (result.detailPath && result.type === 'Candidates') {
      navigate(result.detailPath);     // Navigate to specific candidate details
    } else {
      navigate(result.path);           // Navigate to the component
    }
    
    setIsSearchModalOpen(false);             // Close modal (for mobile)
    setSearchResults([]);                    // Clear suggestions
    
    // Store the selected result for highlighting in the target component
    localStorage.setItem('searchHighlight', JSON.stringify({
      type: result.type,
      id: result.id,
      query: localSearchTerm,  // Use the original search term, not result title
      tab: result.tab || null,
    }));
  };

  // Handle Enter key to trigger search
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && localSearchTerm && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    }
  };

  // Add clear icon handler
  const handleClearSearch = () => {
    setLocalSearchTerm('');
    setSearchResults([]);
    dispatch(setSearchTerm(''));
    // Focus the input after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (searchModalInputRef.current) {
      searchModalInputRef.focus();
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        <div
          className="sidebar-toggle"
          // Conditional onClick: use onMobileSidebarToggle for mobile, onToggleSidebar for desktop
          onClick={isMobile ? onMobileSidebarToggle : onToggleSidebar}
          title={isMobile
            ? sidebarMobileOpen ? 'Close sidebar' : 'Open sidebar'
            : isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isMobile
            ? (sidebarMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />)
            : (isSidebarExpanded ? <FiChevronLeft size={20} /> : <FiMenu size={20} />)
          }
        </div>
        <h1 className="header-title">{headerTitle || 'Dashboard'}</h1> {/* Use headerTitle prop */}
      </div>

      <div className="header-right">
        {isMobile ? (
          <FiSearch className="search-icon mobile-search-icon" onClick={toggleSearchModal} size={20} />
        ) : (
          <div className="header-search" ref={searchInputRef}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={localSearchTerm}
              onChange={handleSearch}
              onKeyDown={handleSearchKeyDown}
            />
            {localSearchTerm && (
              <FiX
                className="clear-search-icon"
                size={18}
                style={{ cursor: 'pointer', marginLeft: '4px', color: '#aaa' }}
                onClick={handleClearSearch}
                title="Clear search"
              />
            )}
            {localSearchTerm && (isSearching || searchResults.length > 0) && (
              <div className="search-dropdown">
                {isSearching ? (
                  <div className="search-result-item search-loading">
                    <div className="search-result-content">
                      <div className="search-result-title">
                        Searching...
                      </div>
                      <div className="search-result-subtitle">
                        Fetching data from all components
                      </div>
                    </div>
                  </div>
                ) : (
                  searchResults.map((result, index) => (
                    <div 
                      key={`${result.type}-${result.id}`} 
                      className="search-result-item"
                      onClick={() => handleSearchResultClick(result)}
                    >
                      <div className="search-result-content">
                        <div className="search-result-title">
                          {result.title}
                          <span className="search-result-type">{result.type}</span>
                        </div>
                        {result.subtitle && (
                          <div className="search-result-subtitle">{result.subtitle}</div>
                        )}
                        {result.description && (
                          <div className="search-result-description">{result.description}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {isSearchModalOpen && (
          <div className="search-modal-overlay" onClick={toggleSearchModal}>
            <div className="search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="search-modal-header">
                <input
                  type="text"
                  placeholder="Search..."
                  value={localSearchTerm}
                  onChange={handleSearch}
                  autoFocus
                  ref={searchModalInputRef}
                />
                <FiX size={24} onClick={toggleSearchModal} className="close-search-modal" />
              </div>
              {localSearchTerm && (isSearching || searchResults.length > 0) && (
                <div className="search-modal-results">
                  {isSearching ? (
                    <div className="search-result-item search-loading">
                      <div className="search-result-content">
                        <div className="search-result-title">
                          Searching...
                        </div>
                        <div className="search-result-subtitle">
                          Fetching data from all components
                        </div>
                      </div>
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <div 
                        key={`${result.type}-${result.id}`} 
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(result)}
                      >
                        <div className="search-result-content">
                          <div className="search-result-title">
                            {result.title}
                            <span className="search-result-type">{result.type}</span>
                          </div>
                          {result.subtitle && (
                            <div className="search-result-subtitle">{result.subtitle}</div>
                          )}
                          {result.description && (
                            <div className="search-result-description">{result.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {localSearchTerm && !isSearching && searchResults.length === 0 && (
                <p className="no-results">No results found for "{localSearchTerm}"</p>
              )}
              {!localSearchTerm && (
                  <p className="no-results">Start typing to search...</p>
              )}
            </div>
          </div>
        )}

        <div className="header-profile-wrapper" ref={profileMenuRef}>
          <div className="header-profile" onClick={handleProfileClick} title="Profile">
            <FiUser size={20} />
          </div>
          {isProfileMenuOpen && (
            <div className="profile-context-menu">
              <div className="menu-item" onClick={() => handleProfileMenuOptionClick('profile')}>View Profile</div>
              <div className="menu-item logout" onClick={() => handleProfileMenuOptionClick('logout')}>Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
