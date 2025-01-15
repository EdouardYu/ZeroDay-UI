import { FunctionComponent } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@/App.css";
import { PrivateRouter, PublicRouter } from "@/routes";
import { AuthGuard, PublicGuard } from "@/guards/AuthGuard";

const App: FunctionComponent = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <AuthGuard>
              <PrivateRouter />
            </AuthGuard>
          }
        />
        <Route
          path="/authentication/*"
          element={
            <PublicGuard>
              <PublicRouter />
            </PublicGuard>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
