import { FunctionComponent, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "@/components/layout/header/Header.css";
import HomeIcon from "@/components/icons/Home";
import PostEditIcon from "@/components/icons/PostEdit";
import AuthService from "@/services/AuthService";
import FileService from "@/services/FileService";

interface JwtPayload {
  sub: string;
}

const LogedHeader: FunctionComponent = () => {
  const [active, setActive] = useState<string>("home");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<JwtPayload | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
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

      FileService.getProfilePicture(payload.sub)
        .then((blob) => {
          const imageUrl = URL.createObjectURL(blob);
          setProfilePicture(imageUrl);
        })
        .catch((error) => {
          console.error("Error retrieving profile picture", error);
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
      if (profilePicture) URL.revokeObjectURL(profilePicture);
    };
  }, [location, profilePicture]);

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
          <PostEditIcon />
          <div className="tooltip">Create Post</div>
        </div>
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
    </header>
  );
};

export default LogedHeader;
