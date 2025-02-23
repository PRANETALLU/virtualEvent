<<<<<<< Updated upstream
import React, { createContext, useState, ReactNode } from "react";
=======
import React, { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
>>>>>>> Stashed changes

// Define the User interface with expected properties
interface User {
  id?: string;
  username?: string;
  email?: string;
<<<<<<< Updated upstream
  name?: string;
  // Add other user properties as needed
=======
  bio?: string;
  avatar?: string;
  interests?: string[];
  token?: string;
>>>>>>> Stashed changes
}

// Define the context type
interface UserContextType {
  userInfo: User | null;  // Allow null value
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;  // Set state type to User | null
}

// Create the context
export const UserContext = createContext<UserContextType | undefined>(undefined);

// Define props interface for the provider component
interface UserContextProviderProps {
  children: ReactNode;
}

// Create the provider component with proper typing
const UserContextProvider = ({ children }: UserContextProviderProps) => {
<<<<<<< Updated upstream
  const [userInfo, setUserInfo] = useState<User | null>(null); // Initialize userInfo as null
=======
  const storedUser = localStorage.getItem("userInfo");
  const [userInfo, setUserInfo] = useState<User | null>(
    storedUser ? JSON.parse(storedUser) : null
  );

  // Fetch user details when userInfo updates (useful for fresh login)
  useEffect(() => {
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
  }, [userInfo?.token]);

  useEffect(() => {
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } else {
      localStorage.removeItem("userInfo");
    }
  }, [userInfo]);
>>>>>>> Stashed changes

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};

// Add a custom hook for using the context
export const useUser = () => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserContextProvider");
  }
  return context;
};

export default UserContextProvider;
