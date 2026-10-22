import PageTitle from '../components/PageTitle.tsx';
import Login from '../components/Login.tsx';

// const appName = 'cop4331-5.com';

// function buildPath(route: string): string {
//     if (process.env.NODE_ENV != 'development') {
//         return 'http://' + appName + ':5000/' + route;
//     } else {
//         return 'http://localhost:5000/' + route;
//     }
// }

const LoginPage = () => {
    return (
        <div>
            <PageTitle />
            <Login />
        </div>
    );
};
export default LoginPage;
