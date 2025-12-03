import { useEffect, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { MdBlockFlipped } from "react-icons/md";
import PageHeading from "../../shared/PageHeading";
import { ConfigProvider, Table } from "antd";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useDeleteUserMutation,
} from "../../Redux/api/user/userApi";
import Loader from "../../components/common/Loader";
import Swal from "sweetalert2";
import { FiTrash2 } from "react-icons/fi";

export default function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: users, isFetching } = useGetAllUsersQuery({
    page: 1,
    limit: 100000,
  });

  const pageSize = 10;
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const customerList =
    users?.data?.users?.filter((u) => {
      const role = (u?.role || "").toString().toLowerCase().trim();
      return role === "customer";
    }) || users?.data?.users;

  const searchTerm = search.trim().toLowerCase();
  const filteredUsers = (customerList || []).filter((u) => {
    if (!searchTerm) return true;
    const name = (u?.name || "").toString().toLowerCase();
    return name.includes(searchTerm);
  });

  const totalItems = filteredUsers.length;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const dataSource = paginatedUsers?.map((user, index) => ({
    key: startIndex + index + 1,
    no: startIndex + index + 1,
    id: user?.id || user?._id,
    country: user?.country,
    currency: user?.currency,
    email: user?.email,
    name: user?.name,
    phone: user?.phone,
    isBlocked: user?.isBlocked,
  }));

  const columns = [
    { title: "No", dataIndex: "no", key: "no" },
    {
      title: "User Name",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <span>{record.name}</span>
        </div>
      ),
    },
    { title: "Phone Number", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Country", dataIndex: "country", key: "country" },
    { title: "Currency", dataIndex: "currency", key: "currency" },
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
          <button
            onClick={() => handleBlockToggle(record)}
            disabled={isBlocking}
            className={` rounded-lg p-2 bg-[#d3e8e6] transition duration-200 ${isBlocking ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <MdBlockFlipped
              className={`w-6 h-6 ${record?.isBlocked ? "text-red-600 " : "text-[#14803c]"
                }`}
            />
          </button>
          <button
            onClick={() => handleDeleteUser(record)}
            disabled={isDeleting}
            className={`rounded-lg p-2 bg-red-200 transition duration-200 ${isDeleting ? "opacity-60 cursor-not-allowed" : ""
              }`}
          >
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  const handleBlockToggle = async (user) => {
    if (!user?.id) {
      return;
    }

    const willBlock = !user.isBlocked;
    const result = await Swal.fire({
      title: willBlock ? "Block user?" : "Unblock user?",
      text: `Are you sure you want to ${willBlock ? "block" : "unblock"} ${user?.name || "this user"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: willBlock ? "Block" : "Unblock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#14803c",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await blockUser({
        id: user.id,
        isBlocked: willBlock,
      }).unwrap();
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: `User ${willBlock ? "blocked" : "unblocked"} successfully`,
        confirmButtonColor: "#14803c",
      });
    } catch (_) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Something went wrong. Please try again.",
      });
    }
  };

  const handleDeleteUser = async (user) => {
    if (!user?.id) {
      return;
    }

    const result = await Swal.fire({
      title: "Delete user?",
      text: `Are you sure you want to delete ${
        user?.name || "this user"
      } permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await deleteUser(user.id).unwrap();
      await Swal.fire({
        icon: "success",
        title: "Success",
        text: `User deleted successfully`,
        confirmButtonColor: "#14803c",
      });
    } catch (_) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Something went wrong. Please try again.",
      });
    }
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
        <PageHeading title="User Management" />
        <div className="relative w-full sm:w-[300px] mt-5 md:mt-0 lg:mt-0">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-2 border-[#14803c] py-3 pl-12 pr-[65px] outline-none w-full rounded-md"
          />
          <span className="absolute top-0 left-0 flex items-center justify-center h-full px-5 text-gray-600 cursor-pointer rounded-r-md">
            <IoSearch className="text-[1.3rem]" />
          </span>
        </div>
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
    </>
  );
}
