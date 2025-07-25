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
            <div style={{height : '60px'}}></div>
            <nav className='menubar'> 
                <a href="https://vipindew.github.io/kanban/#/boards">Boards</a> 
                <a href="https://vipindew.github.io/kanban/#/register" className='push-right'>New Registration</a> 
                <a onClick={logOut} href="https://vipindew.github.io/kanban/#/login">Logout</a>
            </nav>
        </>
    );
}