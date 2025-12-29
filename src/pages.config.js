import Admin from './pages/Admin';
import Home from './pages/Home';
import LiveBetting from './pages/LiveBetting';
import MyBets from './pages/MyBets';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ResponsibleGambling from './pages/ResponsibleGambling';
import Sports from './pages/Sports';
import Terms from './pages/Terms';
import Wallet from './pages/Wallet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "LiveBetting": LiveBetting,
    "MyBets": MyBets,
    "Onboarding": Onboarding,
    "Privacy": Privacy,
    "Profile": Profile,
    "ResponsibleGambling": ResponsibleGambling,
    "Sports": Sports,
    "Terms": Terms,
    "Wallet": Wallet,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};