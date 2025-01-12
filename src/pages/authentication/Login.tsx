import { FunctionComponent, useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "@/services/AuthService";
import "@/pages/authentication/Auth.css";
import axios from "axios";

const Login: FunctionComponent = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [globalError, setGlobalError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    try {
      const data = await AuthService.signin(credentials);
      localStorage.setItem("authToken", data.bearer);
      navigate("/");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      ) {
        setGlobalError(error.response.data.message);
      } else {
        setGlobalError("Login failed, please try again later");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        {globalError && <div className="error global-error">{globalError}</div>}
        <form onSubmit={handleSubmit}>
          <label>
            Email:
            <input
              type="text"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Password:
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
            />
          </label>
          <button type="submit">Login</button>
        </form>
        <div className="auth-links">
          <p>
            Don't have an account?{" "}
            <Link to="/authentication/signup">Sign up here</Link>
          </p>
          <p>
            <Link to="/authentication/password/reset">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
