import { useContext } from "react";
import { UserContext } from "../App";
import { errorFunction } from "./errorfunction";
import axios from "axios";
import { backendURL } from "./url";

export function Menubar() {

    const {value1, value2} = useContext(UserContext);
    const [loginStatus, setLoginStatus] = value1;

    async function logOut (){
        try {
            await axios.get(backendURL + "/logout", {withCredentials : true});
            setLoginStatus(false);
            navigate('/login');
        }
        catch(error){
            errorFunction(error);
        }
    }

    return(
        <>
            <h1>Menubar</h1>
            <nav className='menubar'> 
                <a href="/boards">Boards</a> 
                <a onClick={logOut} href="/register" className='push-right'>New Registration</a> 
                <a onClick={logOut} href="/login">Logout</a>
            </nav>
        </>
    );
}