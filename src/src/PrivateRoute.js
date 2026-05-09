import { Navigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

function PrivateRoute({ children }) {
  const auth = getAuth();

  return auth.currentUser
    ? children
    : <Navigate to="/" />;
}

export default PrivateRoute;