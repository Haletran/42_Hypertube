import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const useAuthCheck = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated && window.location.pathname !== "/auth/login") {
        window.location.href = "/auth/login";
      }
    };

    checkAuth();
  }, [isAuthenticated]);
};

export default useAuthCheck;
