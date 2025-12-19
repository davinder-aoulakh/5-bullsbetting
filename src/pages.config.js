import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Sports from './pages/Sports';
import LiveBetting from './pages/LiveBetting';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Home": Home,
    "Sports": Sports,
    "LiveBetting": LiveBetting,
    "Wallet": Wallet,
    "MyBets": MyBets,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};