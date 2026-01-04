import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import servers from "../environment";

export const AuthContext = createContext({});
const client = axios.create({
    baseURL : `${servers}/api/v1/users`
})

export const AuthProvider = ({children})=>{
    const authContext = useContext(AuthContext);

    const [userData , setUserData] = useState(authContext);

    const handleRegister = async (name , username , password)=>{
        try{
            let request = await client.post('/register' , {
                name : name,
                username : username,
                password : password
            });

            if(request.status === 201){
                return request.data.message;
            }
        }catch(err){
            throw err;
        }
    }

    const handleLogin = async(username , password)=>{
        try{
            let request = await client.post('/login' , {
                username : username,
                password : password
            });

            if(request.status === 200){
                localStorage.setItem("token" , request.data.token);
            }
        }catch(err){
            throw err;
        }
    }

    const router = useNavigate();

    const getHistoryOfUser = async ()=>{
        try{

            const token = localStorage.getItem('token');
            let request = await client.get("/get_all_activity" , {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return request.data.data;
        }catch(e){
            throw e;
        }
    }

    const addToUserHistory = async (meetingCode)=>{
        try {
            const token = localStorage.getItem("token");

            return await client.post(
                "/add_to_activity",
                { meeting_code: meetingCode },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (e) {
            throw e;
        }
    }

    const data = {
        userData , setUserData , handleRegister , handleLogin , addToUserHistory , getHistoryOfUser
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )
}
