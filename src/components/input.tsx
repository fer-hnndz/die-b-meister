interface InputProps {
    type: string;
    placeholder: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Input({ type, placeholder, value, onChange }: InputProps) {
    return (
        <input
            type={type}
            placeholder={placeholder}
            defaultValue={value}
            onChange={(e) => { if (onChange) onChange(e) }}
            className="w-1/2 bg-pale rounded-lg h-8 pl-2"
        />
    )
}