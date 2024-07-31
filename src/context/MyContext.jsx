import React, { createContext, useContext, useRef, useState } from "react";

const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  const [height, setHeight] = useState(null);
  const [weight, setWeight] = useState(null);
  const [isActiveG, setIsActiveG] = useState("");
  const [flagDragging, setFlagDragging] = useState(true);
  const [cB, setCB] = useState(0);
  const [cF, setCF] = useState(0);

  const [state, setState] = useState({
    isActiveG: "un",
    flagDragging: false,
  });

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
        flagDragging,
        setFlagDragging,
        cB,
        setCB,
        cF,
        setCF,
        state,
        setState,
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
