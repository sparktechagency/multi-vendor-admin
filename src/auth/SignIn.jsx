import "antd/dist/reset.css";
import Swal from "sweetalert2";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import BrandLogo from "../shared/BrandLogo";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { setUser } from "../Redux/Slice/authSlice";
import { useDispatch } from "react-redux";
import { useLogInMutation } from "../Redux/api/auth/authApi";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [logIn, { isLoading }] = useLogInMutation();
  const dispatch = useDispatch();

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: !email ? "Email is required" : "Password is required",
      });
      return;
    }
    const loginData = { email, password };
    try {
      const response = await logIn(loginData).unwrap();
      console.log(response);
      if (response?.data?.accessToken) {
        dispatch(
          setUser({
            user: response?.data?.user || {},
            token: response?.data?.accessToken,
          })
        );
      }

      Swal.fire({
        icon: "success",
        title: "Login successful",
        text: response?.message || "You are now logged in.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: error?.data?.message || "Something went wrong!",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 bg-white">
      <div className="relative w-full max-w-xl px-5 py-20 text-center bg-white shadow-lg rounded-2xl">
        <BrandLogo
          status="Login to your account"
          information="please enter your email and password to continue."
        />
        <form className="space-y-5" onSubmit={handleSignIn}>
          <div className="w-full">
            <label className="flex justify-start mb-2 text-xl text-gray-800 text-start">
              Email address
            </label>
            <input
              type="email"
              name="email"
              defaultValue="techandtech360@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-5 py-3 bg-white text-gray-600 border-2 border-[#FF914C] rounded-lg outline-none mt-5 placeholder:text-gray-600"
              required
            />
          </div>
          <div className="w-full">
            <label className="flex justify-start mb-2 text-xl text-gray-800 text-start">
              Password
            </label>
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                defaultValue="securepass"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="**********"
                className="w-full px-5 py-3 bg-white text-gray-600 border-2 border-[#FF914C] rounded-lg outline-none mt-5 placeholder:text-gray-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute flex items-center text-gray-400 right-3 bottom-4"
              >
                {showPassword ? (
                  <IoEyeOffOutline className="w-5 h-5 text-[#FF914C]" />
                ) : (
                  <IoEyeOutline className="w-5 h-5 text-[#FF914C]" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end my-5 text-xs">
            <Link
              to="/forget-password"
              className="text-[#FF914C] text-sm hover:text-[#FF914C]/80"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="flex items-center justify-center text-white">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#FF914C] font-semibold py-3 px-6 rounded-lg shadow-lg cursor-pointer mt-5 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
