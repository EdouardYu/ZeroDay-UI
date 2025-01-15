import {
  FunctionComponent,
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthService, UserService } from "@/services";
import "@/pages/authentication/Auth.css";
import axios from "axios";

const Signup: FunctionComponent = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstname: "",
    lastname: "",
    birthday: "",
    gender: "",
    nationality: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showActivationPopup, setShowActivationPopup] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [activationError, setActivationError] = useState<string | null>(null);

  const [genderOptions, setGenderOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [nationalityOptions, setNationalityOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const options = await UserService.getOptions();
        setGenderOptions(
          options.genders.map((gender: string) => ({
            value: gender,
            label: gender.charAt(0).toUpperCase() + gender.slice(1),
          }))
        );
        setNationalityOptions(
          options.nationalities.map((nationality: string) => ({
            value: nationality,
            label: nationality.charAt(0).toUpperCase() + nationality.slice(1),
          }))
        );
      } catch {
        setGlobalError("Failed to fetch options, please try again later.");
      }
    };

    fetchOptions();
  }, []);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!#$%&*+<=>?@^_-]).{8,128}$/;
    const nameRegex = /^[\p{L} '-]+$/u;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email should be valid";
    }
    if (!passwordRegex.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (! # $ % & * + - < = > ? @ ^ _)";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!nameRegex.test(formData.firstname) || formData.firstname.length > 64) {
      newErrors.firstname =
        "Firstname can only contain letters, spaces, hyphens, and apostrophes and must be at most 64 characters long";
    }
    if (!nameRegex.test(formData.lastname) || formData.lastname.length > 64) {
      newErrors.lastname =
        "Lastname can only contain letters, spaces, hyphens, and apostrophes and must be at most 64 characters long";
    }
    if (new Date(formData.birthday) >= new Date()) {
      newErrors.birthday = "Birthday cannot be in the future";
    }
    if (!formData.gender) {
      newErrors.gender = "You must select a gender";
    }
    if (!formData.nationality) {
      newErrors.nationality = "You must select a nationality";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    if (!validateForm()) return;

    try {
      await AuthService.signup(formData);
      setShowActivationPopup(true);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("Signup failed, please try again later");
    }
  };

  const handleActivate = async () => {
    try {
      await AuthService.activate({
        email: formData.email,
        code: activationCode,
      });
      setShowActivationPopup(false);
      navigate("/authentication/login");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setActivationError(error.response.data.message);
      else setActivationError("Activation failed, please try again later");
    }
  };

  const handleResendActivationCode = async () => {
    try {
      await AuthService.resendActivationCode(formData.email);
      setActivationError("Activation code resent successfully");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setActivationError(error.response.data.message);
      else
        setActivationError(
          "Failed to resend activation code, please try again later"
        );
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Signup</h2>
        {globalError && <div className="error global-error">{globalError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </label>
            <label>
              Birthday:
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                required
              />
              {errors.birthday && (
                <span className="error">{errors.birthday}</span>
              )}
            </label>
          </div>
          <div className="form-group">
            <label>
              Password:
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {errors.password && (
                <span className="error">{errors.password}</span>
              )}
            </label>
            <label>
              Confirm Password:
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
              {errors.confirmPassword && (
                <span className="error">{errors.confirmPassword}</span>
              )}
            </label>
          </div>
          <div className="form-group">
            <label>
              Firstname:
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                required
              />
              {errors.firstname && (
                <span className="error">{errors.firstname}</span>
              )}
            </label>
            <label>
              Lastname:
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                required
              />
              {errors.lastname && (
                <span className="error">{errors.lastname}</span>
              )}
            </label>
          </div>
          <div className="form-group">
            <label>
              Gender:
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.gender && <span className="error">{errors.gender}</span>}
            </label>
            <label>
              Nationality:
              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Nationality</option>
                {nationalityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.nationality && (
                <span className="error">{errors.nationality}</span>
              )}
            </label>
          </div>
          <button type="submit">Signup</button>
        </form>
        <div className="auth-links">
          <p>
            Already have an account?{" "}
            <Link to="/authentication/login">Login here</Link>
          </p>
          <p>
            <Link to="/authentication/password/reset">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
      {showActivationPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Activate Account</h3>
            {activationError && (
              <div className="error global-error">{activationError}</div>
            )}
            <label>
              Activation Code:
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                required
              />
            </label>
            <div className="popup-buttons">
              <button className="submit-button" onClick={handleActivate}>
                Activate
              </button>
              <button
                className="submit-button"
                onClick={handleResendActivationCode}
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
