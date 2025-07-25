import { HashRouter as Router, Routes, Route, useParams, useNavigate} from 'react-router-dom';
import Login from './components/login'
import Homepage from './components/homepage';
import { NotFound } from './components/notFound';
import { Boards } from './components/boards';
import { LoadingPage } from './components/loadingPage';
import './App.css'
import { createContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Menubar } from './components/menubar';
import { errorFunction } from './components/errorfunction';
import { backendURL } from './components/url';

export const UserContext = createContext();

function App() {

  const [loginStatus, setLoginStatus] = useState(false);
  const [messageReceived, setMessageReceived] = useState(false);
  const [username, setUsername] = useState("Guest");
  
  useEffect(() => {checkLogin()}, [loginStatus, username]);
  
  async function checkLogin() {
    try{
      const response = await axios.get(backendURL, {withCredentials : true});
      const name = response.data;
      setUsername(name);
      setLoginStatus(true);
      setMessageReceived(true);
    }
    catch(error){
      error.response.data ? setMessageReceived(true) : setMessageReceived(false);
      console.log(error);
    }
  }
  
  if (messageReceived) {return (
    <>
      <UserContext.Provider value={{value1 : [loginStatus, setLoginStatus], value2 : [username, setUsername]}}>
        {loginStatus && <Menubar></Menubar>}
        <Router>
          <Routes>
            {loginStatus && <Route path='/boards' element={<Boards />}></Route>}
            <Route path='/' element={<LoadingPage />}></Route>
            {loginStatus && <Route path='/homepage/:boardId/:boardName' element={<Homepage />}/>}
            <Route path='/login' element={<Login isLogin={true}/>}/>
            <Route path='/register' element={<Login isLogin={false}/>}/>
            <Route path='*' element={<NotFound />}/>
          </Routes>
        </Router>
      </UserContext.Provider>
    </>
    );
  } 
  return (<></>);
}

export default App
