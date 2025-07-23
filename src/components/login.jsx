import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { backendURL } from "./url";

function Login(props) {
    const [login , setLogin] = useState(props.isLogin);
    const navigate = useNavigate();
    const {value1, value2 : [username, setUsername]} = useContext(UserContext);
    const [_, setLoginStatus] = value1;

    async function fetchLogin(e) {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;
        try {
            const response  = await axios.post(backendURL + "/login", {email:email, password:password}, {withCredentials:true});
            setUsername(response.data);
            setLoginStatus(true);
            navigate('/');
        }
        catch(error){
           error.response.data ? alert(error.response.data.message)  : console.log(error); 
        }
    }

    async function fetchSignup(e) {
        e.preventDefault();
        const email = e.target[1].value;
        const username = e.target[0].value;
        const password = e.target[2].value;
        const confirm_password = e.target[3].value;
        try {
            const response = await axios.post(backendURL + "/signup", {email:email, password:password, username:username, confirm_password:confirm_password}, {withCredentials:true})
            setUsername(response.data);
            setLoginStatus(true);
            navigate('/');
        }
        catch(error){
           error.response.data ? alert(error.response.data.message)  : console.log(error); 
        }
    }


    function changeLoginState(event) {
        
        let inputs = document.getElementsByTagName('input');
        for (let index = 0; index < inputs.length; index++) {
            inputs[index].value = "";
        }
        if (login && event.target.id === "signup-button"){            
            setLogin(false);    
        }
        else if (!login && event.target.id === "login-button"){          
            setLogin(true);
        }
        
    }


    return (
        <div className="login-body">
            <div className="login-page">
                <div>
                    <button onClick={changeLoginState} id="login-button">Login</button>
                    <button onClick={changeLoginState} id="signup-button">Signup</button>
                </div>
                {login ? <form onSubmit={fetchLogin}>
                    <input autoFocus placeholder="Email address" name="email" type="email"/>
                    <input autoComplete="off" placeholder="Password" name="password" type="password"/>
                    <button type="submit">Login</button>
                </form> : <form onSubmit={fetchSignup}>
                    <input placeholder="Username" name="username" type="text"/>
                    <input autoFocus placeholder="Email address" name="email" type="email"/>
                    <input autoComplete="off" placeholder="Password" name="password" type="password"/>
                    <input autoComplete="off" placeholder="Confirm Password" name="confirmPassword" type="password"/>
                    <button type="submit">Signup</button>
                </form>}
            </div> 
        </div>
    );
}

export default Login