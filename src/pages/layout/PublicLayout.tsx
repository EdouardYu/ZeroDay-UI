import { FunctionComponent } from "react";
import { Outlet } from "react-router-dom";
import AuthenticationHeader from "@/components/layout/header/AuthenticationHeader";

const PublicLayout: FunctionComponent = () => {
  return (
    <>
      <AuthenticationHeader />
      <main style={{ paddingTop: 70 }}>
        <Outlet />
      </main>
    </>
  );
};

export default PublicLayout;
