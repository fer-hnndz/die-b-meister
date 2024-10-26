
interface SidebarButtonProps {
    icon?: string;
    text: string;
    action?: CallableFunction;
}

export default function SidebarButton({ icon, text, action }: SidebarButtonProps) {
    return (
        <button
            className="flex w-fit h-fit p-4 rounded-2xl font-semibold bg-pale text-md"
            onClick={() => { if (action) action() }}
        >{text}</button>
    )
}