import React, { createContext, useState, useEffect, ReactNode } from "react";

// Define the User interface with expected properties
interface User {
  id?: string;
  username?: string;
  token?: string;
}

// Define the context type with proper typing
interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the context with an initial undefined value
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

const UserContextProvider = ({ children }: UserContextProviderProps) => {
  // Retrieve userInfo from localStorage
  const storedUser = localStorage.getItem("userInfo");
  const [userInfo, setUserInfo] = useState<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );

  // Update localStorage whenever userInfo changes
  useEffect(() => {
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } else {
      localStorage.removeItem("userInfo");
    }
  }, [userInfo]);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

export default UserContextProvider;
