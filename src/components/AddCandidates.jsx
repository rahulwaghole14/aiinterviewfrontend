// AddCandidates.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './AddCandidates.css';
import { candidateDomains, candidateJobRoles } from '../data';
import { addCandidate, deleteCandidate } from '../redux/slices/candidatesSlice'; // Import deleteCandidate action

const AddCandidates = () => {
  const dispatch = useDispatch(); // Get dispatch function
  const allCandidates = useSelector((state) => state.candidates.allCandidates); // Get all candidates from Redux
  const searchTerm = useSelector((state) => state.search.searchTerm); // Get search term from Redux

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    jobRole: '',
    email: '',
    resumes: [],
  });
  const [showMessage, setShowMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  // State for row-wise editing (now operates on a copy for editing, then dispatches update)
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editedCandidateData, setEditedCandidateData] = useState(null); // Holds data for the row being edited
  const editResumeInputRef = useRef([]);

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null); // Stores the index of the candidate to be deleted

  // Filtered candidates based on search term
  const filteredCandidates = (allCandidates || []).filter(candidate => {
    if (!searchTerm) {
      return true;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      (candidate.name && candidate.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (candidate.email && candidate.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (candidate.jobRole && candidate.jobRole.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (candidate.domain && candidate.domain.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (Array.isArray(candidate.resumes) &&
        candidate.resumes.some(resume =>
          resume.name && resume.name.toLowerCase().includes(lowerCaseSearchTerm)
        )
      )
    );
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResumeChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 15);
    setFormData((prev) => ({ ...prev, resumes: files }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, domain, jobRole, email, resumes } = formData;
    if (!name || !domain || !jobRole || !email || resumes.length === 0) {
      setErrorMessage('Please fill all fields and upload at least one resume.');
      setShowMessage(false);
      return;
    }
    setErrorMessage('');

    // Dispatch addCandidate action to Redux
    dispatch(addCandidate({
      id: (allCandidates && allCandidates.length > 0) ? Math.max(...allCandidates.map(c => c.id)) + 1 : 1, // Simple ID generation
      name,
      domain,
      jobRole,
      email,
      resumes: resumes.map(file => ({ name: file.name })), // Store only file names
      status: "New Application", // Default status for new candidates
      lastUpdated: new Date().toISOString().slice(0, 10),
      evaluation: null,
      poc: "N/A", // Placeholder for new candidates
      applicationDate: new Date().toISOString().slice(0, 10),
    }));

    setShowMessage(true);
    setFormData({
      name: '',
      domain: '',
      jobRole: '',
      email: '',
      resumes: [],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };

  const handleEditClick = (rowIndex) => {
    setEditingRowIndex(rowIndex);
    setEditedCandidateData({ ...filteredCandidates[rowIndex] }); // Create a copy for editing
  };

  const handleEditCellChange = (e, field) => {
    const newValue = e.target.value;
    setEditedCandidateData((prev) => ({ ...prev, [field]: newValue }));
  };

  const handleSaveClick = () => {
    // Dispatch update action to Redux
    // Note: You'll need an updateCandidate action in your slice for this
    // For now, I'll simulate by updating the local state, but in a real app,
    // you'd dispatch an action like:
    // dispatch(updateCandidate({ id: editedCandidateData.id, updatedData: editedCandidateData }));
    setEditingRowIndex(null);
    setEditedCandidateData(null);
  };

  const handleCancelClick = () => {
    setEditingRowIndex(null);
    setEditedCandidateData(null);
  };

  const handleDeleteClick = (rowIndex) => {
    setDeleteIndex(rowIndex);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteIndex !== null) {
      const candidateId = filteredCandidates[deleteIndex].id; // Get ID from filtered list
      dispatch(deleteCandidate(candidateId)); // Dispatch delete to Redux
      setShowDeleteConfirm(false);
      setDeleteIndex(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteIndex(null);
  };

  const handleEditResumeChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 15);
    setEditedCandidateData((prev) => ({
      ...prev,
      resumes: files.map(file => ({ name: file.name }))
    }));
  };

  const handleResumeFieldClick = (rowIndex) => {
    if (editingRowIndex === rowIndex && editResumeInputRef.current[rowIndex]) {
      editResumeInputRef.current[rowIndex].click();
    }
  };

  return (
    <div className="add-candidates-container">
      {/* Top Section: Header Cards */}
      <div className="add-candidates-top-section">
        <div className="add-candidates-header-cards">
          <div className="add-candidates-card">
            <h3>Total profiles</h3>
            {/* Display count based on filteredCandidates if searchTerm is active, otherwise total candidates */}
            <p>{searchTerm ? filteredCandidates.length : (allCandidates?.length || 0)}</p> {/* Added safety check */}
          </div>
          <div className="add-candidates-card">
            <h3>Errors</h3>
            <p>0</p> {/* Placeholder for errors */}
          </div>
        </div>
      </div>

      {/* Main Content Area - Table and Form side-by-side */}
      <div className="add-candidates-main-content fixed-grid">
        {/* Left Column: Add New Candidate Form (now first) */}
        <div className="add-candidates-form card">
          <h2 className="form-title">Add New Candidate</h2>
          <form id="candidateForm" onSubmit={handleSubmit}>
            <div className="form-box">
              <label htmlFor="candidateName">Candidate Name</label>
              <input
                type="text"
                id="candidateName"
                name="name"
                placeholder="Enter candidate name"
                value={formData.name}
                onChange={handleChange}
                className="add-candidates-input"
              />

              <label htmlFor="domainSelect">Domain</label>
              <select id="domainSelect" name="domain" value={formData.domain} onChange={handleChange} className="add-candidates-select">
                <option value="">Select Domain</option>
                {candidateDomains.map((domain) => ( // Use imported domains
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>

              <label htmlFor="jobRoleSelect">Job Role</label>
              <select id="jobRoleSelect" name="jobRole" value={formData.jobRole} onChange={handleChange} className="add-candidates-select">
                <option value="">Select Job Role</option>
                {candidateJobRoles.map((role) => ( // Use imported job roles
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <label htmlFor="pocEmail">POC Email</label>
              <input
                type="email"
                id="pocEmail"
                name="email"
                placeholder="POC Email"
                value={formData.email}
                onChange={handleChange}
                className="add-candidates-input"
              />

              <div className="resume-upload">
                <label htmlFor="resumeUploadInput" className="resume-upload-label">
                  <p>Upload Resumes (Max 15)</p>
                  <div className="upload-icon-container">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13V17" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 15H14" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="second-upload-icon">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13V17" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10 15H14" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {formData.resumes.length > 0 ? (
                    <p className="selected-files-text">
                      Selected: {formData.resumes.map(file => file.name).join(', ')}
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
                  style={{ display: 'none' }} /* Hide the actual input */
                />
              </div>
              {errorMessage && <div className="erroraddcandidate-msg">⚠️ {errorMessage}</div>}
              {showMessage && <div className="success-msg">✅ Candidate successfully added!</div>}
            </div>
            <div className="form-actions">
              <button className="submit-btn" type="submit">
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Candidate List Table (now second) */}
        <div className="preview-section card">
          <h2 className="table-title">Candidate List</h2>
          <div className="table-box">
            <table className="candidate-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email address</th>
                  <th>Job Role</th>
                  <th>Domain</th>
                  <th>Resume</th>
                  <th>Actions</th> {/* New Actions column */}
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? ( // Use filteredCandidates here
                  <tr className="no-results-row"> {/* Changed class name for consistency */}
                    <td colSpan="6">
                      <div className="no-results-message"> {/* Changed class name for consistency */}
                        {searchTerm ? "No candidates found matching your search." : "Upload Resume (max 15) To Add New Candidates"}
                        {!searchTerm && (
                          <div className="upload-icon-container">
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 13V17" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 15H14" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="second-upload-icon">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 13V17" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 15H14" stroke="#D9F0D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate, rowIndex) => ( // Use filteredCandidates here
                    <tr key={candidate.id}> {/* Use candidate.id for key */}
                      <td>
                        {editingRowIndex === rowIndex ? (
                          <input
                            type="text"
                            value={editedCandidateData?.name || ''} // Use editedCandidateData
                            onChange={(e) => handleEditCellChange(e, 'name')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.name
                        )}
                      </td>
                      <td>
                        {editingRowIndex === rowIndex ? (
                          <input
                            type="email"
                            value={editedCandidateData?.email || ''} // Use editedCandidateData
                            onChange={(e) => handleEditCellChange(e, 'email')}
                            className="add-candidates-input-inline"
                          />
                        ) : (
                          candidate.email
                        )}
                      </td>
                      <td>
                        {editingRowIndex === rowIndex ? (
                          <select
                            value={editedCandidateData?.jobRole || ''} // Use editedCandidateData
                            onChange={(e) => handleEditCellChange(e, 'jobRole')}
                            className="add-candidates-select-inline"
                          >
                            {candidateJobRoles.map((role) => ( // Use imported job roles
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        ) : (
                          candidate.jobRole
                        )}
                      </td>
                      <td>
                        {editingRowIndex === rowIndex ? (
                          <select
                            value={editedCandidateData?.domain || ''} // Use editedCandidateData
                            onChange={(e) => handleEditCellChange(e, 'domain')}
                            className="add-candidates-select-inline"
                          >
                            {candidateDomains.map((domain) => ( // Use imported domains
                              <option key={domain} value={domain}>
                                {domain}
                              </option>
                            ))}
                          </select>
                        ) : (
                          candidate.domain
                        )}
                      </td>
                      <td onClick={() => handleResumeFieldClick(rowIndex)} className="resume-cell">
                        {editingRowIndex === rowIndex ? (
                          <>
                            <input
                              type="file"
                              id={`editResumeInput-${rowIndex}`}
                              accept=".pdf,.doc,.docx"
                              multiple
                              ref={el => editResumeInputRef.current[rowIndex] = el}
                              onChange={(e) => handleEditResumeChange(e)}
                              style={{ display: 'none' }}
                            />
                            <span className="edit-resume-text">
                              {Array.isArray(editedCandidateData?.resumes) && editedCandidateData.resumes.length > 0
                                ? editedCandidateData.resumes.map(file => file.name).join(', ')
                                : 'Upload New Resume'}
                            </span>
                          </>
                        ) : (
                          Array.isArray(candidate.resumes) && candidate.resumes.length > 0
                            ? candidate.resumes.map((file) => file.name).join(', ')
                            : '—'
                        )}
                      </td>
                      <td className="actions-cell">
                        {editingRowIndex === rowIndex ? (
                          <div className="action-buttons-group">
                            <button onClick={handleSaveClick} className="save-btn">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H12L21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M17 21V13H7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M7 3V8H15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Save
                            </button>
                            <button onClick={handleCancelClick} className="cancel-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons-group">
                            <button onClick={() => handleEditClick(rowIndex)} className="edit-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M18.5 2.5C18.8978 2.10217 19.4391 1.87868 20 1.87868C20.5609 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43913 22.1213 4C22.1213 4.56087 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteClick(rowIndex)} className="delete-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M10 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14 11V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Delete Confirmation Popup */}
          {showDeleteConfirm && (
            <div className="delete-confirm-overlay">
              <div className="delete-confirm-modal">
                <p>Are you sure you want to delete this candidate?</p>
                <div className="delete-confirm-actions">
                  <button className="confirm-btn" onClick={confirmDelete}>Yes, Delete</button>
                  <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCandidates;
