import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContextProvider";

function ProtectedRoute({ children }) {
  const { user } = useContext(UserContext);

  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
