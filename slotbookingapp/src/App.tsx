import { Route, Routes } from "react-router-dom";
import './App.css';
import AppointmentScheduler from './AppointmentScheduler';
import LoginPage from './Components/LoginPage';
import Dumy from './Dumy'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" Component={LoginPage} />
        <Route path="/home" Component={Dumy} />
      </Routes>
    </div>
  );
}

export default App;
