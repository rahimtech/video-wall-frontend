import React, { createContext, useContext, useRef, useState } from "react";

const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [isActiveG, setIsActiveG] = useState("");
  const [vidN, setVidN] = useState("");
  const targetRef = useRef(null);
  const moveable = useRef(null);

  return (
    <MyContext.Provider
      value={{
        height,
        setHeight,
        weight,
        setWeight,
        targetRef,
        moveable,
        isActiveG,
        setIsActiveG,
        vidN,
        setVidN,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export const MCPC = ({ children }) => {
  return <MyContext.Consumer>{children}</MyContext.Consumer>;
};

export const useMyContext = () => {
  return useContext(MyContext);
};
