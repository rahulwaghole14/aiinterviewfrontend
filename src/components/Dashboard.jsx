import React, { useState } from 'react'; // Import useState for sorting
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useSelector } from 'react-redux'; // Import useSelector
import './Dashboard.css'; // Corrected path
import { dashboardTopCards, dashboardSalesData, dashboardUsersData } from '../data'; // Import data (dashboardClientsData will now come from Redux)

const Dashboard = () => {
  const searchTerm = useSelector((state) => state.search.searchTerm); // Get search term from Redux
  const allClients = useSelector((state) => state.clients.allClients); // Get all clients from Redux

  // State for sorting clients table
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

  const handleClientClick = (name) => {
    console.log(`Client clicked: ${name}`);
  };

  // Handle sorting logic for clients table
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  // Filter and sort clients data based on search term and sort state
  const filteredClientsData = allClients.filter(client => { // Use allClients from Redux
    if (!searchTerm) {
      return true; // If no search term, show all clients
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.email.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.status.toLowerCase().includes(lowerCaseSearchTerm) ||
      client.plan.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }).sort((a, b) => { // Apply sorting after filtering
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    // For numbers (like IDs, though not in this table, good for general sorting)
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="dashboard-container">
      {/* Top cards - reverted to original big card style */}
      <div className="top-cards">
        {dashboardTopCards.map((card, index) => ( // Use imported data
          <div key={index} className="dashboard-card" onClick={() => console.log(`${card.subtitle} clicked`)}>
            <h2>{card.title}</h2>
            <p>{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Middle grid */}
      <div className="middle-grid">
        <div className="overview-card">
          <h3>Sales Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardSalesData}> {/* Use imported data */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#4ade80"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overview-card">
          <h3>Active Users</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardUsersData}> {/* Use imported data */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#60a5fa"
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
                isAnimationActive
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="announcement-card">
          <h3>Announcement</h3>
          <div className="announcement">
            <button>▶</button>
            <span>Treare reserves learning</span>
          </div>
          <div className="announcement">
            <button>⚠️</button>
            <span>Stangte le taming lion</span>
          </div>
        </div>
      </div>

      {/* Clients table - showing all records */}
      {/* Only show the table if there is no search term, or if there are filtered results */}
      <div className="clients-table">
        <h3>Clients</h3>
        <div className="clients-table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
                <th onClick={() => handleSort('email')}>Email {getSortIndicator('email')}</th>
                <th onClick={() => handleSort('status')}>Status {getSortIndicator('status')}</th>
                <th onClick={() => handleSort('plan')}>Plan {getSortIndicator('plan')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientsData.length > 0 ? ( // Use filtered data
                filteredClientsData.map((client, index) => (
                  <tr
                    key={index}
                    onClick={() => handleClientClick(client.name)}
                    className="client-row"
                  >
                    <td>{client.name}</td>
                    <td>{client.email}</td>
                    <td>
                      <span className={`status-badge ${client.status.toLowerCase()}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>{client.plan}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-results">No clients found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
