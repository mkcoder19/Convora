import { useEffect, useRef, useState, useMemo } from "react";
import styles from "../styles/videoComponent.module.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import io from "socket.io-client";
import IconButton from "@mui/material/IconButton";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import SendIcon from "@mui/icons-material/Send";
import PushPinIcon from "@mui/icons-material/PushPin";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CloseIcon from "@mui/icons-material/Close";
import Badge from "@mui/material/Badge";
import { useNavigate } from "react-router-dom";
import servers from "../environment";

const server_url = servers;

const peerConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
            urls: "turn:turn.anyfirewall.com:443?transport=tcp",
            username: "webrtc",
            credential: "webrtc"
        }
    ]
};

export default function VideoMeetComponent() {

    const socketRef = useRef(null);
    const localStreamRef = useRef(null);
    const peersRef = useRef({});
    const lobbyVideoRef = useRef(null);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    const [screenAvailable, setScreenAvailable] = useState(false);
    const [screenSharing, setScreenSharing] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);
    const [showChat, setShowChat] = useState(false);

    const [pinnedUser, setPinnedUser] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const initMedia = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localStreamRef.current = stream;
            lobbyVideoRef.current.srcObject = stream;
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
        };

        initMedia();

        return () => {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            Object.values(peersRef.current).forEach(p => p.close());
            socketRef.current?.disconnect();
        };
    }, []);


    const createPeer = (peerId) => {
        const peer = new RTCPeerConnection(peerConfig);
        peersRef.current[peerId] = peer;

        localStreamRef.current.getTracks().forEach(track =>
            peer.addTrack(track, localStreamRef.current)
        );

        peer.onicecandidate = e => {
            if (e.candidate) {
                socketRef.current.emit("signal", {
                    to: peerId,
                    data: { ice: e.candidate }
                });
            }
        };

        peer.ontrack = e => {
            setVideos(v =>
                v.find(x => x.socketId === peerId)
                    ? v
                    : [...v, { socketId: peerId, stream: e.streams[0] }]
            );
        };

        return peer;
    };

    const connectSocket = () => {
        socketRef.current = io(server_url, { transports: ["websocket"] });

        socketRef.current.on("existing-users", async users => {
            for (const id of users) {
                const peer = createPeer(id);
                const offer = await peer.createOffer();
                await peer.setLocalDescription(offer);
                socketRef.current.emit("signal", {
                    to: id,
                    data: { sdp: peer.localDescription }
                });
            }
        });

        socketRef.current.on("user-joined", id => {
            if (!peersRef.current[id]) {
                createPeer(id);
            }
        });

        socketRef.current.on("signal", async ({ from, data }) => {
            let peer = peersRef.current[from];
            if (!peer) peer = createPeer(from);

            if (data.sdp) {
                await peer.setRemoteDescription(data.sdp);
                if (data.sdp.type === "offer") {
                    const answer = await peer.createAnswer();
                    await peer.setLocalDescription(answer);
                    socketRef.current.emit("signal", {
                        to: from,
                        data: { sdp: peer.localDescription }
                    });
                }
            }

            if (data.ice) {
                await peer.addIceCandidate(data.ice);
            }
        });

        socketRef.current.on("user-left", id => {
            peersRef.current[id]?.close();
            delete peersRef.current[id];
            setVideos(v => v.filter(x => x.socketId !== id));
            if (pinnedUser === id) setPinnedUser(null);
        });

        socketRef.current.on("chat-message", msg => {
            setMessages(m => [...m, msg]);
            if (!showChat) setNewMessages(n => n + 1);
        });

        socketRef.current.emit("join-call", window.location.href);
    };

    const handleScreenShare = async () => {
        if (!screenAvailable) return;

        if (screenSharing) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peersRef.current).forEach(peer => {
                peer.getSenders()
                    .find(s => s.track?.kind === "video")
                    ?.replaceTrack(camTrack);
            });
            setScreenSharing(false);
        } else {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = screenStream.getVideoTracks()[0];

            Object.values(peersRef.current).forEach(peer => {
                peer.getSenders()
                    .find(s => s.track?.kind === "video")
                    ?.replaceTrack(screenTrack);
            });

            screenTrack.onended = () => handleScreenShare();
            setScreenSharing(true);
        }
    };

    const connect = () => {
        setAskForUsername(false);
        connectSocket();
    };

    const handleCall = () => {
        socketRef.current.emit("leave-call");
        navigate("/home");
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        socketRef.current.emit("chat-message", {
            username,
            message,
            timestamp: new Date().toLocaleTimeString()
        });
        setMessage("");
    };

    const remoteVideos = useMemo(
        () => videos.filter(v => v.socketId !== pinnedUser),
        [videos, pinnedUser]
    );

    return (
        <div>
            {askForUsername ? (
                <div className="lobbyContainer">
                    <h2>Enter into Meeting</h2>

                    <TextField
                        label="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />

                    <video
                        ref={lobbyVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "300px", marginTop: "10px" }}
                    />

                    <Button onClick={connect} disabled={!username.trim()} variant="contained">
                        Connect
                    </Button>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>

                    <div className={styles.buttonContainer}>
                        <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => {
                            localStreamRef.current.getVideoTracks()
                                .forEach(t => t.enabled = !videoEnabled);
                            setVideoEnabled(v => !v);
                        }}>
                            {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>
                            &nbsp;
                            &nbsp;
                        <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => {
                            localStreamRef.current.getAudioTracks()
                                .forEach(t => t.enabled = !audioEnabled);
                            setAudioEnabled(a => !a);
                        }}>
                            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>
                            &nbsp;
                            &nbsp;
                        <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={handleScreenShare}>
                            {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                        </IconButton>
                            &nbsp;
                            &nbsp;
                        <Badge badgeContent={newMessages} color="secondary">
                            <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => {
                                setShowChat(v => !v);
                                setNewMessages(0);
                            }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                            &nbsp;
                            &nbsp;
                        <IconButton style={{color : "red" , backgroundColor : "black"}} onClick={handleCall}>
                            <CallEndIcon />
                        </IconButton>
                    </div>

                    {/* ---------- LOCAL VIDEO ---------- */}
                    <video
                        autoPlay
                        muted
                        playsInline
                        className={styles.meetUserVideo}
                        ref={el => el && (el.srcObject = localStreamRef.current)}
                    />


                    <div className={styles.conferenceView}>

                        {pinnedUser && (
                            <div className={`${styles.pinnedVideoContainer} ${expanded ? styles.expanded : ""}`} >
                                <video
                                    autoPlay
                                    playsInline
                                    className={styles.pinnedVideo}
                                    ref={el => {
                                        const stream = videos.find(v => v.socketId === pinnedUser)?.stream;
                                        if (el && stream) el.srcObject = stream;
                                    }}
                                />

                                <div className={styles.videoControls}>
                                    <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => setExpanded(e => !e)}>
                                        {expanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
                                    </IconButton>

                                    <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => {
                                        setPinnedUser(null);
                                        setExpanded(false);
                                    }}>
                                        <CloseIcon />
                                    </IconButton>
                                </div>
                            </div>
                        )}

                        {/* OTHER REMOTES */}
                        {remoteVideos.map(v => (
                            <div key={v.socketId} className={styles.remoteVideoWrapper}>
                                <video
                                    autoPlay
                                    playsInline
                                    className={styles.remoteVideo}
                                    ref={el => el && (el.srcObject = v.stream)}
                                />

                                <div className={styles.videoControls}>
                                    <IconButton style={{color : "white" , backgroundColor : "black"}} onClick={() => setPinnedUser(v.socketId)}>
                                        <PushPinIcon />
                                    </IconButton>
                                </div>
                            </div>
                        ))}
                    </div>

                    {showChat && (
                        <div className={styles.chatContainer}>
                            <div className={styles.chatHeader}>
                                <strong>Chat</strong>
                            </div>
                            <div className={styles.chatMessages}>
                                {messages.map((m, i) => (
                                    <div key={i}>
                                        <b>{m.username}</b>: {m.message}
                                    </div>
                                ))}
                            </div>

                            <div className={styles.chatInput}>
                                <TextField
                                    fullWidth
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                                />
                                <IconButton onClick={sendMessage}>
                                    <SendIcon />
                                </IconButton>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}