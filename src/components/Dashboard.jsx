// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import './Dashboard.css'; // Assuming you have or will create Dashboard.css

// Dummy Data for Dashboard (replace with actual data from Redux/API)
const dashboardData = {
  totalHiringAgencies: 15,
  totalCandidates: 1250,
  totalInterviews: 320,
  totalJobs: 75, // Added Total Jobs
  
  candidatesHiredPerYear: [
    { year: 2020, count: 80 },
    { year: 2021, count: 120 },
    { year: 2022, count: 150 },
    { year: 2023, count: 180 },
    { year: 2024, count: 220 },
  ],
  agenciesIncreasedPerYear: [
    { year: 2020, count: 2 },
    { year: 2021, count: 3 },
    { year: 2022, count: 5 },
    { year: 2023, count: 4 },
    { year: 2024, count: 6 },
  ],
  jobsIncreasedPerYear: [
    { year: 2020, count: 15 },
    { year: 2021, count: 25 },
    { year: 2022, count: 30 },
    { year: 2023, count: 28 },
    { year: 2024, count: 35 },
  ],

  recentActivities: [
    { id: 'act1', type: 'candidate_added', name: 'Alice Johnson', date: '2024-07-23', detail: 'New candidate added for Senior Developer' },
    { id: 'act2', type: 'agency_added', name: 'Talent Scout LLC', date: '2024-07-22', detail: 'New hiring agency partnered' },
    { id: 'act3', type: 'interview_scheduled', name: 'Bob Williams', date: '2024-07-21', detail: 'Interview scheduled for Marketing Manager' },
    { id: 'act4', type: 'candidate_hired', name: 'Charlie Davis', date: '2024-07-20', detail: 'Hired for UI/UX Designer position' },
    { id: 'act5', type: 'job_posted', name: 'Senior Data Scientist', date: '2024-07-19', detail: 'New job opening posted' },
    { id: 'act6', type: 'interview_completed', name: 'Diana Miller', date: '2024-07-18', detail: 'Final interview completed' },
    { id: 'act7', type: 'agency_removed', name: 'Old Staffing Co.', date: '2024-07-17', detail: 'Hiring agency partnership ended' },
    { id: 'act8', type: 'candidate_added', name: 'Eve White', date: '2024-07-16', detail: 'New candidate added for Project Lead' },
    { id: 'act9', type: 'job_closed', name: 'Junior QA Engineer', date: '2024-07-15', detail: 'Job opening closed' },
    { id: 'act10', type: 'interview_scheduled', name: 'Frank Black', date: '2024-07-14', detail: 'Round 1 interview scheduled for Backend Dev' },
    { id: 'act11', type: 'candidate_hired', name: 'Grace Green', date: '2024-07-13', detail: 'Hired for Cloud Engineer role' },
    { id: 'act12', type: 'agency_added', name: 'Elite Recruiters', date: '2024-07-12', detail: 'New agency added' },
  ],
};

// Reusable BarChart Component
const BarChart = ({ data, title, xLabel, yLabel, tooltipLabelPrefix }) => {
  if (!data || data.length === 0) {
    return <div className="chart-container no-data">No data available for {title}.</div>;
  }

  const maxCount = Math.max(...data.map(item => item.count));
  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div className="chart-container card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-bars-wrapper">
        <div className="y-axis-label">{yLabel}</div>
        <div className="chart-bars">
          {data.map((item, index) => (
            <div
              key={item.year}
              className="chart-bar"
              style={{ height: `${(item.count / maxCount) * 100}%` }}
              onMouseEnter={() => setHoveredBar({ ...item, index })}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {hoveredBar && hoveredBar.index === index && (
                <div className="chart-tooltip">
                  {tooltipLabelPrefix}: {item.count}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="chart-x-axis">
        {data.map(item => (
          <span key={item.year} className="x-axis-label">{item.year}</span>
        ))}
      </div>
      <div className="x-axis-title">{xLabel}</div>
    </div>
  );
};


const Dashboard = () => {
  useEffect(() => {
    // This effect runs when the component mounts
    // You can fetch data here if needed
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Display 5 items per page for recent activities

  // Calculate items for the current page
  const indexOfLastActivity = currentPage * itemsPerPage;
  const indexOfFirstActivity = indexOfLastActivity - itemsPerPage;
  const currentActivities = dashboardData.recentActivities.slice(indexOfFirstActivity, indexOfLastActivity);

  // Calculate total pages
  const totalPages = Math.ceil(dashboardData.recentActivities.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="dashboard-container">
      {/* Top Cards Section */}
      <div className="dashboard-cards-container">
        <div className="dashboard-card card">
          <h3>Total Hiring Agencies</h3>
          <p>{dashboardData.totalHiringAgencies}</p>
        </div>
        <div className="dashboard-card card">
          <h3>Total Candidates</h3>
          <p>{dashboardData.totalCandidates}</p>
        </div>
        <div className="dashboard-card card">
          <h3>Total Interviews</h3>
          <p>{dashboardData.totalInterviews}</p>
        </div>
        <div className="dashboard-card card"> {/* New card for Total Jobs */}
          <h3>Total Jobs</h3>
          <p>{dashboardData.totalJobs}</p>
        </div>
      </div>

      {/* Graphs Section */}
      <div className="dashboard-graphs-container">
        <BarChart
          data={dashboardData.candidatesHiredPerYear}
          title="Candidates Hired Per Year"
          xLabel="Year"
          yLabel="Candidates"
          tooltipLabelPrefix="Hired"
        />
        <BarChart
          data={dashboardData.agenciesIncreasedPerYear}
          title="Hiring Agencies Growth Per Year"
          xLabel="Year"
          yLabel="Agencies Added"
          tooltipLabelPrefix="Agencies"
        />
        <BarChart
          data={dashboardData.jobsIncreasedPerYear}
          title="Jobs Posted Per Year"
          xLabel="Year"
          yLabel="Jobs"
          tooltipLabelPrefix="Jobs"
        />
      </div>

      {/* Recent Activity Table */}
      <div className="dashboard-recent-activity card">
        <h3 className="table-title">New Candidates, Hiring Agencies, and Latest Updates</h3>
        <div className="table-responsive">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Name/Subject</th>
                <th>Detail</th>
                <th>Date</th>
                <th>Category</th> {/* Changed from Type to Category */}
              </tr>
            </thead>
            <tbody>
              {currentActivities.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-results">No recent activities.</td>
                </tr>
              ) : (
                currentActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.name}</td>
                    <td>{activity.detail}</td>
                    <td>{activity.date}</td>
                    <td>
                      <span className={`activity-type-badge ${activity.type}`}>
                        {activity.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
