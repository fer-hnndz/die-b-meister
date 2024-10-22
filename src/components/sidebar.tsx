import SidebarButton from "./sidebar-button";

export default function Sidebar() {
    return (
        <div className="flex w-1/4 h-screen absolute pr-8 flex-col gap-y-4 border-r bg-gray float-start margin-0">
            <SidebarButton text="Nueva Conexión" icon="" />
            <SidebarButton text="Cerrar Conexión" icon="" />
        </div>
    )
}