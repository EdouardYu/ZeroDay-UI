import { FunctionComponent, ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface GuardProps {
  children: ReactNode;
}

const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem("authToken");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("authToken");
    return false;
  }
};

export const AuthGuard: FunctionComponent<GuardProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/authentication/login" />;
  }

  return <>{children}</>;
};

export const PublicGuard: FunctionComponent<GuardProps> = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};
