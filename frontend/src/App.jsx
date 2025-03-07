import { Navigate, Route, Routes } from "react-router-dom";
import React, { useContext } from "react";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import LoginPage from "./pages/auth/login/LoginPage";
import HomePage from "./pages/home/HomePage";
import Sidebar from "./components/common/SideBar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { Toaster } from "react-hot-toast";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { UserContext } from "./context/UserContextProvider";

function App() {
  const { user, isLoading } = useContext(UserContext);
  //const isLoading = false;

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex max-w-6xl mx-auto">
      {user && <Sidebar />}
      <Routes>
        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!user ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/notification"
          element={user ? <NotificationPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/:username"
          element={user ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
      {user && <RightPanel />}
      <Toaster />
    </div>
  );
}

export default App;
