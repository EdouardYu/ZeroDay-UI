import { FunctionComponent } from "react";
import "@/components/layout/header/Header.css";

const AuthenticationHeader: FunctionComponent = () => {
  return (
    <header className="header">
      <div className="header-left">
        <img src="/zeroday.png" alt="Logo" className="header-logo" />
        <span className="header-title">ZeroDay</span>
      </div>
    </header>
  );
};

export default AuthenticationHeader;
