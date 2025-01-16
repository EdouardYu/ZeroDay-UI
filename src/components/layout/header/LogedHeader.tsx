import { FunctionComponent, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "@/components/layout/header/Header.css";
import { EditPostIcon, HomeIcon, FlagIcon } from "@/components/icons";
import { AuthService, FileService, UserService } from "@/services";
import axios from "axios";

interface JwtPayload {
  sub: string;
  role: string;
}

const LogedHeader: FunctionComponent = () => {
  const [active, setActive] = useState<string>("home");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<JwtPayload | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileIconRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const path = location.pathname.slice(1);
    setActive(path || "home");

    const token = localStorage.getItem("authToken");
    if (token) {
      const payload: JwtPayload = JSON.parse(atob(token.split(".")[1]));
      setUserInfo(payload);

      FileService.getProfilePicture(payload.sub).then((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        if (profilePicture) URL.revokeObjectURL(profilePicture);

        setProfilePicture(imageUrl);
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(event.target as Node) &&
        !profileIconRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (profilePicture) {
        URL.revokeObjectURL(profilePicture);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleLogout = async () => {
    await AuthService.signout();
    localStorage.removeItem("authToken");
    setShowDropdown(false);
    navigate("/authentication/login");
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown((prevState) => !prevState);
  };

  const handleProfileClick = () => {
    if (userInfo) {
      navigate(`/profile/${userInfo.sub}`);
      setShowDropdown(false);
    }
  };

  const handleNavigation = (path: string) => {
    setActive(path);
    navigate(path);
  };

  const handleFlagClick = async () => {
    if (!userInfo || userInfo.role !== "ADMINISTRATOR") {
      return;
    }

    try {
      setPopupError(null);
      setPopupContent(null);
      setShowPopup(true);

      const flagData = await UserService.getFlag();
      setPopupContent(flagData.flag);
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status !== 500
      )
        setPopupError(error.response.data.message);
      else setPopupError("Failed to retrieve flag. Please try again later");
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
    setPopupError(null);
  };

  return (
    <header className="header">
      <div className="header-left">
        <img
          src="/zeroday.png"
          alt="Logo"
          className="header-logo"
          onClick={() => handleNavigation("/")}
        />
      </div>
      <div className="header-center">
        <div
          className={`header-item ${active === "home" ? "active" : ""}`}
          onClick={() => handleNavigation("/")}
        >
          <HomeIcon />
          <div className="tooltip">Home</div>
        </div>
        <div
          className={`header-item ${active === "post/edit" ? "active" : ""}`}
          onClick={() => handleNavigation("/post/edit")}
        >
          <EditPostIcon />
          <div className="tooltip">Create Post</div>
        </div>
        {userInfo?.role === "ADMINISTRATOR" && (
          <div
            className="header-item header-flag-icon"
            onClick={handleFlagClick}
          >
            <FlagIcon />
            <div className="tooltip">Flag</div>
          </div>
        )}
      </div>
      <div className="header-right">
        <div className="header-item profile-container" style={{ padding: 0 }}>
          {profilePicture && (
            <img
              src={profilePicture}
              alt="Profile"
              className="header-profile-icon"
              ref={profileIconRef}
              onClick={(e) => {
                e.stopPropagation();
                toggleDropdown(e);
              }}
            />
          )}
          <div className="tooltip">Profile</div>
          {showDropdown && (
            <div className="dropdown-menu" ref={dropdownRef}>
              <div onClick={handleProfileClick} className="dropdown-item">
                Profile
              </div>
              <div onClick={handleLogout} className="dropdown-item">
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-container" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">Flag Information</div>
            <div className="popup-content">
              {popupContent || popupError || "Loading..."}
            </div>
            <button className="popup-close-button" onClick={closePopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LogedHeader;
