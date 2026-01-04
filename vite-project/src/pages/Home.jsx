import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth"
import { useContext, useState } from "react";
import "../App.css";
import IconButton from "@mui/material/IconButton";
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button';
import TextField from "@mui/material/TextField";
import { AuthContext } from "../contexts/AuthContext";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function HomeComponent(){

    let navigate = useNavigate();
    const [meetingCode , setMeetingCode] = useState("");
    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async ()=>{
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }

    return (
        <>
            <div className="navbar">
                <div style={{display : "flex" , alignItems : "center"}}>
                    <h1>Convora</h1>
                </div>

                <div style={{display : "flex" , alignItems : "center"}}>
                    <IconButton onClick={()=>navigate('/history')}>
                        <RestoreIcon/>
                        <p>History</p>
                    </IconButton>

                    <Button variant="contained" onClick={()=>{
                        localStorage.removeItem("token")
                        navigate('/auth')
                    }}>
                        Log Out
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                    <div className="leftPanel">
                        <div>
                            <h2>Where Conversations come alive</h2>
                            <br/>
                            <div style={{display : 'flex' , gap : '0.5rem'}}>
                                <IconButton onClick={() => navigator.clipboard.writeText(meetingCode)}>
                                    <ContentCopyIcon/>
                                </IconButton>
                                <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" variant="outlined"  label="Meeting-Code"/>
                                <Button onClick={handleJoinVideoCall} variant="contained">Join</Button>
                            </div>
                        </div>
                    </div>

                    <div className="rightPanel">
                        <img src="/logo3.png" alt=""/>
                    </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent);