// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Import useSelector and useDispatch
import './Dashboard.css';
import { fetchDashboardData } from '../redux/slices/dashboardSlice'; // Import the async thunk
import { baseURL } from '../data';
import { isAuthenticated } from '../utils/authUtils';
import DataTable from './common/DataTable';
import LoadingSpinner from './common/LoadingSpinner';

// Reusable BarChart Component (custom implementation)
const BarChart = ({ data, title, xLabel, yLabel, tooltipLabelPrefix, dataKey }) => {
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
              key={item[dataKey]}
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
          <span key={item[dataKey]} className="x-axis-label">{item[dataKey]}</span>
        ))}
      </div>
      <div className="x-x-axis-title">{xLabel}</div>
    </div>
  );
};


const Dashboard = () => {
  const dispatch = useDispatch();
  const dashboardData = useSelector((state) => state.dashboard.dashboardData);
  const loading = useSelector((state) => state.dashboard.status === 'loading');
  const error = useSelector((state) => state.dashboard.error);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Only fetch dashboard data if user is properly authenticated
    const authenticated = isAuthenticated();
    
    console.log('Dashboard useEffect - User authenticated:', authenticated);
    
    if (authenticated && dashboardData === null && !loading && !error) {
      console.log('Dashboard - Fetching dashboard data');
      dispatch(fetchDashboardData());
    } else if (!authenticated) {
      console.log('Dashboard - No valid authentication, skipping dashboard data fetch');
    }
  }, [dispatch, dashboardData, loading, error]); // Dependencies to re-run effect

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  if (!dashboardData && loading) {
     return (
      <div className="dashboard-container is-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="error-container">No dashboard data available.</div>;
  }

  const allRecentActivities = [
    ...(dashboardData?.resume_stats?.recent_uploads || []).map(item => ({
      id: item.id,
      name: item.file.split('/').pop(),
      detail: `Resume uploaded: ${item.file}`,
      date: new Date(item.uploaded_at).toLocaleDateString(),
      type: 'resume_upload',
      timestamp: new Date(item.uploaded_at).getTime(),
    })),
    ...(dashboardData?.candidate_stats?.recent_candidates || []).map(item => ({
      id: item.id,
      name: item.full_name || 'N/A',
      detail: `Candidate added in ${item.domain} domain with status ${item.status}`,
      date: new Date(item.created_at).toLocaleDateString(),
      type: 'new_candidate',
      timestamp: new Date(item.created_at).getTime(),
    })),
    ...(dashboardData?.job_stats?.recent_jobs || []).map(item => ({
      id: item.id,
      name: item.job_title,
      detail: `New job posted at ${item.company_name} (${item.position_level})`,
      date: new Date(item.created_at).toLocaleDateString(),
      type: 'job_posted',
      timestamp: new Date(item.created_at).getTime(),
    })),
    ...(dashboardData?.activity_data?.recent_activities || []).map(item => ({
       id: item.id,
       name: item.name,
       detail: item.detail,
       date: new Date(item.date).toLocaleDateString(),
       type: item.type,
       timestamp: new Date(item.date).getTime(),
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const indexOfLastActivity = currentPage * itemsPerPage;
  const indexOfFirstActivity = indexOfLastActivity - itemsPerPage;
  const currentActivities = allRecentActivities.slice(indexOfFirstActivity, indexOfLastActivity);
  const totalPages = Math.ceil(allRecentActivities.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className={`dashboard-container ${loading ? 'is-loading' : ''}`}>
      <main className="dashboard-main-content">
        <section className="dashboard-section card-section">
          <div className="dashboard-cards-container">
            <div className="dashboard-card">
              <h3>Total Resumes Uploaded</h3>
              <p>{dashboardData.resume_stats.total_uploads}</p>
            </div>
            <div className="dashboard-card">
              <h3>Total Candidates</h3>
              <p>{dashboardData.candidate_stats.total_candidates}</p>
            </div>
            <div className="dashboard-card">
              <h3>Total Jobs</h3>
              <p>{dashboardData.job_stats.total_jobs}</p>
            </div>
            <div className="dashboard-card">
              <h3>Total Interviews</h3>
              <p>{dashboardData.interview_stats.total_interviews}</p>
            </div>
          </div>
        </section>

        <section className="dashboard-section dashboard-graphs-container">
          <BarChart
            data={dashboardData.candidate_stats.domain_distribution}
            title="Candidate Domain Distribution"
            xLabel="Domain"
            yLabel="Candidates"
            tooltipLabelPrefix="Candidates"
            dataKey="domain"
          />
          {dashboardData.resume_stats.daily_trend.length > 0 && (
            <BarChart
              data={dashboardData.resume_stats.daily_trend}
              title="Resume Uploads Daily Trend"
              xLabel="Date"
              yLabel="Uploads"
              tooltipLabelPrefix="Uploads"
              dataKey="date"
            />
          )}
          {dashboardData.job_stats.level_distribution.length > 0 && (
            <BarChart
              data={dashboardData.job_stats.level_distribution}
              title="Job Level Distribution"
              xLabel="Level"
              yLabel="Jobs"
              tooltipLabelPrefix="Jobs"
              dataKey="position_level"
            />
          )}
          {dashboardData.interview_stats.daily_trend.length > 0 && (
            <BarChart
              data={dashboardData.interview_stats.daily_trend}
              title="Interview Daily Trend"
              xLabel="Date"
              yLabel="Interviews"
              tooltipLabelPrefix="Interviews"
              dataKey="date"
            />
          )}
        </section>

        <section className="dashboard-recent-activity">
          <DataTable
            title="Recent Activities"
            columns={[
              {
                field: "name",
                header: "Name/Subject",
                width: "25%",
              },
              {
                field: "detail",
                header: "Detail",
                width: "35%",
              },
              {
                field: "date",
                header: "Date",
                width: "20%",
              },
              {
                field: "type",
                header: "Category",
                width: "20%",
                render: (value) => (
                  <span className="status-cell" data-status={value?.toLowerCase()}>
                    {value.replace(/_/g, ' ')}
                  </span>
                ),
              },
            ]}
            data={allRecentActivities || []}
            loading={loading}
            actions={[]} // No actions for activities
            showRefresh={true}
            onRefresh={() => dispatch(fetchDashboardData())}
            showActions={false}
            defaultPageSize={5}
            pageSizeOptions={[5, 10, 20]}
          />
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
