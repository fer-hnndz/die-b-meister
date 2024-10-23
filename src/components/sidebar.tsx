import SidebarButton from "./sidebar-button";
import { PoolData } from "../interfaces";

export default function Sidebar({ pools }: { pools: PoolData[] }) {

    function showConnectionModal() {
        const modal = document.getElementById("newConnectionModal");
        if (!modal) return
        modal.classList.remove('hidden');
    }

    return (
        <div className="select-none flex w-1/5 h-screen absolute flex-col border-r bg-gray items-center content-center">
            <h1 className="text-3xl font-mono text-center font-semibold mt-5">Die B-Meister</h1>
            <hr className="h-px bg-black my-8 border-0" />
            <div className="flex flex-col gap-y-4 mt-4">
                <SidebarButton text="Nueva Conexión" icon="" action={showConnectionModal} />
                <SidebarButton text="Cerrar Conexión" icon="" />
            </div>

            <div>
                {pools.map((info, index) => {
                    return (
                        <div key={index} className="flex flex-col gap-y-4 mt-4">
                            <SidebarButton text={info.db} icon="" />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}