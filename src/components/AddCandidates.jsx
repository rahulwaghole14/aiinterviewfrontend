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

  // Form state
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);

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
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setErrorMessage("Please enter a valid candidate email");
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
    
    // Optional fields
    if (formData.full_name) candidatePayload.append("full_name", formData.full_name);
    if (formData.email) candidatePayload.append("email", formData.email);
    if (formData.phone) candidatePayload.append("phone", formData.phone);
    if (formData.work_experience) candidatePayload.append("work_experience", formData.work_experience);
    
    // System fields
    candidatePayload.append("status", "Requires Action");
    candidatePayload.append("last_updated", new Date().toISOString().slice(0, 10));
    candidatePayload.append("created_at", new Date().toISOString().slice(0, 10));

    // *** MODIFICATION START ***
    // Send only the first resume file under the name 'resume_file'
    if (formData.resumes.length > 0) {
      candidatePayload.append("resume_file", formData.resumes[0]);
    }
    // *** MODIFICATION END ***

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

      const newCandidate = {
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

      setAddedCandidates(prev => [...prev, newCandidate]);
      setShowMessage(true);
      
      // Reset form but keep the required fields that might be reused
      setFormData(prev => ({
        ...prev,
        full_name: "",
        email: "",
        phone: "",
        work_experience: "",
        resumes: [], // Clear resumes after successful submission
      }));

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
    setShowDeleteConfirm(true);
    setDeleteId(id);
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
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const handleEdit = (candidate) => {
    setEditingCandidate({
      id: candidate.id,
      full_name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      work_experience: candidate.workExperience,
      domain: candidate.domain,
      job_title: candidate.jobRole,
      poc_email: candidate.poc,
      resumeUrl: candidate.resumes[0]?.url || '',
      newResumeFile: null,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setErrorMessage("Please log in to update candidates.");
      navigate('/login');
      return;
    }

    const updatePayload = new FormData();
    if (editingCandidate.full_name) updatePayload.append("full_name", editingCandidate.full_name);
    if (editingCandidate.email) updatePayload.append("email", editingCandidate.email);
    if (editingCandidate.phone) updatePayload.append("phone", editingCandidate.phone);
    if (editingCandidate.work_experience) updatePayload.append("work_experience", editingCandidate.work_experience);
    if (editingCandidate.domain) updatePayload.append("domain", editingCandidate.domain);
    if (editingCandidate.job_title) updatePayload.append("job_title", editingCandidate.job_title);
    if (editingCandidate.poc_email) updatePayload.append("poc_email", editingCandidate.poc_email);
    
    if (editingCandidate.newResumeFile) {
      updatePayload.append("resume_file", editingCandidate.newResumeFile);
    }

    try {
      const response = await axios.patch(
        `${baseURL}/api/candidates/`,
        updatePayload,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            "Content-Type": "multipart/form-data",
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
      setEditModalOpen(false);
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      setErrorMessage(error.response?.data?.message || "Failed to update candidate.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
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
              {/* Optional Fields */}
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="full_name"
                  placeholder="Candidate name (optional)"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="add-candidates-input"
                />
              </div>

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

              {/* Optional Fields */}
              <div className="form-group">
                <label htmlFor="candidateEmail">Candidate Email</label>
                <input
                  type="email"
                  id="candidateEmail"
                  name="email"
                  placeholder="Candidate email (optional)"
                  value={formData.email}
                  onChange={handleChange}
                  className="add-candidates-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidatePhone">Phone Number</label>
                <input
                  type="tel"
                  id="candidatePhone"
                  name="phone"
                  placeholder="Phone number (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  className="add-candidates-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="workExperience">Work Experience</label>
                <input
                  type="text"
                  id="workExperience"
                  name="work_experience"
                  placeholder="Work experience (optional)"
                  value={formData.work_experience}
                  onChange={handleChange}
                  className="add-candidates-input"
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
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>{candidate.name || '-'}</td>
                      <td>{candidate.email || '-'}</td>
                      <td>{candidate.phone || '-'}</td>
                      <td>{candidate.domain || '-'}</td>
                      <td>{candidate.jobRole || '-'}</td>
                      <td>{candidate.workExperience || '-'}</td>
                      <td>
                        {candidate.resumes.length > 0 ? (
                          <a
                            href={candidate.resumes[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resume-link"
                          >
                            View
                          </a>
                        ) : (
                          "No Resume"
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleEdit(candidate)}
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

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Candidate</h3>
            <form onSubmit={handleUpdate}>
              <div className="modal-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editingCandidate.full_name || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Domain</label>
                <select
                  value={editingCandidate.domain || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      domain: e.target.value,
                    })
                  }
                >
                  <option value="">Select Domain</option>
                  {candidateDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>Job Title</label>
                <select
                  value={editingCandidate.job_title || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      job_title: e.target.value,
                    })
                  }
                >
                  <option value="">Select Job Title</option>
                  {candidateJobRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>POC Email</label>
                <input
                  type="email"
                  value={editingCandidate.poc_email || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      poc_email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingCandidate.email || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={editingCandidate.phone || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      phone: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Work Experience</label>
                <input
                  type="text"
                  value={editingCandidate.work_experience || ''}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      work_experience: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-form-group">
                <label>Resume</label>
                <div className="resume-upload-container">
                  {editingCandidate.resumeUrl && (
                    <a
                      href={editingCandidate.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-link"
                    >
                      Current Resume
                    </a>
                  )}
                  <input
                    type="file"
                    onChange={(e) =>
                      setEditingCandidate({
                        ...editingCandidate,
                        newResumeFile: e.target.files[0],
                      })
                    }
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="modal-error-message">⚠️ {errorMessage}</div>
              )}

              <div className="modal-actions">
                <button type="submit" className="modal-submit-btn">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
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