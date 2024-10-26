interface ButtonProps {
    text: string;
    action?: () => void;
    variant?: "primary" | "pale" | "danger" | "success" | "warning";
    id?: string
}

export default function Button({ text, action, variant, id }: ButtonProps) {
    let background = "bg-pale";

    if (variant == "primary") background = "bg-sky-500";
    if (variant == "danger") background = "bg-red-500";
    if (variant == "success") background = "bg-green-500";
    if (variant == "warning") background = "bg-yellow-500";

    const classes = `flex w-fit h-fit p-4 rounded-2xl ${background} font-semibold text-md`
    return (
        <button
            id={id}
            className={classes}
            onClick={() => { if (action) action() }}
        >{text}
        </button >
    )
}