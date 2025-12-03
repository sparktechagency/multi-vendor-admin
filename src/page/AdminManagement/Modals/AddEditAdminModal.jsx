import { Modal } from "antd";
import { useEffect, useState } from "react";

export default function AddEditAdminModal({
  open,
  onCancel,
  onAddEdit,
  loading,
  selectedAdmin,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isEditMode = selectedAdmin !== null;

  useEffect(() => {
    if (open && isEditMode) {
      setName(selectedAdmin.name || "");
      setEmail(selectedAdmin.email || "");
      setPassword(""); // Password should not be pre-filled for security
      setConfirmPassword("");
    } else if (open && !isEditMode) {
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    }
  }, [open, isEditMode, selectedAdmin]);

  const handleSave = () => {
    if (!name || !email) {
      alert("Name and Email are required.");
      return;
    }

    if (!isEditMode && (!password || !confirmPassword)) {
      alert("Password and Confirm Password are required for new admin.");
      return;
    }

    if (!isEditMode && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const values = { name, email };
    if (!isEditMode) {
      values.password = password;
    }
    onAddEdit(values);
  };

  return (
    <Modal open={open} centered onCancel={onCancel} footer={null}>
      <div className="p-5">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {isEditMode ? "Edit Admin" : "Add Admin"}
          </h2>
          <p className="text-gray-600">
            {isEditMode
              ? "Edit the admin details below"
              : "Add a new admin below"}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-800 mb-2">Admin Name</label>
          <input
            type="text"
            placeholder="Enter Name here"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-800 mb-2">Email</label>
          <input
            type="email"
            placeholder="Enter Email here"
            className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {!isEditMode && (
          <>
            <div className="mb-4">
              <label className="block text-gray-800 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter Password here"
                className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-800 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm Password here"
                className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={onCancel}
            className="py-2 px-4 rounded-lg border border-[#EF4444] bg-red-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`py-2 px-4 rounded-lg bg-green-600 text-white ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
