import Input from "../components/input";
import Button from "../components/Button";

export default function NewConnectionPopup({ create_connection }: { create_connection: (host: string, port: string, user: string, db: string, pass: string) => void }) {

    function close() {
        const modal = document.getElementById("newConnectionModal");
        if (!modal) return;
        modal.classList.add("hidden");
    }

    function addConnection() {
        const host = (document.getElementById("connHost") as HTMLInputElement).value;
        const port = (document.getElementById("connPort") as HTMLInputElement).value;
        const user = (document.getElementById("connUser") as HTMLInputElement).value;
        const pass = (document.getElementById("connPass") as HTMLInputElement).value;
        const db = (document.getElementById("connDb") as HTMLInputElement).value;

        create_connection(host, port, user, db, pass);

        // Clear fields
        (document.getElementById("connHost") as HTMLInputElement).value = "";
        (document.getElementById("connPort") as HTMLInputElement).value = "3306";
        (document.getElementById("connUser") as HTMLInputElement).value = "";
        (document.getElementById("connPass") as HTMLInputElement).value = "";
        (document.getElementById("connDb") as HTMLInputElement).value = "";

        close();
    }

    return (
        <div id="newConnectionModal" className="hidden z-2 absolute flex h-screen w-screen overflow-clip bg-black bg-opacity-60 items-center content-center justify-center">
            <div className="w-2/3 h-2/3 absolute rounded-lg shadow bg-white">
                <h1 className="font-bold text-3xl text-center text-black mt-4">Nueva Conexión</h1>
                <div className="flex flex-col gap-y-3 items-center mt-8">
                    <Input id="connHost" type="text" placeholder="Host" value="" />
                    <Input id="connPort" type="number" placeholder="Puerto" value="3306" />
                    <Input id="connUser" type="text" placeholder="Usuario" value="" />
                    <Input id="connPass" type="password" placeholder="Contraseña" value="" />
                    <Input id="connDb" type="text" placeholder="Base de datos" value="" />
                    <Button text="Agregar" variant="success" action={addConnection} />
                    <Button text="Cancelar" variant="danger" action={close} />
                </div>
            </div>
        </div>
    );
}