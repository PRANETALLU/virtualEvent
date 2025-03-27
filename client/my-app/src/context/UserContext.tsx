import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// Define the User interface with expected properties
interface User {
  id?: string;
  username?: string;
  email?: string;
  interests?: string[];
  bio?: string;
  token?: string;
  avatar?: string;
}

// Define the context type
interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
}

// Create the context
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserContextProviderProps {
  children: ReactNode;
}

const UserContextProvider = ({ children }: UserContextProviderProps) => {
  const storedUser = localStorage.getItem("userInfo");
  const [userInfo, setUserInfo] = useState<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );

  // Fetch user details when userInfo updates (useful for fresh login)
  /*useEffect(() => {
    const fetchUserData = async () => {
      if (userInfo?.token) {
        try {
          const { data } = await axios.get("http://localhost:5000/user/profile", {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
          setUserInfo((prev) => ({ ...prev, ...data }));
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    fetchUserData();
  }, [userInfo?.token]);*/

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
  if (!context) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

export default UserContextProvider;
