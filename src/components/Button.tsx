interface ButtonProps {
    text: string;
    action?: () => void;
    variant?: "primary" | "pale" | "danger" | "success";
}

export default function Button({ text, action, variant }: ButtonProps) {
    let background = "bg-pale";

    if (variant == "primary") background = "bg-sky-500";
    if (variant == "danger") background = "bg-red-500";
    if (variant == "success") background = "bg-green-500";

    const classes = `flex w-fit h-fit p-4 rounded-2xl ${background} font-semibold text-md`
    return (
        <button
            className={classes}
            onClick={() => { if (action) action() }}
        >{text}
        </button >
    )
}