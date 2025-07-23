// src/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiUser, FiMenu, FiChevronLeft, FiX } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchTerm } from '../redux/actions/searchActions';
import { searchableItems } from '../data';

const Header = ({
  title,
  isSidebarExpanded,
  sidebarMobileOpen, // <-- Add this prop
  onToggleSidebar,
  isMobile,
  onLogout,
  onProfileMenuItemClick
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const searchInputRef = useRef(null); // Ref for desktop search input
  const searchModalInputRef = useRef(null); // Ref for mobile search modal input

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const reduxSearchTerm = useSelector((state) => state.search.searchTerm); // Get current Redux search term

  // Sync localSearchTerm with Redux searchTerm when Redux searchTerm changes
  // This ensures that if a search is active (e.g., from a search result click),
  // the search input box reflects that search term.
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
        !searchInputRef.current.contains(event.target)
      ) {
        setSearchResults([]); // Only clear suggestions, keep search term
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setLocalSearchTerm(term);
    dispatch(setSearchTerm(term));
    if (term) {
      const filtered = searchableItems.filter(
        (item) =>
          item.name.toLowerCase().includes(term.toLowerCase()) &&
          !item.isTab // Exclude tab options from suggestions
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleProfileMenuOptionClick = (path) => {
    setIsProfileMenuOpen(false);
    if (path === 'logout') {
      onLogout();
      navigate('/login');
    } else {
      onProfileMenuItemClick(path);
    }
  };

  const toggleSearchModal = () => {
    setIsSearchModalOpen(!isSearchModalOpen);
    // When opening the modal, set localSearchTerm to the current Redux searchTerm
    // When closing, clear local state and Redux search term
    if (!isSearchModalOpen) { // If modal is about to open
      setLocalSearchTerm(reduxSearchTerm);
    } else { // If modal is about to close
      setLocalSearchTerm('');
      setSearchResults([]);
      dispatch(setSearchTerm('')); // Clear Redux search term here
    }
  };

  const handleSearchResultClick = (item) => {
    setLocalSearchTerm(item.name);           // Update local search box
    dispatch(setSearchTerm(item.name));      // Update Redux search term
    navigate(`/${item.path}`);
    setIsSearchModalOpen(false);             // Close modal (for mobile)
    setSearchResults([]);                    // Only clear dropdown results
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
  };

  return (
    <div className="header">
      <div className="header-left">
        <div
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          title={isMobile
            ? sidebarMobileOpen ? 'Close sidebar' : 'Open sidebar'
            : isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isMobile
            ? (sidebarMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />)
            : (isSidebarExpanded ? <FiChevronLeft size={20} /> : <FiMenu size={20} />)
          }
        </div>
        <h1 className="header-title">{title || 'Dashboard'}</h1>
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
            {localSearchTerm && searchResults.length > 0 && (
              <ul className="search-dropdown">
                {searchResults.map((item, index) => (
                  <li key={index} onClick={() => handleSearchResultClick(item)}>{item.name}</li>
                ))}
              </ul>
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
                  value={localSearchTerm} // Keep the text here
                  onChange={handleSearch}
                  autoFocus
                  ref={searchModalInputRef} // Attach ref here
                />
                <FiX size={24} onClick={toggleSearchModal} className="close-search-modal" />
              </div>
              {localSearchTerm && searchResults.length > 0 && (
                <ul className="search-modal-results">
                  {searchResults.map((item, index) => (
                    <li key={index} onClick={() => handleSearchResultClick(item)}>{item.name}</li>
                  ))}
                </ul>
              )}
              {localSearchTerm && searchResults.length === 0 && (
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
              <div className="menu-item" onClick={() => handleProfileMenuOptionClick('/profile')}>View Profile</div>
              <div className="menu-item logout" onClick={() => handleProfileMenuOptionClick('logout')}>Logout</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
