"use server"
import { createNewPool } from "@/connector"
import Dashboard from "./dashboard"

export default async function App() {
    return (
        <div>
            <Dashboard createNewPool={createNewPool} />
        </div>
    )
}