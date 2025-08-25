import React, { useState, useRef, useEffect } from "react";
import {
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiDownload,
} from "react-icons/fi";

const ActionMenu = ({
  onEdit,
  onDelete,
  onView,
  onDownload,
  itemId,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = (action, id) => {
    console.log("handleAction called with:", { action, id });
    setIsOpen(false);
    if (typeof action === "function") {
      console.log("Calling action with ID:", id);
      action(id);
    } else {
      console.warn("Action is not a function:", action);
    }
  };

  return (
    <div className="action-menu" ref={menuRef}>
      <button
        className="menu-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Actions"
      >
        <FiMoreVertical size={18} />
      </button>

      {isOpen && (
        <div
          className="menu-dropdown show"
          onClick={(e) => e.stopPropagation()}
        >
          {onView && (
            <div
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onView, itemId);
              }}
            >
              <FiEye size={16} />
              <span>View</span>
            </div>
          )}
          {onEdit && (
            <div
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onEdit, itemId);
              }}
            >
              <FiEdit2 size={16} />
              <span>Edit</span>
            </div>
          )}
          {onDownload && (
            <div
              className="menu-item"
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDownload, itemId);
              }}
            >
              <FiDownload size={16} />
              <span>Download</span>
            </div>
          )}
          {onDelete && (
            <div
              className="menu-item text-red-600"
              onClick={(e) => {
                console.log("Delete clicked with itemId:", itemId);
                e.stopPropagation();
                e.preventDefault();
                handleAction(onDelete, itemId);
              }}
            >
              <FiTrash2 size={16} />
              <span>Delete</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
