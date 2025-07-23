import { createContext } from 'react';

// Create the SearchContext. It will provide the searchTerm and setSearchTerm function.
export const SearchContext = createContext({
  searchTerm: '',
  setSearchTerm: () => {},
});