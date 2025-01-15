import {
  FunctionComponent,
  useState,
  useEffect,
  ChangeEvent,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import UserService from "@/services/UserService";
import FileService from "@/services/FileService";
import "@/pages/profile/Profile.css";
import Loader from "@/components/loader/Loader";
import axios from "axios";
import { toCapitalizedWords } from "@/helpers/StringHelper";

interface ProfileProps {
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  birthday: string;
  gender: string;
  nationality: string;
  picture_url: string;
  bio: string;
  role: string;
}

interface EditableProfileProps {
  email: string;
  firstname: string;
  lastname: string;
  username: string;
  birthday: string;
  gender: string;
  nationality: string;
  picture_id: number | null;
  bio: string;
}

interface EditablePasswordChange {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

interface Option {
  value: string;
  label: string;
}

const initialProfile: ProfileProps = {
  email: "",
  firstname: "",
  lastname: "",
  username: "",
  birthday: "",
  gender: "",
  nationality: "",
  picture_url: "",
  bio: "",
  role: "",
};

const initialEditableProfile: EditableProfileProps = {
  email: "",
  firstname: "",
  lastname: "",
  username: "",
  birthday: "",
  gender: "",
  nationality: "",
  picture_id: null,
  bio: "",
};

const initialPasswordChange: EditablePasswordChange = {
  old_password: "",
  new_password: "",
  confirm_password: "",
};

const Profile: FunctionComponent = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileProps>(initialProfile);
  const [editableProfile, setEditableProfile] = useState<EditableProfileProps>(
    initialEditableProfile
  );
  const [profileImage, setProfileImage] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<{
    [key: string]: string;
  }>({});
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [passwords, setPasswords] = useState<EditablePasswordChange>(
    initialPasswordChange
  );
  const [genders, setGenders] = useState<Option[]>([]);
  const [nationalities, setNationalities] = useState<Option[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken");
  const currentUserId = token
    ? JSON.parse(atob(token.split(".")[1])).sub
    : null;
  const currentUserRole = token
    ? JSON.parse(atob(token.split(".")[1])).role
    : null;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        const profileData = await UserService.getProfile(id!);
        setProfile(profileData);
        setEditableProfile({
          ...profileData,
          picture_id: null,
        });

        const blob = await FileService.getFile(profileData.picture_url);
        const imageUrl = URL.createObjectURL(blob);

        if (profileImage) URL.revokeObjectURL(profileImage);

        setProfileImage(imageUrl);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status !== 500
        )
          setGlobalError("User not found");
        else setGlobalError("Failed to fetch profile, please try again later");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchOptions = async () => {
      try {
        const options = await UserService.getOptions();
        setGenders(
          options.genders.map((gender: string) => ({
            value: gender,
            label: toCapitalizedWords(gender),
          }))
        );
        setNationalities(
          options.nationalities.map((nationality: string) => ({
            value: nationality,
            label: toCapitalizedWords(nationality),
          }))
        );
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status !== 500
        )
          setGlobalError(error.response.data.message);
        else setGlobalError("Failed to fetch options, please try again later");
      }
    };

    fetchProfile();
    fetchOptions();
    return () => {
      if (profileImage) URL.revokeObjectURL(profileImage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableProfile({ ...editableProfile, [name]: value });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);
    setUploadError(null);

    try {
      const uploadedImage = await FileService.uploadProfilePicture(file);
      setEditableProfile({ ...editableProfile, picture_id: uploadedImage.id });
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setUploadError(error.response.data.message);
      else
        setUploadError("Failed to upload profile picture. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const validateProfile = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[\p{L} '-]+$/u;
    const usernameRegex = /^[\p{L} '-]+$/u;

    if (!editableProfile.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(editableProfile.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!editableProfile.firstname) {
      newErrors.firstname = "Firstname is required";
    } else if (
      !nameRegex.test(editableProfile.firstname) ||
      editableProfile.firstname.length > 64
    ) {
      newErrors.firstname =
        "Firstname can only contain letters, spaces, hyphens, and apostrophes and must be at most 64 characters long";
    }

    if (!editableProfile.lastname) {
      newErrors.lastname = "Lastname is required";
    } else if (
      !nameRegex.test(editableProfile.lastname) ||
      editableProfile.lastname.length > 64
    ) {
      newErrors.lastname =
        "Lastname can only contain letters, spaces, hyphens, et apostrophes and must be at most 64 caractères long";
    }

    if (!editableProfile.username) {
      newErrors.username = "Username is required";
    } else if (
      !usernameRegex.test(editableProfile.username) ||
      editableProfile.username.length < 3 ||
      editableProfile.username.length > 128
    ) {
      newErrors.username =
        "Username can only contain letters, spaces, hyphens, and apostrophes and must be between 3 and 128 characters long";
    }

    if (!editableProfile.birthday) {
      newErrors.birthday = "Birthday is required";
    } else if (new Date(editableProfile.birthday) >= new Date()) {
      newErrors.birthday = "Birthday cannot be in the future";
    }

    if (!editableProfile.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!editableProfile.nationality) {
      newErrors.nationality = "Nationality is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = async () => {
    setErrors({});
    setUploadError(null);
    setGlobalError(null);
    if (!validateProfile()) return;

    try {
      const updatedProfile = await UserService.updateProfile(
        id,
        editableProfile
      );
      setProfile(updatedProfile);

      const blob = await FileService.getFile(updatedProfile.picture_url);
      const imageUrl = URL.createObjectURL(blob);

      if (profileImage) URL.revokeObjectURL(profileImage);

      setProfileImage(imageUrl);

      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditableProfile({ ...editableProfile, picture_id: null });

      setIsEditing(false);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("Failed to update profile, please try again later");
    }
  };

  const handleCancelClick = () => {
    setGlobalError(null);
    setErrors({});
    setUploadError(null);
    setEditableProfile({ ...profile, picture_id: null });
    setIsEditing(false);
  };

  const handlePasswordPopupClick = () => {
    setShowPasswordPopup(true);
  };

  const closePopup = () => {
    setPasswordError(null);
    setPasswordErrors({});
    setPasswords(initialPasswordChange);
    setShowPasswordPopup(false);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords({ ...passwords, [name]: value });
  };

  const validatePasswordChange = () => {
    const newErrors: { [key: string]: string } = {};
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!#$%&*+<=>?@^_-]).{8,128}$/;

    if (!passwords.old_password) {
      newErrors.old_password = "Password is required";
    }

    if (!passwords.new_password) {
      newErrors.new_password = "New password is required";
    } else if (!passwordRegex.test(passwords.new_password)) {
      newErrors.new_password =
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    }

    if (passwords.new_password !== passwords.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async () => {
    setPasswordError(null);
    if (!validatePasswordChange()) return;

    try {
      await UserService.changePassword(id!, {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      closePopup();
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setPasswordError(error.response.data.message);
      else
        setPasswordError("Failed to change password, please try again later");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await UserService.deleteAccount(id!);
      localStorage.removeItem("authToken");
      navigate("/authentication/login");
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setGlobalError(error.response.data.message);
      else setGlobalError("Failed to delete account, please try again later");
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  if (
    globalError === "User not found" ||
    globalError === "Failed to fetch options, please try again later"
  ) {
    return <p>{globalError}</p>;
  }

  const canEdit = currentUserId === id || currentUserRole === "ADMINISTRATOR";

  return (
    <div className="profile-page">
      <div className="profile-left">
        <div className="profile-picture">
          <img src={profileImage} alt="Profile" />
        </div>
        <div className="profile-name">
          <h2>{profile.username}</h2>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-bio">{profile.bio}</p>
        </div>
        {canEdit && (
          <div className="action-buttons">
            <button
              className="change-password-button"
              onClick={handlePasswordPopupClick}
            >
              Change Password
            </button>
            <button
              className="delete-account-button"
              onClick={() => setShowDeletePopup(true)}
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
      <div className="profile-right">
        {globalError && <div className="error">{globalError}</div>}
        <label>
          Profile Picture:
          <div className="file-upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={!isEditing || uploading}
            />
          </div>
          {uploadError && <div className="error">{uploadError}</div>}
        </label>
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={editableProfile.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </label>
        <label>
          Firstname:
          <input
            type="text"
            name="firstname"
            value={editableProfile.firstname}
            onChange={handleInputChange}
            disabled={!isEditing}
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
            value={editableProfile.lastname}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
          {errors.lastname && <span className="error">{errors.lastname}</span>}
        </label>
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={editableProfile.username}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
          {errors.username && <span className="error">{errors.username}</span>}
        </label>
        <label>
          Birthday:
          <input
            type="date"
            name="birthday"
            value={editableProfile.birthday}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          />
          {errors.birthday && <span className="error">{errors.birthday}</span>}
        </label>
        <label>
          Gender:
          <select
            name="gender"
            value={editableProfile.gender}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          >
            <option value="">Select Gender</option>
            {genders.map((option) => (
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
            value={editableProfile.nationality}
            onChange={handleInputChange}
            disabled={!isEditing}
            required
          >
            <option value="">Select Nationality</option>
            {nationalities.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.nationality && (
            <span className="error">{errors.nationality}</span>
          )}
        </label>
        <label>
          Bio:
          <textarea
            name="bio"
            value={editableProfile.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </label>
        {canEdit && (
          <div className="profile-buttons">
            {!isEditing ? (
              <button className="edit-button" onClick={handleEditClick}>
                Edit
              </button>
            ) : (
              <>
                <button className="cancel-button" onClick={handleCancelClick}>
                  Cancel
                </button>
                <button className="save-button" onClick={handleSaveClick}>
                  Save
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {showPasswordPopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Change Password</h3>
            {passwordError && (
              <div className="error password-error">{passwordError}</div>
            )}
            <label>
              Old Password:
              <input
                type="password"
                name="old_password"
                value={passwords.old_password}
                onChange={handlePasswordChange}
                placeholder="Old Password"
                required
              />
              {passwordErrors.old_password && (
                <span className="error">{passwordErrors.old_password}</span>
              )}
            </label>
            <label>
              New Password:
              <input
                type="password"
                name="new_password"
                value={passwords.new_password}
                onChange={handlePasswordChange}
                placeholder="New Password"
                required
              />
              {passwordErrors.new_password && (
                <span className="error">{passwordErrors.new_password}</span>
              )}
            </label>
            <label>
              Confirm Password:
              <input
                type="password"
                name="confirm_password"
                value={passwords.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Confirm Password"
                required
              />
            </label>
            {passwordErrors.confirm_password && (
              <div className="error">{passwordErrors.confirm_password}</div>
            )}
            <div className="popup-buttons">
              <button className="close-button" onClick={closePopup}>
                Cancel
              </button>
              <button className="submit-button" onClick={handlePasswordSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeletePopup && (
        <div className="popup">
          <div className="popup-content">
            <h3>Are you sure you want to delete your account?</h3>
            <div className="popup-buttons">
              <button
                className="close-button"
                onClick={() => setShowDeletePopup(false)}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={handleDeleteAccount}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
