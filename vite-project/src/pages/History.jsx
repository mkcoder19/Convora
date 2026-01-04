import { useContext, useEffect , useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from "@mui/material/IconButton";
import HomeIcon from '@mui/icons-material/Home';

export default function History(){
    const auth = useContext(AuthContext);

    if (!auth) {
        throw new Error("History must be used within an AuthProvider");
    }

    const { getHistoryOfUser } = auth;

    const [meetings , setMeetings] = useState([]);

    const [errorOpen, setErrorOpen] = useState(false);

    const routeTo = useNavigate();

    console.log("meetings:", meetings);

    useEffect(()=>{
        const fetchHistory = async ()=>{
            try{
                const history = await getHistoryOfUser();
                setMeetings(history);
            }catch(e){
                if (e.response && e.response.status === 401) {
                    localStorage.removeItem("token");
                    routeTo('/auth');
                } else {
                    setErrorOpen(true);
                }
            }
        }
         if(getHistoryOfUser) fetchHistory();
    } , [getHistoryOfUser])

    let formatDate = (dateString)=>{
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2 , "0");
        const month = (date.getMonth()+1).toString().padStart(2 , "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    }

    return (
        <div>
            <IconButton onClick={()=>routeTo('/home')} style={{color : "black"}}>
                <HomeIcon/>
                <p>Home</p>
            </IconButton>
            {Array.isArray(meetings) && meetings.map(e =>{
                return (
                    
                    <Card key={e._id} variant="outlined" sx={{ marginBottom: 2 }}>
                        <CardContent>
                            <Typography sx={{ color: 'dark', mb: 1.5 }}><strong>Meeting Code : </strong>{e.meetingCode}</Typography>
                            <Typography variant="body2">
                                <strong>User ID : </strong>{e.user_id}
                            </Typography>

                            <Typography variant="body2">
                                <strong>Date : </strong>{formatDate(e.date)}
                            </Typography>
                        </CardContent>
                    </Card>
                )
            })}

            <Snackbar
                open={errorOpen}
                autoHideDuration={3000}
                message="Failed to load history"
                onClose={() => setErrorOpen(false)}
            />
        </div>
    )
}