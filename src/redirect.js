import React, { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";

const Redirect = ({ redirectParams }) => {
  const ref = useRef(true);

  const { pathname } = useLocation();

  useEffect(() => {
    ref.current = false;
  }, [pathname]);

  if (ref.current) {
    return <Navigate to={redirectParams} />;
  }

  return null;
};

export default Redirect;
