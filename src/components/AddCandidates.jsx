import React, { useState, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import "./AddCandidates.css";
import { candidateDomains, candidateJobRoles, baseURL } from "../data";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AddCandidates = () => {
  const navigate = useNavigate();
  const searchTerm = useSelector((state) => state.search.searchTerm);

  // Form state for adding new candidates
  const [formData, setFormData] = useState({
    full_name: "",
    domain: "",
    job_title: "",
    poc_email: "",
    email: "",
    phone: "",
    work_experience: "",
    resumes: [],
  });

  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  const [addedCandidates, setAddedCandidates] = useState([]);

  // State for row-wise editing
  const [editingCandidateId, setEditingCandidateId] = useState(null);
  const [editedCandidateData, setEditedCandidateData] = useState(null);

  // Popup state for deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // State for modal animation control for delete confirmation
  const [showDeleteModalOverlay, setShowDeleteModalOverlay] = useState(false);

  // State for sorting
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 15);
    setFormData((prev) => ({ ...prev, resumes: files }));
  };

  const validateForm = () => {
    if (!formData.domain) {
      setErrorMessage("Domain is required");
      return false;
    }
    if (!formData.job_title) {
      setErrorMessage("Job title is required");
      return false;
    }
    if (!formData.poc_email) {
      setErrorMessage("POC email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.poc_email)) {
      setErrorMessage("Please enter a valid POC email");
      return false;
    }
    if (formData.resumes.length === 0) {
      setErrorMessage("At least one resume is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage("Please log in to add candidates.");
      navigate('/login');
      return;
    }

    const candidatePayload = new FormData();
    
    // Required fields
    candidatePayload.append("domain", formData.domain);
    candidatePayload.append("job_title", formData.job_title);
    candidatePayload.append("poc_email", formData.poc_email);
    
    // Optional fields (if backend expects them even if empty)
    candidatePayload.append("full_name", formData.full_name);
    candidatePayload.append("email", formData.email);
    candidatePayload.append("phone", formData.phone);
    candidatePayload.append("work_experience", formData.work_experience);
    
    // System fields
    candidatePayload.append("status", "Requires Action");
    candidatePayload.append("last_updated", new Date().toISOString().slice(0, 10));
    candidatePayload.append("created_at", new Date().toISOString().slice(0, 10));

    // Iterate and append all resume files using the singular "resume_file" key
    formData.resumes.forEach((file) => {
      candidatePayload.append("resume_file", file);
    });

    try {
      const response = await axios.post(
        `${baseURL}/api/candidates/`,
        candidatePayload,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Backend Response Data:", response.data);

      const newCandidatesData = Array.isArray(response.data) ? response.data : [response.data];

      const newCandidates = newCandidatesData.map(data => ({
        id: data.id,
        name: data.full_name || '-',
        email: data.email || '-',
        phone: data.phone || '-',
        domain: data.domain || '-',
        jobRole: data.job_title || '-',
        poc: data.poc_email || '-',
        workExperience: data.work_experience || '-',
        resumes: data.resume_urls ? 
          data.resume_urls.map(url => ({ name: url.split('/').pop(), url })) : [],
      }));

      console.log("Processed New Candidates:", newCandidates);

      setAddedCandidates(prev => [...prev, ...newCandidates]);
      setShowMessage(true);
      
      // Reset form fields after successful submission
      setFormData({
        full_name: "",
        domain: "",
        job_title: "",
        poc_email: "",
        email: "",
        phone: "",
        work_experience: "",
        resumes: [],
      });

      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setShowMessage(false), 2000);
    } catch (error) {
      console.error("POST error:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to submit. Please try again.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModalOverlay(true);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const authToken = localStorage.getItem('authToken');
    try {
      await axios.delete(
        `${baseURL}/api/candidates/${deleteId}/`,
        {
          headers: {
            Authorization: `Token ${authToken}`,
          },
        }
      );
      setAddedCandidates(prev => prev.filter(c => c.id !== deleteId));
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error.message);
      setErrorMessage("Failed to delete candidate. Please try again.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setShowDeleteModalOverlay(false);
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModalOverlay(false);
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  // Function to handle inline editing
  const handleEditClick = (candidate) => {
    setEditingCandidateId(candidate.id);
    setEditedCandidateData({ ...candidate }); // Create a mutable copy for editing
  };

  const handleEditCellChange = (e, field) => {
    const newValue = e.target.value;
    setEditedCandidateData(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const handleSaveClick = async () => {
    if (!editedCandidateData || !editingCandidateId) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage("Please log in to update candidates.");
      navigate('/login');
      return;
    }

    const updatePayload = {
      full_name: editedCandidateData.name, // Map 'name' back to 'full_name' for API
      email: editedCandidateData.email,
      phone: editedCandidateData.phone,
      work_experience: editedCandidateData.workExperience,
      domain: editedCandidateData.domain,
      job_title: editedCandidateData.jobRole, // Map 'jobRole' back to 'job_title'
      poc_email: editedCandidateData.poc, // Map 'poc' back to 'poc_email'
    };

    try {
      const response = await axios.patch(
        `${baseURL}/api/candidates/${editingCandidateId}/`,
        updatePayload,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "application/json", // Changed to application/json for non-file updates
          },
        }
      );

      const updatedCandidate = {
        id: response.data.id,
        name: response.data.full_name || '-',
        email: response.data.email || '-',
        phone: response.data.phone || '-',
        domain: response.data.domain || '-',
        jobRole: response.data.job_title || '-',
        poc: response.data.poc_email || '-',
        workExperience: response.data.work_experience || '-',
        resumes: response.data.resume_urls ? 
          response.data.resume_urls.map(url => ({ name: url.split('/').pop(), url })) : [],
      };

      setAddedCandidates(prev => 
        prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c)
      );
      setEditingCandidateId(null); // Exit edit mode
      setEditedCandidateData(null); // Clear edited data
      setErrorMessage(''); // Clear any previous error messages
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to update candidate.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCandidateId(null); // Exit edit mode
    setEditedCandidateData(null); // Clear edited data
    setErrorMessage(''); // Clear any error messages
  };


  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  const filteredCandidates = addedCandidates
    .filter((candidate) => {
      if (!searchTerm) return true;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return (
        (candidate.name && candidate.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (candidate.email && candidate.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (candidate.jobRole && candidate.jobRole.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (candidate.domain && candidate.domain.toLowerCase().includes(lowerCaseSearchTerm))
      );
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === null || aValue === undefined) return sortDirection === "asc" ? 1 : -1;
      if (bValue === null || bValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      // Handle cases where values might not be strings for sorting (e.g., numbers)
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  return (
    <div className="add-candidates-container">
      <div className="add-candidates-top-section">
        <div className="add-candidates-header-cards">
          <div className="add-candidates-card">
            <h3>Total profiles</h3>
            <p>{filteredCandidates.length}</p>
          </div>
          <div className="add-candidates-card">
            <h3>Errors</h3>
            <p>0</p>
          </div>
        </div>
      </div>

      <div className="add-candidates-main-content fixed-grid">
        {/* Form Section */}
        <div className="add-candidates-form card">
          <h2 className="form-title">Add New Candidate</h2>
          <form id="candidateForm" onSubmit={handleSubmit}>
            <div className="form-box">
              {/* Removed Full Name (Optional) */}

              {/* Required Fields */}
              <div className="form-group">
                <label htmlFor="domainSelect">Domain <span className="required-field">*</span></label>
                <select
                  id="domainSelect"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  className="add-candidates-select"
                  required
                >
                  <option value="">Select Domain</option>
                  {candidateDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="jobTitleSelect">Job Title <span className="required-field">*</span></label>
                <select
                  id="jobTitleSelect"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="add-candidates-select"
                  required
                >
                  <option value="">Select Job Title</option>
                  {candidateJobRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pocEmail">POC Email <span className="required-field">*</span></label>
                <input
                  type="email"
                  id="pocEmail"
                  name="poc_email"
                  placeholder="Point of contact email"
                  value={formData.poc_email}
                  onChange={handleChange}
                  className="add-candidates-input"
                  required
                />
              </div>

              {/* Required Resume Upload */}
              <div className="form-group resume-upload">
                <label htmlFor="resumeUploadInput" className="resume-upload-label">
                  <p>Upload Resumes (Max 15) <span className="required-field">*</span></p>
                  <div className="upload-icon-container">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
                        stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13V17" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 15H14" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {formData.resumes.length > 0 ? (
                    <p className="selected-files-text">
                      Selected: {formData.resumes.map((file) => file.name).join(", ")}
                    </p>
                  ) : (
                    <p className="selected-files-text">No files selected</p>
                  )}
                </label>
                <input
                  type="file"
                  id="resumeUploadInput"
                  accept=".pdf,.doc,.docx"
                  multiple
                  ref={fileInputRef}
                  onChange={handleResumeChange}
                  style={{ display: "none" }}
                  required
                />
              </div>

              {errorMessage && (
                <div className="error-message">⚠️ {errorMessage}</div>
              )}
              {showMessage && (
                <div className="success-message">
                  ✅ Candidate successfully added!
                </div>
              )}
            </div>
            <div className="form-actions">
              <button className="submit-btn" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Table Section */}
        <div className="preview-section card">
          <div className="table-box">
            <h2>Candidate List</h2>
            <table className="candidate-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')}>Name {getSortIndicator('name')}</th>
                  <th onClick={() => handleSort('email')}>Email {getSortIndicator('email')}</th>
                  <th onClick={() => handleSort('phone')}>Phone {getSortIndicator('phone')}</th>
                  <th onClick={() => handleSort('domain')}>Domain {getSortIndicator('domain')}</th>
                  <th onClick={() => handleSort('jobRole')}>Job Role {getSortIndicator('jobRole')}</th>
                  <th onClick={() => handleSort('workExperience')}>Experience {getSortIndicator('workExperience')}</th>
                  <th>Resume(s)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <input
                            type="text"
                            value={editedCandidateData?.name || ''}
                            onChange={(e) => handleEditCellChange(e, 'name')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.name || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <input
                            type="email"
                            value={editedCandidateData?.email || ''}
                            onChange={(e) => handleEditCellChange(e, 'email')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.email || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <input
                            type="tel"
                            value={editedCandidateData?.phone || ''}
                            onChange={(e) => handleEditCellChange(e, 'phone')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.phone || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <select
                            value={editedCandidateData?.domain || ''}
                            onChange={(e) => handleEditCellChange(e, 'domain')}
                            className="add-candidates-select-inline"
                          >
                            <option value="">Select Domain</option>
                            {candidateDomains.map((domain) => (
                              <option key={domain} value={domain}>
                                {domain}
                              </option>
                            ))}
                          </select>
                        ) : (
                          candidate.domain || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <select
                            value={editedCandidateData?.jobRole || ''}
                            onChange={(e) => handleEditCellChange(e, 'jobRole')}
                            className="add-candidates-select-inline"
                          >
                            <option value="">Select Job Title</option>
                            {candidateJobRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          candidate.jobRole || '-'
                        )}
                      </td>
                      <td>
                        {editingCandidateId === candidate.id ? (
                          <input
                            type="text"
                            value={editedCandidateData?.workExperience || ''}
                            onChange={(e) => handleEditCellChange(e, 'workExperience')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.workExperience || '-'
                        )}
                      </td>
                      <td>
                        {candidate.resumes.length > 0 ? (
                          <div className="resume-links-container">
                            {candidate.resumes.map((resume, index) => (
                              <a
                                key={index}
                                href={resume.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="resume-link"
                              >
                                View {index + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          "No Resume"
                        )}
                      </td>
                      <td className="actions-cell">
                        {editingCandidateId === candidate.id ? (
                          <div className="action-buttons-group">
                            <button onClick={handleSaveClick} className="save-btn" title="Save">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12L21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M17 21V13H7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M7 3V8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button onClick={handleCancelEdit} className="cancel-btn" title="Cancel">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button
                              onClick={() => handleEditClick(candidate)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(candidate.id)}
                              className="delete-btn"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-table-message">
                      <div className="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" 
                            stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H20" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 13V17" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 15H14" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p>No candidates found. Add candidates to see details.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModalOverlay && (
        <div className={`modal-overlay ${showDeleteConfirm ? 'show' : ''}`}>
          <div className={`delete-confirm-modal ${showDeleteConfirm ? 'show' : ''}`}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this candidate? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Delete
              </button>
              <button className="cancel-delete-btn" onClick={cancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCandidates;
