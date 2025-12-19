import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Onboarding": Onboarding,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "Onboarding",
    Pages: PAGES,
    Layout: __Layout,
};