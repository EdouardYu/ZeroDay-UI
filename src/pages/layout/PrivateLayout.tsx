import { FunctionComponent } from "react";
import { Outlet } from "react-router-dom";
import LogedHeader from "@/components/layout/header/LogedHeader";

const PrivateLayout: FunctionComponent = () => {
  return (
    <>
      <LogedHeader />
      <main style={{ paddingTop: 70 }}>
        <Outlet />
      </main>
    </>
  );
};

export default PrivateLayout;
