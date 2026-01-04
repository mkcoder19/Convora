import "../App.css";
import { Link, useNavigate} from 'react-router-dom';
export default function landingpage(){

    const routeTo = useNavigate();
    return (
        <div className="landingPageContainer">
            <nav>
                <div className="navHeader">
                    <h2>Convora</h2>
                </div>
                <div className="navlist">
                    <div role="button" onClick={()=>{routeTo('/auth')}}>Register</div>
                    <div role='button' onClick={()=>{routeTo('/auth')}}>Login</div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h2><span style={{color : "#FF9839"}}>Connect</span> with your loved ones</h2>
                    <p>Where conversations come alive</p>
                    <div role='button'>
                        <Link to="/auth">Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="" />
                </div>
            </div>
        </div>
    )
}