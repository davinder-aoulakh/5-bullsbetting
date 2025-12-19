import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Sports from './pages/Sports';
import LiveBetting from './pages/LiveBetting';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import Profile from './pages/Profile';
import ResponsibleGambling from './pages/ResponsibleGambling';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Home": Home,
    "Sports": Sports,
    "LiveBetting": LiveBetting,
    "Wallet": Wallet,
    "MyBets": MyBets,
    "Profile": Profile,
    "ResponsibleGambling": ResponsibleGambling,
    "Terms": Terms,
    "Privacy": Privacy,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};