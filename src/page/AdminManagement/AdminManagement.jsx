import { useEffect, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { MdBlockFlipped, MdEdit } from "react-icons/md";
import PageHeading from "../../shared/PageHeading";
import { ConfigProvider, Table } from "antd";
import Loader from "../../components/common/Loader";
import Swal from "sweetalert2";
import {
  useGetAdminsQuery,
  useBlockAdminMutation,
  useDeleteAdminMutation,
  useAddAdminMutation,
  useUpdateAdminMutation,
} from "../../Redux/api/admin/adminApi";
import AddEditAdminModal from "./Modals/AddEditAdminModal";
import DeleteAdminModal from "./Modals/DeleteAdminModal";
import BlockAdminModal from "./Modals/BlockAdminModal";
import { FiTrash2 } from "react-icons/fi";
import { useSelector } from "react-redux";

export default function AdminManagement() {
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const { data: admins, isFetching } = useGetAdminsQuery({
    page: 1,
    limit: 100000,
  });

  const [blockAdmin, { isLoading: isBlocking }] = useBlockAdminMutation();
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation();
  const [addAdmin, { isLoading: isAdding }] = useAddAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();

  const searchTerm = search.trim().toLowerCase();
  const filteredAdmins = (admins?.data?.users || []).filter((admin) => {
    if (!searchTerm) return true;
    const name = (admin?.name || "").toString().toLowerCase();
    const email = (admin?.email || "").toString().toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  });

  const totalItems = filteredAdmins.length;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

  const dataSource = paginatedAdmins?.map((admin, index) => ({
    key: startIndex + index + 1,
    no: startIndex + index + 1,
    id: admin?.id || admin?._id,
    email: admin?.email,
    name: admin?.name,
    isBlocked: admin?.isBlocked,
  }));

  const columns = [
    { title: "No", dataIndex: "no", key: "no" },
    {
      title: "Admin Name",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Status",
      dataIndex: "isBlocked",
      key: "isBlocked",
      render: (v) => (
        <span className={v ? "text-red-600" : ""}>
          {v ? "Blocked" : "Active"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          {/* <button
            onClick={() => handleAddEditAdmin(record)}
            className="p-2 transition duration-200 bg-blue-200 rounded-lg"
          >
            <MdEdit className="w-6 h-6 text-blue-600" />
          </button>
          <button
            onClick={() => handleBlockToggle(record)}
            disabled={isBlocking}
            className={`rounded-lg p-2 bg-[#d3e8e6] transition duration-200 ${
              isBlocking ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <MdBlockFlipped
              className={`w-6 h-6 ${record?.isBlocked ? "text-red-600 " : "text-[#14803c]"
                }`}
            />
          </button> */}
          <button
            onClick={() => handleDeleteAdmin(record)}
            disabled={
              isDeleting ||
              loggedInUser?._id === record.id ||
              loggedInUser?.id === record.id
            }
            className={`rounded-lg p-2 bg-red-200 transition duration-200 ${
              isDeleting ||
              loggedInUser?._id === record.id ||
              loggedInUser?.id === record.id
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
          >
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const handleAddEditAdmin = (admin = null) => {
    setSelectedAdmin(admin);
    setAddEditModalOpen(true);
  };

  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setDeleteModalOpen(true);
  };

  const handleBlockToggle = (admin) => {
    setSelectedAdmin(admin);
    setBlockModalOpen(true);
  };


  useEffect(() => {
    setPage(1);
  }, [search]);

  if (isFetching) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-between gap-5 my-5 md:my-10 md:flex-row">
        <PageHeading title="Admin Management" />
        {/* <div className="relative w-full sm:w-[300px] mt-5 md:mt-0 lg:mt-0">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-[#14803c] py-3 pl-12 pr-[65px] outline-none w-full rounded-md"
          />
          <span className="absolute top-0 left-0 flex items-center justify-center h-full px-5 text-gray-600 cursor-pointer rounded-r-md">
            <IoSearch className="text-[1.3rem]" />
          </span>
        </div> */}
        <button
          onClick={() => handleAddEditAdmin()}
          className="bg-[#14803c] text-white px-4 py-3 rounded-lg hover:bg-[#14803c]/80"
        >
          + Add New Admin
        </button>
      </div>
      <ConfigProvider
        theme={{
          components: {
            InputNumber: {
              activeBorderColor: "#14803c",
            },
            Pagination: {
              colorPrimaryBorder: "rgb(82,196,26)",
              colorBorder: "rgb(82,196,26)",
              colorTextPlaceholder: "rgb(82,196,26)",
              colorTextDisabled: "rgb(82,196,26)",
              colorBgTextActive: "rgb(82,196,26)",
              itemActiveBgDisabled: "rgb(82,196,26)",
              itemActiveColorDisabled: "rgb(0,0,0)",
              itemBg: "rgb(82,196,26)",
              colorBgTextHover: "rgb(82,196,26)",
              colorPrimary: "rgb(82,196,26)",
              colorPrimaryHover: "rgb(82,196,26)",
            },
            Table: {
              headerBg: "#14803c",
              headerColor: "rgb(255,255,255)",
              cellFontSize: 16,
              headerSplitColor: "#14803c",
            },
          },
        }}
      >
        <Table
          dataSource={dataSource}
          columns={columns}
          loading={isFetching}
          pagination={{
            current: page,
            pageSize,
            total: totalItems,
            showSizeChanger: false,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: "max-content" }}
        />
      </ConfigProvider>

      {/* Modals */}
      <AddEditAdminModal
        open={addEditModalOpen}
        onCancel={() => setAddEditModalOpen(false)}
        selectedAdmin={selectedAdmin}
        onAddEdit={async (values) => {
          try {
            if (selectedAdmin) {
              await updateAdmin({ id: selectedAdmin.id, ...values }).unwrap();
            } else {
              await addAdmin({ ...values, role: "admin" }).unwrap();
            }
            Swal.fire({
              icon: "success",
              title: "Success",
              text: `Admin ${selectedAdmin ? "updated" : "added"} successfully`,
              confirmButtonColor: "#14803c",
            });
            setAddEditModalOpen(false);
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Failed",
              text: error?.data?.message || "Something went wrong. Please try again.",
            });
          }
        }}
        loading={isAdding || isUpdating}
      />

      <DeleteAdminModal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        admin={selectedAdmin}
        onDelete={async () => {
          try {
            await deleteAdmin(selectedAdmin.id).unwrap();
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Admin deleted successfully",
              confirmButtonColor: "#14803c",
            });
            setDeleteModalOpen(false);
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Failed",
              text: error?.data?.message || "Something went wrong. Please try again.",
            });
          }
        }}
        loading={isDeleting}
      />

      <BlockAdminModal
        open={blockModalOpen}
        onCancel={() => setBlockModalOpen(false)}
        admin={selectedAdmin}
        onBlockToggle={async () => {
          try {
            await blockAdmin({
              id: selectedAdmin.id,
              isBlocked: !selectedAdmin.isBlocked,
            }).unwrap();
            Swal.fire({
              icon: "success",
              title: "Success",
              text: `Admin ${selectedAdmin.isBlocked ? "unblocked" : "blocked"} successfully`,
              confirmButtonColor: "#14803c",
            });
            setBlockModalOpen(false);
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Failed",
              text: error?.data?.message || "Something went wrong. Please try again.",
            });
          }
        }}
        loading={isBlocking}
      />
    </>
  );
}
