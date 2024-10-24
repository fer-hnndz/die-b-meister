import SidebarButton from "./sidebar-button";
import { PoolData } from "../interfaces";
import { useState } from "react";

interface SidebarProps {
    pools: PoolData[];
    onSelectPool: (poolId: number) => void; // Función para seleccionar una pool
}

export default function Sidebar({ pools, onSelectPool }: SidebarProps) {

    function showConnectionModal() {
        const modal = document.getElementById("newConnectionModal");
        if (!modal) return;
        modal.classList.remove('hidden');
    }

    function onPoolClick(index: number) {
        console.log("clicked div")
        onSelectPool(index);
    }

    return (
        <div className="select-none flex w-1/5 h-screen flex-col border-r bg-gray items-center content-center">
            <h1 className="text-3xl font-mono text-center font-semibold mt-5">Die B-Meister</h1>
            <hr className="h-px bg-black my-8 border-0" />
            <div className="flex flex-col gap-y-4 mt-4">
                <SidebarButton text="Nueva Conexión" icon="" action={showConnectionModal} />
                <SidebarButton text="Cerrar Conexión" icon="" />
            </div>

            <div className="w-4/5 mt-12 bg-white h-1/2 rounded overflow-y-scroll overflow-x-clip">
                <h1 className="text-center text-xl font-bold mt-2">Conexiones</h1>
                <div className="flex flex-col text-center items-center gap-y-3 content-center">
                    {pools.map((info, index) => {
                        return (
                            <div onClick={() => onPoolClick(info.id)} key={index} className="hover:bg-blue-500 ease-in-out duration-150 w-fit h-fit p-4 rounded-md shadow-lg border hover:cursor-pointer flex flex-col justify-start items-start">
                                <span className="font-bold text-md">{info.database}</span>
                                <span className="text-black italics text-sm">{info.user}@{info.host}:{info.port}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
