import { FunctionComponent, useState, ChangeEvent, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "@/services/AuthService";
import "@/pages/authentication/Auth.css";
import axios from "axios";

const ResetPassword: FunctionComponent = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    activationCode: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!#$%&*+<=>?@^_-]).{8,128}$/;

    if (!passwordRegex.test(form.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (! # $ % & * + - < = > ? @ ^ _)";
    }
    if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!form.activationCode) {
      newErrors.activationCode = "Activation code cannot be empty";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitEmail = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    try {
      await AuthService.sendResetPasswordEmail(form.email);
      setStep(2);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("An error occurred, please try again later");
    }
  };

  const handleSubmitPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);

    if (!validateForm()) return;

    try {
      await AuthService.resetPassword({
        email: form.email,
        password: form.newPassword,
        code: form.activationCode,
      });
      navigate("/authentication/login");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("An error occurred, please try again later");
    }
  };

  const handleResendEmail = async () => {
    setGlobalError(null);
    try {
      await AuthService.sendResetPasswordEmail(form.email);
      setGlobalError("Activation code resent successfully");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else
        setGlobalError(
          "Failed to resend activation code, please try again later"
        );
    }
  };

  const handleChangeEmail = () => {
    setStep(1);
    setForm({ ...form, email: "" });
    setGlobalError(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {step === 1 ? (
          <form onSubmit={handleSubmitEmail}>
            <h2>Reset Password</h2>
            {globalError && (
              <div className="error global-error">{globalError}</div>
            )}
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                required
              />
            </label>
            <button type="submit">Send Activation Code</button>
            <div className="auth-links">
              <p>
                Remember your password?{" "}
                <Link to="/authentication/login">Return to login</Link>
              </p>
              <p>
                Don't have an account?{" "}
                <Link to="/authentication/signup">Sign up</Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitPassword}>
            <h2>Reset Password</h2>
            {globalError && (
              <div className="error global-error">{globalError}</div>
            )}
            <label>
              Email:
              <input type="email" value={form.email} readOnly />
            </label>
            <div className="button-group">
              <button type="button" onClick={handleResendEmail}>
                Resend Email
              </button>
              <button type="button" onClick={handleChangeEmail}>
                Change Email
              </button>
            </div>
            <label>
              Activation Code:
              <input
                type="text"
                name="activationCode"
                value={form.activationCode}
                onChange={handleInputChange}
                required
              />
              {errors.activationCode && (
                <span className="error">{errors.activationCode}</span>
              )}
            </label>
            <label>
              New Password:
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleInputChange}
                required
              />
              {errors.newPassword && (
                <span className="error">{errors.newPassword}</span>
              )}
            </label>
            <label>
              Confirm New Password:
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </label>
            <button type="submit">Reset Password</button>
            <div className="auth-links">
              <p>
                Remember your password?{" "}
                <Link to="/authentication/login">Return to login</Link>
              </p>
              <p>
                Don't have an account?{" "}
                <Link to="/authentication/signup">Sign up</Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
