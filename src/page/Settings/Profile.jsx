import { useEffect, useState } from "react";
import { FaCamera } from "react-icons/fa";
import EditProfile from "./EditProfile";
import ChangePass from "./ChangePass";
import PageHeading from "../../shared/PageHeading";
import {
  useGetAdminProfileQuery,
  useUpdateProfileMutation,
} from "../../Redux/api/profileApi";

function ProfilePage() {
  const [activeTab, setActiveTab] = useState("editProfile");
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const { data: getAdminProfile } = useGetAdminProfileQuery();
  // console.log("getAdminProfile", getAdminProfile);
  const [updateProfile] = useUpdateProfileMutation();

  // Prefill form when profile loads
  useEffect(() => {
    const p = getAdminProfile?.data?.user || getAdminProfile;
    if (p) {
      setImage(p?.image || "");
      setName(p?.name || "");
    }
  }, [getAdminProfile]);

  // Build preview URL when a new file is selected
  useEffect(() => {
    if (image && typeof image !== "string") {
      const url = URL.createObjectURL(image);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [image]);

  // Auto-upload image when changed (no button needed)
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setImage(file);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await updateProfile(fd).unwrap();
      // Try to use returned image URL immediately to avoid cache issues
      const updated = res?.data?.user || res?.user || res;
      const newUrl = updated?.image?.url || updated?.image;
      if (typeof newUrl === "string") {
        setImage(newUrl);
        setPreviewUrl(null);
      }
      // Ensure fresh data is pulled
      await refetch();
    } catch (_) {
      // Optionally handle error UI here
    }
    // allow re-selecting the same file by clearing the input value
    e.target.value = "";
  };

  // Helper to break cache when server returns same URL
  const cacheBust = (url) => {
    if (!url || typeof url !== "string") return url;
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}t=${Date.now()}`;
  };

  return (
    <div className="overflow-y-auto">
      <div className="h-full px-5 pb-5">
        <PageHeading title=" Admin Profile" />
        <div className="flex flex-col items-center justify-center mx-auto">
          {/* Profile Picture Section */}
          <div className="flex flex-col justify-center items-center mt-5 text-gray-800 w-[900px] mx-auto p-5 gap-5 rounded-lg">
            <div className="relative">
              <div className="w-[122px] h-[122px] bg-gray-300 rounded-full border-4 border-white shadow-xl flex justify-center items-center overflow-hidden">
                <img
                  src={
                    previewUrl ||
                    cacheBust(typeof image === "string" ? image : getAdminProfile?.data?.user?.image) ||
                    "https://avatar.iran.liara.run/public/13"
                  }
                  alt="profile"
                  className="object-cover w-full h-full"
                />
                {/* Upload Icon */}
                <div className="absolute p-2 bg-white rounded-full shadow-md cursor-pointer bottom-2 right-2">
                  <label htmlFor="profilePicUpload" className="cursor-pointer">
                    <FaCamera className="text-[#FF914C]" />
                  </label>
                  <input
                    type="file"
                    id="profilePicUpload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-center md:text-3xl">{name || "-"}</p>
            </div>
          </div>

          {/* Tab Navigation Section */}
          <div className="flex items-center justify-center gap-5 my-5 font-semibold text-md md:text-xl">
            <p
              onClick={() => setActiveTab("editProfile")}
              className={`cursor-pointer pb-1 ${
                activeTab === "editProfile"
                  ? "text-[#0B704E] border-b-2 border-[#0B704E]"
                  : "text-[#6A6D76]"
              }`}
            >
              Edit Profile
            </p>
            <p
              onClick={() => setActiveTab("changePassword")}
              className={`cursor-pointer pb-1 ${
                activeTab === "changePassword"
                  ? "text-[#0B704E] border-b-2 border-[#0B704E]"
                  : "text-[#6A6D76]"
              }`}
            >
              Change Password
            </p>
          </div>

          {/* Tab Content Section */}
          <div className="flex items-center justify-center p-5 rounded-md">
            <div className="w-full max-w-3xl">
              {activeTab === "editProfile" && <EditProfile />}
              {activeTab === "changePassword" && <ChangePass />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
