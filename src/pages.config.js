import Admin from './pages/Admin';
import Home from './pages/Home';
import LiveBetting from './pages/LiveBetting';
import MyBets from './pages/MyBets';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ResponsibleGambling from './pages/ResponsibleGambling';
import Sports from './pages/Sports';
import Terms from './pages/Terms';
import Wallet from './pages/Wallet';
import Onboarding from './pages/Onboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "LiveBetting": LiveBetting,
    "MyBets": MyBets,
    "Privacy": Privacy,
    "Profile": Profile,
    "ResponsibleGambling": ResponsibleGambling,
    "Sports": Sports,
    "Terms": Terms,
    "Wallet": Wallet,
    "Onboarding": Onboarding,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};