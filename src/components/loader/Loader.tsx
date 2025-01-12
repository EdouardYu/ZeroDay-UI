import { FunctionComponent } from "react";
import "@/components/loader/Loader.css";

const Loader: FunctionComponent = () => {
  return (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  );
};

export default Loader;
