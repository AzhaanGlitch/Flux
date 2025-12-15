import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useMemo } from "react";
// Removed useNavigate to prevent crash if AuthProvider is outside Router
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})

export const AuthProvider = ({ children }) => {
    // Removed circular dependency: const authContext = useContext(AuthContext);
    // Removed circular dependency: const [userData, setUserData] = useState(authContext);
    const [userData, setUserData] = useState({});
    
    // Removed: const router = useNavigate(); 
    // Context should not handle routing

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                // Return success instead of navigating
                return request;
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }

    // Memoize the value to prevent unnecessary re-renders of the entire app
    const data = useMemo(() => ({
        userData, 
        setUserData, 
        addToUserHistory, 
        getHistoryOfUser, 
        handleRegister, 
        handleLogin
    }), [userData]);

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // This ensures the hook is used correctly
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}