// src/components/HiringAgencies.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import "./HiringAgency.css";
import { baseURL } from "../data";
import { API_ENDPOINTS } from "../config/api";
import { fetchCompanies } from "../redux/slices/companiesSlice";
import { fetchHiringAgencies } from "../redux/slices/hiringAgenciesSlice";
import { fetchRecruiters } from "../redux/slices/recruitersSlice";
import { fetchAdmins } from "../redux/slices/adminSlice"; // Import the dummy fetch for admins
import DataTable from "./common/DataTable";
import LoadingSpinner from "./common/LoadingSpinner";
import { FaSave, FaTimes, FaEdit, FaTrash } from "react-icons/fa";
import { FormModal, ConfirmModal } from "./common/Modal";
import { useNotification } from "../hooks/useNotification";

const formInputStyle = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-small)",
  fontSize: "0.9rem",
  backgroundColor: "var(--color-card)",
  color: "var(--color-text)",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const formInputFocusStyle = {
  outline: "none",
  borderColor: "var(--color-primary)",
  boxShadow: "0 0 0 2px rgba(127, 202, 146, 0.25)",
};

const actionButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "32px",
  borderRadius: "var(--radius-small)",
  border: "1px solid var(--color-border)",
  cursor: "pointer",
  transition: "var(--transition)",
  fontSize: "14px",
  color: "var(--color-text)",
  backgroundColor: "var(--color-card)",
  "&:hover": {
    backgroundColor: "var(--color-hover)",
    boxShadow: "var(--shadow-button-hover)",
  },
  "&:focus": {
    outline: "none",
    boxShadow: "0 0 0 2px var(--color-primary)",
  },
};

const saveButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: "var(--color-success)",
  color: "white",
  borderColor: "var(--color-success-dark)",
  "&:hover": {
    backgroundColor: "var(--color-success-dark)",
    borderColor: "var(--color-success-dark)",
    boxShadow: "var(--shadow-button-hover)",
  },
  "&:active": {
    transform: "translateY(1px)",
  },
};

const cancelButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: "var(--color-card)",
  borderColor: "var(--color-border)",
  color: "var(--color-text-secondary)",
  "&:hover": {
    backgroundColor: "var(--color-hover)",
    borderColor: "var(--color-gray)",
    color: "var(--color-text)",
    boxShadow: "var(--shadow-button-hover)",
  },
  "&:active": {
    transform: "translateY(1px)",
  },
};

const buttonContainerStyle = {
  display: "flex",
  gap: "0.5rem",
  justifyContent: "center",
  alignItems: "center",
};

const HiringAgencies = () => {
  const dispatch = useDispatch();
  const notify = useNotification();
  const searchTerm = useSelector((state) => state.search.searchTerm);
  const user = useSelector((state) => state.user.user); // Get the full user object
  const userRole = user?.role; // Access the user's role from the Redux store
  const userCompany = user?.company_name; // Get the logged-in user's company name

  // Data from Redux slices
  const companies = useSelector((state) => state.companies.companies);
  const hiringAgencies = useSelector(
    (state) => state.hiringAgencies.hiringAgencies
  );
  const recruiters = useSelector((state) => state.recruiters.recruiters);
  const admins = useSelector((state) => state.admin.admins); // Get admin dummy data

  // Loading and error states (can be combined for a single loading indicator if preferred)
  const companiesStatus = useSelector((state) => state.companies.status);
  const hiringAgenciesStatus = useSelector(
    (state) => state.hiringAgencies.status
  );
  const recruitersStatus = useSelector((state) => state.recruiters.status);
  const adminStatus = useSelector((state) => state.admin.status);

  const [activeTab, setActiveTab] = useState("Recruiter"); // Default to 'Recruiter' tab
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    company_name: userRole === "COMPANY" ? userCompany : "", // Pre-fill if company user
    role: userRole === "COMPANY" ? "RECRUITER" : "RECRUITER", // Default role for new users based on logged-in user
    password: "",
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUserData, setEditedUserData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [permissionError, setPermissionError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Define tabs based on user role
  const getAvailableTabs = (role) => {
    const normalizedRole = String(role || "")
      .toLowerCase()
      .trim();
    if (normalizedRole === "admin") {
      return ["Recruiter", "Hiring Agency", "Company", "Admin"];
    } else if (normalizedRole === "company") {
      return ["Recruiter", "Hiring Agency"];
    } else if (normalizedRole === "hiring_agency") {
      return ["Recruiter"];
    }
    return [];
  };

  const availableTabs = getAvailableTabs(userRole);

  // NEW: Define role options for the Add New User form based on user role
  const getRoleOptions = (role) => {
    const normalizedRole = role?.toUpperCase();
    if (normalizedRole === "ADMIN") {
      return [
        { value: "ADMIN", label: "Admin" },
        { value: "COMPANY", label: "Company" },
        { value: "HIRING_AGENCY", label: "Hiring Agency" },
        { value: "RECRUITER", label: "Recruiter" },
      ];
    } else if (normalizedRole === "COMPANY") {
      return [
        { value: "HIRING_AGENCY", label: "Hiring Agency" },
        { value: "RECRUITER", label: "Recruiter" },
      ];
    } else if (normalizedRole === "HIRING_AGENCY") {
      return [{ value: "RECRUITER", label: "Recruiter" }];
    }
    return [];
  };

  const roleOptions = getRoleOptions(userRole);

  // Set default tab based on available tabs
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [userRole, availableTabs, activeTab]);

  // Function to get dynamic button text based on active tab
  const getAddButtonText = () => {
    switch (activeTab) {
      case "Recruiter":
        return "Add New Recruiter";
      case "Hiring Agency":
        return "Add New Agency";
      case "Company":
        return "Add New Company";
      case "Admin":
        return "Add New Admin";
      default:
        return "Add New User";
    }
  };

  // Function to get table columns based on active tab
  const getTableColumns = () => {
    switch (activeTab) {
      case "Company":
        return [
          {
            field: "name",
            header: "Name",
            width: "20%",
            editable: true,
          },
          {
            field: "email",
            header: "Email",
            width: "20%",
            editable: true,
          },
          {
            field: "description",
            header: "Description",
            width: "35%",
            editable: true,
          },
          {
            field: "is_active",
            header: "Status",
            width: "15%",
            type: "select",
            options: [
              { value: true, label: "Active" },
              { value: false, label: "Inactive" },
            ],
            render: (value) => (
              <span className="status-cell" data-status={value ? "active" : "inactive"}>
                {value ? "Active" : "Inactive"}
              </span>
            ),
            editable: true,
          },
        ];
      case "Hiring Agency":
        return [
          {
            field: "first_name",
            header: "First Name",
            width: "12%",
            editable: true,
          },
          {
            field: "last_name",
            header: "Last Name",
            width: "12%",
            editable: true,
          },
          {
            field: "email",
            header: "Email",
            width: "18%",
            editable: true,
          },
          {
            field: "phone_number",
            header: "Phone",
            width: "12%",
            editable: true,
          },
          {
            field: "company_name",
            header: "Company",
            width: "15%",
            editable: true,
          },
          {
            field: "role",
            header: "Role",
            width: "12%",
            editable: false,
          },
          {
            field: "linkedin_url",
            header: "LinkedIn",
            width: "12%",
            editable: true,
          },
          {
            field: "permission_granted",
            header: "Permission Date",
            width: "12%",
            editable: false,
            render: (value) => {
              if (!value) return 'N/A';
              return new Date(value).toLocaleDateString();
            },
          },
        ];
      case "Recruiter":
      case "Admin":
      default:
        return [
          {
            field: "full_name",
            header: "Full Name",
            width: "20%",
            editable: true,
          },
          {
            field: "email",
            header: "Email",
            width: "25%",
            editable: true,
          },
          {
            field: "company_name",
            header: "Company",
            width: "20%",
            editable: true,
          },
          {
            field: "role",
            header: "Role",
            width: "15%",
            type: "select",
            editable: true,
            options: [
              { value: "ADMIN", label: "Admin" },
              { value: "COMPANY", label: "Company" },
              { value: "HIRING_AGENCY", label: "Hiring Agency" },
              { value: "RECRUITER", label: "Recruiter" },
              { value: "OTHERS", label: "Others" },
            ],
          },
          {
            field: "is_active",
            header: "Active",
            width: "10%",
            type: "select",
            editable: true,
            options: [
              { value: true, label: "Active" },
              { value: false, label: "Inactive" },
            ],
            render: (value) => (
              <span className="status-cell" data-status={value ? "active" : "inactive"}>
                {value ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            field: "date_joined",
            header: "Joined",
            width: "10%",
            editable: false,
            render: (value) => {
              if (!value) return 'N/A';
              return new Date(value).toLocaleDateString();
            },
          },
        ];
    }
  };

  // Fetch data on component mount and when activeTab changes (if data isn't already loaded)
  useEffect(() => {
    // Only proceed if we have user data
    if (!user) {
      console.log("HiringAgencies - No user logged in.");
      console.log("HiringAgencies - User data from Redux:", user);
      console.log("HiringAgencies - Auth token:", localStorage.getItem('authToken'));
      setIsLoading(false);
      return;
    }

    console.log("HiringAgencies - Logged-in user details:", user);
    console.log("HiringAgencies - User role:", userRole);
    console.log("HiringAgencies - User company:", userCompany);
    console.log("HiringAgencies - Auth token exists:", !!localStorage.getItem('authToken'));

    // Reset permission error first
    setPermissionError("");
    setIsLoading(true);

    // Normalize role for comparison (handle both 'hiring_agency' and 'hiring agency' formats)
    const normalizedRole = String(userRole || "")
      .toLowerCase()
      .trim()
      .replace(/ /g, "_");
    const allowedRoles = ["admin", "company", "hiring_agency"];

    console.log("HiringAgencies - Normalized role:", normalizedRole);
    console.log("HiringAgencies - Allowed roles:", allowedRoles);
    console.log("HiringAgencies - Role allowed:", allowedRoles.includes(normalizedRole));

    if (!allowedRoles.includes(normalizedRole)) {
      setPermissionError("You do not have permission to access this page.");
      setIsLoading(false);
      return;
    }

    // Fetch data based on user role
    const fetchData = async () => {
      try {
        console.log("HiringAgencies - Starting data fetch...");
        
        if (["admin", "company"].includes(normalizedRole)) {
          console.log("HiringAgencies - Fetching hiring agencies...");
          if (hiringAgenciesStatus === "idle") {
            await dispatch(fetchHiringAgencies()).unwrap();
          }
        }

        if (["admin", "company", "hiring_agency"].includes(normalizedRole)) {
          console.log("HiringAgencies - Fetching recruiters...");
          if (recruitersStatus === "idle") {
            await dispatch(fetchRecruiters());
          }
        }

        if (normalizedRole === "admin") {
          console.log("HiringAgencies - Fetching companies and admins...");
          if (companiesStatus === "idle") {
            await dispatch(fetchCompanies());
          }
          if (adminStatus === "idle") {
            await dispatch(fetchAdmins());
          }
        }
        
        console.log("HiringAgencies - Data fetch completed");
      } catch (error) {
        console.error("Error fetching data:", error);
        setPermissionError("An error occurred while loading data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    user,
    userRole,
    dispatch,
    hiringAgenciesStatus,
    recruitersStatus,
    companiesStatus,
    adminStatus,
  ]);

  // Determine the data to display based on the active tab
  const getCurrentTableData = () => {
    console.log("getCurrentTableData - Active tab:", activeTab);
    console.log("getCurrentTableData - Recruiters data:", recruiters);
    console.log("getCurrentTableData - Hiring agencies data:", hiringAgencies);
    console.log("getCurrentTableData - Companies data:", companies);
    console.log("getCurrentTableData - Admins data:", admins);
    
    switch (activeTab) {
      case "Recruiter":
        // Log recruiter data here to inspect its structure
        console.log("Recruiter Data:", recruiters);
        // Map recruiter data to fit the table structure based on provided sample
        const recruiterData = (recruiters || []).map((recruiter) => ({
          id: recruiter.id,
          name: recruiter.full_name, // Use full_name for 'Name'
          email: recruiter.email,
          status: recruiter.is_active ? "Active" : "Inactive", // Convert boolean to string status
          role: recruiter.userType, // Use userType for 'Role'
          // No 'phone' or 'lastUpdated' in the provided sample, so they are omitted
        }));
        console.log("Mapped recruiter data:", recruiterData);
        return recruiterData;
      case "Hiring Agency":
        // Return hiring agency data directly without mapping since column fields match API fields
        console.log("Hiring agency data from API:", hiringAgencies);
        return hiringAgencies || [];
      case "Company":
        // Map company data to fit the table structure
        const companyData = (companies || []).map((company) => ({
          id: company.id,
          name: company.name,
          description: company.description, // Use description for a relevant column
          is_active: company.is_active, // Use is_active for status
          status: company.is_active ? "Active" : "Inactive", // Convert boolean to string status
        }));
        console.log("Mapped company data:", companyData);
        return companyData;
      case "Admin":
        // Ensure admins is an array before returning
        console.log("Admin data:", admins);
        return admins || [];
      default:
        return [];
    }
  };

  const currentTableData = getCurrentTableData();

  // Filter and sort logic (remains similar, but now operates on fetched data)
  const filteredBySearch = currentTableData.filter((item) => {
    // Changed 'user' to 'item' for generality
    // Apply search term filter
    const matchesSearchTerm =
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) || // Added for company description
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role?.toLowerCase().includes(searchTerm.toLowerCase()) || // Changed userType to role
      item.company_name?.toLowerCase().includes(searchTerm.toLowerCase()); // Added for company name in hiring agency

    // Apply company name filter if logged-in user is a COMPANY
    const matchesCompany =
      userRole === "COMPANY"
        ? item.company_name?.toLowerCase() === userCompany?.toLowerCase()
        : true; // No company filter for ADMIN or other roles

    return matchesSearchTerm && matchesCompany;
  });

  const sortedUsers = [...filteredBySearch].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    // Handle boolean for is_active in Company tab
    if (sortColumn === "is_active" && activeTab === "Company") {
      if (aValue === bValue) return 0;
      if (sortDirection === "asc") {
        return aValue ? -1 : 1; // true comes before false for asc
      } else {
        return aValue ? 1 : -1; // false comes before true for desc
      }
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = sortedUsers.slice(
    indexOfFirstRecord,
    indexOfLastRecord
  );

  const handleRecordsPerPageChange = (e) => {
    const newRecordsPerPage = Number(e.target.value);
    setRecordsPerPage(newRecordsPerPage);
    setCurrentPage(1); // Reset to first page when changing records per page
  };

  useEffect(() => {
    setTotalPages(Math.ceil(filteredBySearch.length / recordsPerPage));
    // Reset to first page if current page is out of bounds
    if (currentPage > Math.ceil(filteredBySearch.length / recordsPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredBySearch, recordsPerPage, currentPage]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    setCurrentPage(1); // Reset pagination when search term or sort changes
  }, [searchTerm, sortColumn, sortDirection, activeTab]); // Also reset on tab change

  // Effect to add/remove 'show' class for modal animations
  useEffect(() => {
    const addModalOverlay = document.querySelector(".add-agency-modal-overlay");
    const deleteModalOverlay = document.querySelector(
      ".delete-confirm-overlay"
    );

    if (addModalOverlay) {
      if (showAddModal) {
        addModalOverlay.classList.add("show");
      } else {
        addModalOverlay.classList.remove("show");
      }
    }

    if (deleteModalOverlay) {
      if (showDeleteConfirm) {
        deleteModalOverlay.classList.add("show");
      } else {
        deleteModalOverlay.classList.remove("show");
      }
    }
  }, [showAddModal, showDeleteConfirm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    // Basic validation
    if (
      !formData.username ||
      !formData.full_name ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      notify.error("All fields are required.");
      return;
    }

    // Determine the API endpoint based on the selected role
    let endpoint = "";
    let payload = {};

    endpoint = API_ENDPOINTS.auth.register;
    payload = {
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      company_name: formData.company_name, // company_name might be optional for some roles
      role: formData.role.toUpperCase(),
      password: formData.password,
    };

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user.");
      }

      const result = await response.json();
      notify.success(`User ${result.full_name} added successfully!`);
      setShowAddModal(false);
      setFormData({
        username: "",
        full_name: "",
        email: "",
        company_name: userRole === "COMPANY" ? userCompany : "", // Reset company name based on user role
        role: userRole === "COMPANY" ? "RECRUITER" : "RECRUITER", // Reset role based on user role
        password: "",
      });
      // Re-fetch data for the active tab to update the table
      if (activeTab === "Recruiter") dispatch(fetchRecruiters());
      else if (activeTab === "Hiring Agency") dispatch(fetchHiringAgencies());
      else if (activeTab === "Company") dispatch(fetchCompanies());
      else if (activeTab === "Admin") dispatch(fetchAdmins()); // Re-fetch dummy admins
    } catch (error) {
      console.error("Error adding user:", error);
      notify.error(error.message || "Failed to add user");
    }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setEditedUserData({ ...user });
  };

  const handleEditedInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editedUserData || !editingUserId) {
      return;
    }

    // Find the original user data
    const originalUser = currentRecords.find(
      (user) => user.id === editingUserId
    );

    // Check if there are any changes
    const hasChanges = Object.keys(editedUserData).some((key) => {
      // Special handling for status vs is_active
      if (key === "status") {
        const newStatus = editedUserData[key]?.toLowerCase() === "active";
        return originalUser.is_active !== newStatus;
      }
      return originalUser[key] !== editedUserData[key];
    });

    if (!hasChanges) {
      notify.info("No changes detected.");
      setEditingUserId(null);
      setEditedUserData(null);
      return;
    }

    try {
      let endpoint = "";
      let payload = {};
      const token = localStorage.getItem("authToken");

      // Determine endpoint and payload based on active tab
      switch (activeTab) {
        case "Recruiter":
          endpoint = `${baseURL}/api/companies/recruiters/${editedUserData.id}/`;
          payload = {
            new_full_name: editedUserData.name,
            new_email: editedUserData.email,
            is_active: editedUserData.status?.toLowerCase() === "active",
          };
          break;
        case "Hiring Agency":
          endpoint = `${baseURL}/api/hiring_agency/${editedUserData.id}/`;
          payload = {
            name: editedUserData.name,
            email: editedUserData.email,
            is_active: editedUserData.status?.toLowerCase() === "active",
          };
          break;
        case "Company":
          endpoint = `${baseURL}/api/companies/${editedUserData.id}/`;
          payload = {
            name: editedUserData.name,
            description: editedUserData.description,
            is_active: editedUserData.status?.toLowerCase() === "active",
          };
          break;
        case "Admin":
          endpoint = `${baseURL}/api/admins/${editedUserData.id}/`;
          payload = {
            name: editedUserData.name,
            email: editedUserData.email,
            is_active: editedUserData.status?.toLowerCase() === "active",
          };
          break;
        default:
          throw new Error("Invalid user type");
      }

      console.log("Attempting to update from endpoint:", endpoint);
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Update response status:", response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log("Update response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to update user");
      }

      console.log("Update successful, refreshing data...");
      // Refresh the data after successful update
      if (activeTab === "Recruiter") dispatch(fetchRecruiters());
      else if (activeTab === "Hiring Agency") dispatch(fetchHiringAgencies());
      else if (activeTab === "Company") dispatch(fetchCompanies());
      else if (activeTab === "Admin") dispatch(fetchAdmins());

      setEditingUserId(null);
      setEditedUserData(null);
      notify.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      notify.error(error.message || "Failed to update user");
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditedUserData(null);
  };

  const handleViewClick = (user) => {
    console.log("Viewing user:", user);
    notify.info(`Viewing user: ${user.name} (${user.email})`, "User Details");
  };

  const handleDeleteClick = (userId) => {
    console.log("handleDeleteClick called with userId:", userId);
    // If userId is an event object (from context menu), get the user ID from data attribute
    if (userId && typeof userId === "object" && userId.preventDefault) {
      userId.preventDefault();
      const userIdFromMenu = userId.currentTarget?.getAttribute("data-userid");
      console.log("Context menu delete - userIdFromMenu:", userIdFromMenu);
      if (userIdFromMenu) {
        setDeleteUserId(userIdFromMenu);
        setShowDeleteConfirm(true);
      }
    } else {
      // Handle regular button click
      console.log("Regular delete click - userId:", userId);
      setDeleteUserId(userId);
      setShowDeleteConfirm(true);
    }
    console.log("Current deleteUserId state after set:", deleteUserId);
  };

  const confirmDelete = async () => {
    console.log("=== confirmDelete STARTED ===");
    console.log("confirmDelete called with deleteUserId:", deleteUserId);

    if (!deleteUserId) {
      console.error("No user ID available for deletion");
      return;
    }

    console.log("Starting delete process for user ID:", deleteUserId);
    setIsDeleting(true);

    try {
      let endpoint = "";
      const token = localStorage.getItem("authToken");
      console.log("Active tab:", activeTab);
      console.log("Using token:", token ? "Token exists" : "No token found");

      // Determine endpoint based on active tab
      switch (activeTab) {
        case "Recruiter":
          endpoint = `${baseURL}/api/companies/recruiters/${deleteUserId}/`;
          break;
        case "Hiring Agency":
          endpoint = `${baseURL}/api/hiring_agency/${deleteUserId}/`;
          break;
        case "Company":
          endpoint = `${baseURL}/api/companies/${deleteUserId}/`;
          break;
        default:
          console.error("Invalid tab for delete operation:", activeTab);
          throw new Error("Invalid tab for delete operation.");
      }

      console.log("Sending DELETE request to:", endpoint);
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Delete failed with status:",
          response.status,
          "Response:",
          errorText
        );
        throw new Error(
          `Failed to delete user: ${response.status} - ${errorText}`
        );
      }

      console.log("Delete successful, refreshing data...");
      // Refresh the data after successful deletion
      const fetchPromises = [];

      if (activeTab === "Recruiter") {
        fetchPromises.push(dispatch(fetchRecruiters()));
      } else if (activeTab === "Hiring Agency") {
        fetchPromises.push(dispatch(fetchHiringAgencies()));
      } else if (activeTab === "Company") {
        fetchPromises.push(dispatch(fetchCompanies()));
      }

      // Wait for all fetches to complete
      await Promise.all(fetchPromises);

      notify.success("User deleted successfully!");
      console.log("Data refresh complete");
    } catch (error) {
      console.error("Error in confirmDelete:", error);
      notify.error(error.message || "Failed to delete user");
    } finally {
      console.log("Cleanup after delete operation");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteUserId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteUserId(null);
    setIsDeleting(false);
  };

  // New function for DataTable edit integration
  const handleUpdateUser = async (editedData) => {
    if (!editedData || !editedData.id) {
      throw new Error("Invalid data provided for update");
    }

    // Find the original user data
    const originalUser = currentRecords.find(
      (user) => user.id === editedData.id
    );

    // Check if there are any changes
    const hasChanges = Object.keys(editedData).some((key) => {
      // Special handling for status vs is_active
      if (key === "status") {
        const newStatus = editedData[key]?.toLowerCase() === "active";
        return originalUser.is_active !== newStatus;
      }
      return originalUser[key] !== editedData[key];
    });

    if (!hasChanges) {
      notify.info("No changes detected.");
      return;
    }

    try {
      let endpoint = "";
      let payload = {};
      const token = localStorage.getItem("authToken");

      // Determine endpoint and payload based on active tab
      switch (activeTab) {
        case "Recruiter":
          endpoint = `${baseURL}/api/companies/recruiters/${editedData.id}/`;
          payload = {
            new_full_name: editedData.name,
            new_email: editedData.email,
            is_active: editedData.status?.toLowerCase() === "active",
          };
          break;
        case "Hiring Agency":
          endpoint = `${baseURL}/api/hiring_agency/${editedData.id}/`;
          payload = {
            name: editedData.name,
            email: editedData.email,
            is_active: editedData.status?.toLowerCase() === "active",
          };
          break;
        case "Company":
          endpoint = `${baseURL}/api/companies/${editedData.id}/`;
          payload = {
            name: editedData.name,
            description: editedData.description,
            is_active: editedData.status?.toLowerCase() === "active",
          };
          break;
        case "Admin":
          endpoint = `${baseURL}/api/admins/${editedData.id}/`;
          payload = {
            name: editedData.name,
            email: editedData.email,
            is_active: editedData.status?.toLowerCase() === "active",
          };
          break;
        default:
          throw new Error("Invalid user type");
      }

      console.log("Attempting to update from endpoint:", endpoint);
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Update response status:", response.status);
      const responseData = await response.json().catch(() => ({}));
      console.log("Update response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to update user");
      }

      console.log("Update successful, refreshing data...");
      // Refresh the data after successful update
      if (activeTab === "Recruiter") dispatch(fetchRecruiters());
      else if (activeTab === "Hiring Agency") dispatch(fetchHiringAgencies());
      else if (activeTab === "Company") dispatch(fetchCompanies());
      else if (activeTab === "Admin") dispatch(fetchAdmins());

      notify.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      notify.error(error.message || "Failed to update user");
      throw error; // Re-throw so DataTable can handle the error
    }
  };

  // New function for DataTable delete integration
  const handleDeleteUser = async (userId) => {
    console.log("=== handleDeleteUser STARTED ===");
    console.log("handleDeleteUser called with userId:", userId);

    if (!userId) {
      console.error("No user ID available for deletion");
      throw new Error("No user ID provided");
    }

    console.log("Starting delete process for user ID:", userId);

    try {
      let endpoint = "";
      const token = localStorage.getItem("authToken");
      console.log("Active tab:", activeTab);
      console.log("Using token:", token ? "Token exists" : "No token found");

      // Determine endpoint based on active tab
      switch (activeTab) {
        case "Recruiter":
          endpoint = `${baseURL}/api/companies/recruiters/${userId}/`;
          break;
        case "Hiring Agency":
          endpoint = `${baseURL}/api/hiring_agency/${userId}/`;
          break;
        case "Company":
          endpoint = `${baseURL}/api/companies/${userId}/`;
          break;
        default:
          console.error("Invalid tab for delete operation:", activeTab);
          throw new Error("Invalid tab for delete operation.");
      }

      console.log("Sending DELETE request to:", endpoint);
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Delete failed with status:",
          response.status,
          "Response:",
          errorText
        );
        throw new Error(
          `Failed to delete user: ${response.status} - ${errorText}`
        );
      }

      console.log("Delete successful, refreshing data...");
      // Refresh the data after successful deletion
      const fetchPromises = [];

      if (activeTab === "Recruiter") {
        fetchPromises.push(dispatch(fetchRecruiters()));
      } else if (activeTab === "Hiring Agency") {
        fetchPromises.push(dispatch(fetchHiringAgencies()));
      } else if (activeTab === "Company") {
        fetchPromises.push(dispatch(fetchCompanies()));
      }

      // Wait for all fetches to complete
      await Promise.all(fetchPromises);

      notify.success("User deleted successfully!");
      console.log("Data refresh complete");
    } catch (error) {
      console.error("Error in handleDeleteUser:", error);
      notify.error(error.message || "Failed to delete user");
      throw error; // Re-throw so DataTable can handle the error
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

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "status-badge active";
      case "inactive":
        return "status-badge inactive";
      case "on hold":
        return "status-badge on-hold";
      default:
        return "status-badge";
    }
  };

  // If user doesn't have permission, show access denied
  const normalizedUserRole = String(userRole || "")
    .toLowerCase()
    .trim()
    .replace(/ /g, "_");
  const allowedRoles = ["admin", "company", "hiring_agency"];

  if (!allowedRoles.includes(normalizedUserRole)) {
    return (
      <div className="hiring-agencies-container">
        <div className="permission-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
          <p>
            Please contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Define table headers based on the active tab
  const getTableHeaders = () => {
    if (activeTab === "Company") {
      return (
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Status</th>
          <th className="text-center">Actions</th>
        </tr>
      );
    } else if (activeTab === "Hiring Agency") {
      return (
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Company Name</th>
          <th>Role</th>
          <th>Status</th>
          <th>Permission Granted</th>
          <th className="text-center">Actions</th>
        </tr>
      );
    } else {
      // Default for Recruiter and Admin
      return (
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
          <th>Role</th>
          <th className="text-center">Actions</th>
        </tr>
      );
    }
  };

  // Define table rows based on the active tab
  const renderTableRows = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan="100%" className="text-center py-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </td>
        </tr>
      );
    }

    if (currentRecords.length === 0) {
      return (
        <tr>
          <td colSpan="100%" className="text-center py-8 text-gray-500">
            No {activeTab.toLowerCase()} found
          </td>
        </tr>
      );
    }

    return currentRecords.map((item) => (
      <tr key={item.id}>
        {editingUserId === item.id ? (
          // Edit Mode
          <>
            {activeTab === "Company" ? (
              <>
                <td>
                  <input
                    type="text"
                    name="name"
                    value={editedUserData?.name || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="description"
                    value={editedUserData?.description || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <select
                    name="is_active"
                    value={editedUserData?.is_active || false}
                    onChange={(e) =>
                      setEditedUserData((prev) => ({
                        ...prev,
                        is_active: e.target.value === "true",
                      }))
                    }
                    style={formInputStyle}
                    className="form-input"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </td>
              </>
            ) : activeTab === "Hiring Agency" ? (
              <>
                <td>
                  <input
                    type="text"
                    name="name"
                    value={editedUserData?.name || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={editedUserData?.email || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="tel"
                    name="phone"
                    value={editedUserData?.phone || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    name="company_name"
                    value={editedUserData?.company_name || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>{item.role}</td>
                <td>
                  <select
                    name="status"
                    value={editedUserData?.status || "Active"}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td>{item.lastUpdated || "-"}</td>
              </>
            ) : (
              // Default for Recruiter and Admin
              <>
                <td>
                  <input
                    type="text"
                    name="name"
                    value={editedUserData?.name || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="email"
                    name="email"
                    value={editedUserData?.email || ""}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  />
                </td>
                <td>
                  <select
                    name="status"
                    value={editedUserData?.status || "Active"}
                    onChange={handleEditedInputChange}
                    style={formInputStyle}
                    className="form-input"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td>{item.role}</td>
              </>
            )}
            <td className="action-menu">
              <div className="action-buttons">
                <button
                  onClick={handleSaveEdit}
                  className="action-button save"
                  title="Save changes"
                >
                  <FaSave />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="action-button cancel"
                  title="Cancel"
                >
                  <FaTimes />
                </button>
              </div>
            </td>
          </>
        ) : (
          // View Mode
          <>
            {activeTab === "Company" ? (
              <>
                <td>{item.name}</td>
                <td>{item.description || "-"}</td>
                <td>
                  <span className={getStatusBadgeClass(item.status)}>
                    {item.status}
                  </span>
                </td>
              </>
            ) : activeTab === "Hiring Agency" ? (
              <>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone || "-"}</td>
                <td>{item.company_name || "-"}</td>
                <td>{item.role}</td>
                <td>
                  <span
                    className={`status-badge ${
                      item.status === "Active"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>{item.lastUpdated || "-"}</td>
              </>
            ) : (
              // Default for Recruiter and Admin
              <>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>
                  <span
                    className={`status-badge ${
                      item.status === "Active"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td>{item.role}</td>
              </>
            )}
            <td>
              <div className="action-buttons">
                <button
                  onClick={() => handleViewClick(item)}
                  className="action-button"
                  title="View"
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 2px"
                  }}
                >
                  <FaEye />
                </button>
                <button
                  onClick={() => handleEditClick(item)}
                  className="action-button"
                  title="Edit"
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 2px"
                  }}
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="action-button"
                  title="Delete"
                  style={{
                    width: "32px",
                    height: "32px",
                    padding: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 2px"
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            </td>
          </>
        )}
      </tr>
    ));
  };

  // Check if any modal is open for blur effect
  const isAnyModalOpen = showAddModal || showDeleteConfirm;

  return (
    <>
      <div className={`hiring-agencies-container ${isAnyModalOpen ? 'blur-background' : ''}`}>
      <div className="hiring-agencies-card">
        {/* Tabs */}
        <div className="hiring-agencies-tabs-container">
          <div className="hiring-agency-tabs">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                className={`hiring-agency-tab ${
                  activeTab === tab ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab)}
                disabled={isLoading}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Dynamic "Add New" button visible only for ADMIN or COMPANY */}
          {["ADMIN", "COMPANY"].includes(userRole) && (
            <button
              className="add-agency-btn"
              onClick={() => setShowAddModal(true)}
              disabled={isLoading}
            >
              {getAddButtonText()}
            </button>
          )}
        </div>

      {/* DataTable */}
      <DataTable
        title={
          activeTab === "Recruiter"
            ? "Recruiters"
            : activeTab === "Hiring Agency"
            ? "Hiring Agencies"
            : activeTab === "Company"
            ? "Companies"
            : "Admins"
        }
        columns={getTableColumns()}
        data={currentRecords || []}
        loading={isLoading}
        actions={["edit", "delete"]}
        onAction={(action, rowData, rowIndex) => {
          if (action === "edit") {
            setEditingUserId(rowData.id);
            setEditedUserData({ ...rowData });
          } else if (action === "delete") {
            // Handle delete directly with API call
            handleDeleteUser(rowData.id);
          }
        }}
        showRefresh={true}
        onRefresh={() => {
          // Refresh data based on active tab
          if (activeTab === "Recruiter") {
            dispatch(fetchRecruiters());
          } else if (activeTab === "Hiring Agency") {
            dispatch(fetchHiringAgencies());
          } else if (activeTab === "Company") {
            dispatch(fetchCompanies());
          } else if (activeTab === "Admin") {
            dispatch(fetchAdmins());
          }
        }}
        showActions={true}
        defaultPageSize={recordsPerPage}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        editingRow={editingUserId !== null ? currentRecords.findIndex(item => item.id === editingUserId) : null}
        editingData={editedUserData}
        setEditingRow={(rowIndex) => {
          if (rowIndex === null) {
            setEditingUserId(null);
            setEditedUserData(null);
          } else {
            const item = currentRecords[rowIndex];
            setEditingUserId(item?.id || null);
            setEditedUserData(item ? { ...item } : null);
          }
        }}
        setEditingData={setEditedUserData}
        onEdit={async (data) => {
          try {
            await handleUpdateUser(data);
          } catch (error) {
            console.error("Error updating user:", error);
            throw error;
          }
        }}
      />

      </div>


      </div>

      {/* Modals outside the main container to avoid blur effect */}
      <FormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddUser}
        title={getAddButtonText()}
        submitText="Add User"
        size="medium"
    >
      <div className="form-group">
        <label htmlFor="username">Username *</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          required
          placeholder="Enter username"
        />
      </div>

      <div className="form-group">
        <label htmlFor="full_name">Full Name *</label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          required
          placeholder="Enter full name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          required
          placeholder="Enter email address"
        />
      </div>

      <div className="form-group">
        <label htmlFor="company_name">Company Name</label>
        <input
          type="text"
          id="company_name"
          name="company_name"
          value={formData.company_name}
          onChange={handleInputChange}
          placeholder="Enter company name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role *</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleInputChange}
          required
        >
          <option value="">Select a role</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password *</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          required
          placeholder="Enter password"
        />
      </div>
      </FormModal>
    </>
  );
};

export default HiringAgencies;
