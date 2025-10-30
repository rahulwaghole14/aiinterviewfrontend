// Analytics.jsx
import React, { useState, useEffect } from "react";
import { baseURL } from "../data";
import { useNotification } from "../hooks/useNotification";
import BeatLoader from "react-spinners/BeatLoader";
import jsPDF from "jspdf";
import "./Analytics.css";

const Analytics = () => {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);

  // Get auth token from localStorage when component mounts
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setAuthToken(token);
    } else {
      notify.error("Authentication token not found. Please log in again.");
    }
  }, [notify]);

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/dashboard/analytics/summary/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      notify.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchAnalyticsData();
    }
  }, [authToken]);

  // Common headers for API calls
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Token ${authToken}`,
  });

  // Export to CSV
  const exportToCSV = () => {
    if (!analyticsData) {
      notify.error("No data to export");
      return;
    }

    try {
      // Create CSV content
      let csvContent = "Analytics Report\n\n";
      
      // Summary data
      csvContent += "Summary\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Candidates,${analyticsData.total_candidates}\n`;
      csvContent += `Total Interviews,${analyticsData.total_interviews}\n`;
      csvContent += `Hired Candidates,${analyticsData.hired_candidates}\n`;
      csvContent += `Rejected Candidates,${analyticsData.rejected_candidates}\n\n`;
      
      // Top 5 Agencies
      if (analyticsData.top_5_agencies && analyticsData.top_5_agencies.length > 0) {
        csvContent += "Top 5 Hiring Agencies\n";
        csvContent += "Rank,Agency Name,Recruiter,Profiles Uploaded,Selected,Rejected,Selection Rate\n";
        analyticsData.top_5_agencies.forEach((agency, index) => {
          csvContent += `${index + 1},"${agency.agency_name}","${agency.recruiter_name}",${agency.uploaded_profiles},${agency.selected_profiles},${agency.rejected_profiles},${agency.selection_rate.toFixed(1)}%\n`;
        });
        csvContent += "\n";
      }
      
      // All Agencies
      if (analyticsData.all_agencies && analyticsData.all_agencies.length > 0) {
        csvContent += "All Hiring Agency Statistics\n";
        csvContent += "Agency Name,Recruiter,Profiles Uploaded,Selected,Rejected,Interviews Scheduled,Interviews Selected,Interviews Rejected,Selection Rate\n";
        analyticsData.all_agencies.forEach(agency => {
          csvContent += `"${agency.agency_name}","${agency.recruiter_name}",${agency.uploaded_profiles},${agency.selected_profiles},${agency.rejected_profiles},${agency.interviews_scheduled},${agency.interviews_selected},${agency.interviews_rejected},${agency.selection_rate.toFixed(1)}%\n`;
        });
      }
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      notify.success("CSV file downloaded successfully");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      notify.error("Failed to export CSV");
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!analyticsData) {
      notify.error("No data to export");
      return;
    }

    try {
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.text("Analytics Report", 20, yPos);
      yPos += 10;

      // Date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 15;

      // Summary Section
      doc.setFontSize(14);
      doc.text("Summary", 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Total Candidates: ${analyticsData.total_candidates}`, 30, yPos);
      yPos += 7;
      doc.text(`Total Interviews: ${analyticsData.total_interviews}`, 30, yPos);
      yPos += 7;
      doc.text(`Hired Candidates: ${analyticsData.hired_candidates}`, 30, yPos);
      yPos += 7;
      doc.text(`Rejected Candidates: ${analyticsData.rejected_candidates}`, 30, yPos);
      yPos += 15;

      // Top 5 Agencies Section
      if (analyticsData.top_5_agencies && analyticsData.top_5_agencies.length > 0) {
        doc.setFontSize(14);
        doc.text("Top 5 Hiring Agencies", 20, yPos);
        yPos += 10;

        doc.setFontSize(9);
        let tableData = analyticsData.top_5_agencies.map((agency, index) => [
          index + 1,
          agency.agency_name.substring(0, 25),
          agency.uploaded_profiles,
          agency.selected_profiles,
          agency.rejected_profiles,
          `${agency.selection_rate.toFixed(1)}%`
        ]);

        // Simple table
        const startX = 20;
        doc.text("Rank", startX, yPos);
        doc.text("Agency Name", startX + 15, yPos);
        doc.text("Uploaded", startX + 60, yPos);
        doc.text("Selected", startX + 80, yPos);
        doc.text("Rejected", startX + 100, yPos);
        doc.text("Rate", startX + 120, yPos);
        yPos += 7;

        doc.setFontSize(8);
        tableData.forEach(row => {
          doc.text(row[0].toString(), startX, yPos);
          doc.text(row[1], startX + 15, yPos);
          doc.text(row[2].toString(), startX + 60, yPos);
          doc.text(row[3].toString(), startX + 80, yPos);
          doc.text(row[4].toString(), startX + 100, yPos);
          doc.text(row[5], startX + 120, yPos);
          yPos += 6;
        });

        yPos += 10;
      }

      // Add new page if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // All Agencies Section
      if (analyticsData.all_agencies && analyticsData.all_agencies.length > 0) {
        doc.setFontSize(14);
        doc.text("All Hiring Agency Statistics", 20, yPos);
        yPos += 10;

        doc.setFontSize(8);
        let agencyIndex = 0;
        analyticsData.all_agencies.forEach((agency) => {
          if (yPos > 260) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(10);
          doc.text(agency.agency_name, 20, yPos);
          yPos += 7;

          doc.setFontSize(9);
          doc.text(`  Recruiter: ${agency.recruiter_name}`, 25, yPos);
          yPos += 6;
          doc.text(`  Profiles Uploaded: ${agency.uploaded_profiles}`, 25, yPos);
          yPos += 6;
          doc.text(`  Selected: ${agency.selected_profiles} | Rejected: ${agency.rejected_profiles}`, 25, yPos);
          yPos += 6;
          doc.text(`  Interviews: ${agency.interviews_scheduled} scheduled, ${agency.interviews_selected} selected, ${agency.interviews_rejected} rejected`, 25, yPos);
          yPos += 6;
          doc.text(`  Selection Rate: ${agency.selection_rate.toFixed(1)}%`, 25, yPos);
          yPos += 10;

          agencyIndex++;
        });
      }

      // Save the PDF
      doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
      notify.success("PDF file downloaded successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      notify.error("Failed to export PDF");
    }
  };

  if (loading) {
    return (
      <div className="analytics-container loading-container">
        <BeatLoader color="var(--color-primary-dark)" />
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">
          <p>No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-actions">
          <button 
            className="btn btn-export-pdf" 
            onClick={exportToPDF}
          >
            Export PDF
          </button>
          <button 
            className="btn btn-export-csv" 
            onClick={exportToCSV}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Candidates</h3>
            <p className="summary-value">{analyticsData.total_candidates || 0}</p>
          </div>
          <div className="summary-card">
            <h3>Total Interviews</h3>
            <p className="summary-value">{analyticsData.total_interviews || 0}</p>
          </div>
          <div className="summary-card">
            <h3>Hired Candidates</h3>
            <p className="summary-value">{analyticsData.hired_candidates || 0}</p>
          </div>
          <div className="summary-card">
            <h3>Rejected Candidates</h3>
            <p className="summary-value">{analyticsData.rejected_candidates || 0}</p>
          </div>
        </div>

        {/* Top 5 Agencies Table */}
        <div className="table-card">
          <h2>Top 5 Hiring Agencies</h2>
          <p className="table-description">Top performing hiring agencies by number of profiles uploaded</p>
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Agency Name</th>
                  <th>Recruiter</th>
                  <th>Profiles Uploaded</th>
                  <th>Selected</th>
                  <th>Rejected</th>
                  <th>Selection Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.top_5_agencies && analyticsData.top_5_agencies.length > 0 ? (
                  analyticsData.top_5_agencies.map((agency, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{agency.agency_name}</td>
                      <td>{agency.recruiter_name}</td>
                      <td>{agency.uploaded_profiles}</td>
                      <td>{agency.selected_profiles}</td>
                      <td>{agency.rejected_profiles}</td>
                      <td>{agency.selection_rate.toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Agencies Table */}
        <div className="table-card">
          <h2>All Hiring Agency Statistics</h2>
          <p className="table-description">Complete breakdown of profiles and interview statistics by hiring agency</p>
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Agency Name</th>
                  <th>Recruiter</th>
                  <th>Profiles Uploaded</th>
                  <th>Selected</th>
                  <th>Rejected</th>
                  <th>Interviews Scheduled</th>
                  <th>Interviews Selected</th>
                  <th>Interviews Rejected</th>
                  <th>Selection Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.all_agencies && analyticsData.all_agencies.length > 0 ? (
                  analyticsData.all_agencies.map((agency, index) => (
                    <tr key={index}>
                      <td>{agency.agency_name}</td>
                      <td>{agency.recruiter_name}</td>
                      <td>{agency.uploaded_profiles}</td>
                      <td>{agency.selected_profiles}</td>
                      <td>{agency.rejected_profiles}</td>
                      <td>{agency.interviews_scheduled}</td>
                      <td>{agency.interviews_selected}</td>
                      <td>{agency.interviews_rejected}</td>
                      <td>{agency.selection_rate.toFixed(1)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="charts-section">
          <div className="chart-card">
            <h2>Hiring Agency Performance</h2>
            <div className="chart-placeholder">
              Chart visualization coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

