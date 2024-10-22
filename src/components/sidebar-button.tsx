export default function SidebarButton({ icon, text }: { icon: string, text: string }) {
    return (
        <button
            className="w-fit h-fit p-4 rounded-2xl font-semibold bg-pale text-md"
        >{text}</button>
    )
}