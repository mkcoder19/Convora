import { createContext, useContext, useState , useEffect} from "react";
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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUserData({ token });
        }
    }, []);

    const handleRegister = async (name , username , password)=>{
        try{
            let res = await client.post('/register' , {
                name : name,
                username : username,
                password : password
            });

            localStorage.setItem("token" , res.data.token);
            return res.data.user;
        }catch(err){
            throw err.res?.data || err;
        }
    }

    const handleLogin = async(username , password)=>{
        try{
            const res = await client.post('/login' , {
                username : username,
                password : password
            });

            if(res.status === 200){
                localStorage.setItem("token" , res.data.token);
                setUserData(res.data.user || username);
                return "Login Successful";
            }
        }catch(err){
            throw err.res?.data || err;
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
