// src/components/Image.jsx
import { useState } from "react";

const Image = ({ className = "", ...props }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      className={`inline-block align-top opacity-0 transition-opacity duration-300 ${loaded ? "opacity-100" : ""} ${className}`}
      onLoad={() => setLoaded(true)}
      {...props}
      alt={props.alt || ""}
    />
  );
};

export default Image;
