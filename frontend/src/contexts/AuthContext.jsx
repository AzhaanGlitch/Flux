import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState, useMemo } from "react";
import server from "../environment";

export const AuthContext = createContext(null);

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState({});

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
                setUserData(request.data.user || {}); // Update state on login
                return request;
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: { token: localStorage.getItem("token") }
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}