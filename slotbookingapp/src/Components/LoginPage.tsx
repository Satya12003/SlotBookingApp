import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const generateOtp = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5012/api/send-otp",
        { email }
      );
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Error generating OTP");
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5012/api/verify-otp",
        { email, otp }
      );
      setMessage(response.data.message);
      if (response.data.verified) {
        localStorage.setItem("authToken",response.data.authToken)
        navigate('/home');
      }
    } catch (error) {
      setMessage("Error verifying OTP");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200 text-black">
      <h1 className="text-xl font-bold mb-2">Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-1 border rounded"
      />
      <button
        onClick={generateOtp}
        className="mb-2 p-1 bg-blue-500 text-white rounded"
      >
        Generate OTP
      </button>
      <input
        type="text"
        placeholder="OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="mb-2 p-1 border rounded"
      />
      <button
        onClick={verifyOtp}
        className="mb-2 p-1 bg-green-500 text-white rounded"
      >
        Verify OTP
      </button>
      <p>{message}</p>
    </div>
  );
};

export default LoginPage;
