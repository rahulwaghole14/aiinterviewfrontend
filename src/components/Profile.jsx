// components/Profile.jsx
import React, { useState, useEffect } from 'react';

const Profile = ({ onTitleChange }) => {
  // Sample user data (in a real app, this would come from an API or context)
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Recruiter',
    company: 'IntelliHire Solutions',
    phone: '123-456-7890',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Initialize form data with current user data when component mounts or isEditing changes
    setFormData(user);
    // Update header title based on editing state
    onTitleChange(isEditing ? 'Edit Profile Details' : 'User Profile');
  }, [isEditing, user, onTitleChange]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setFormData(user); // Revert changes if cancelled
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send formData to your backend API
    console.log('Updating profile:', formData);
    setUser(formData); // Update local state with new data
    setIsEditing(false);
    // Optionally, show a success message
    alert('Profile updated successfully!'); // Using alert for simplicity, replace with custom modal
  };

  return (
    <div className="profile-container">
      <div className="card profile-card">
        {isEditing ? (
          <>
            <h2 className="profile-title">Edit Profile Details</h2>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  required
                  readOnly // Email usually not editable
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={formData.role || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="profile-actions">
                <button type="submit" className="auth-button">Save Changes</button>
                <button type="button" className="auth-button cancel-button" onClick={handleCancelClick}>Cancel</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="profile-title">User Profile</h2>
            <div className="profile-details">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Company:</strong> {user.company}</p>
              <p><strong>Phone:</strong> {user.phone}</p>
            </div>
            <button onClick={handleEditClick} className="auth-button">Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
