import React, {useContext, useEffect, useState} from 'react';
import LoginForm from "./components/LoginForm";
import {Context} from "./index";
import {observer} from "mobx-react-lite";
import {IUser} from "./models/IUser";
import UserService from "./services/UserService";

const App = () => {

    const {store} = useContext(Context)

    const [users, setUsers] = useState<IUser[]>([])

    useEffect(() => {
        if (localStorage.getItem('token')) {
            store.checkAuth()
        }
    }, [])

    async function getUsers() {
        try {
            const response = await UserService.fetchUsers()
            setUsers(response.data)
        } catch (error: any) {
            console.log(error)
        }
    }

    if (store.isLoading) {
        return <div>Loading...</div>
    }

    if (!store.isAuth) {
        return (
            <div>
                <h1>{store.isAuth ? `User is authorized ${store.user.email}` : 'User is not authorized'}</h1>
                <LoginForm/>
            </div>
        )
    }

    return (
        <div>
            <h1>{store.isAuth ? `User is authorized ${store.user.email}` : 'User is not authorized'}</h1>
            <p>{store.user.isActivated ? 'Active' : 'Not active'}</p>

            <button onClick={getUsers}>
                Get user list
            </button>

            <button onClick={() => store.logout()}>
                Logout
            </button>

            <ol>
                {users.map(user =>
                    <li key={user.email}>{user.email}</li>
                )}
            </ol>

        </div>
    )
}

export default observer(App);