import { useState } from "react";
import Input from "../components/input";
import Button from "../components/Button";

export default function NewConnectionPopup() {
    return (
        <div id="newConnectionModal" className="hidden z-0 absolute h-screen w-screen overflow-clip bg-black bg-opacity-60 flex items-center content-center justify-center">

            <div className="w-2/3 h-2/3 absolute rounded-lg shadow bg-white">
                <h1 className="font-bold text-3xl text-center text-black mt-4">Nueva Conexión</h1>

                <div className="flex flex-col gap-y-3 items-center mt-8">
                    <Input type="text" placeholder="Nombre de la conexión" value="" />
                    <Input type="text" placeholder="Host" value="" />
                    <Input type="text" placeholder="Puerto" value="" />
                    <Input type="text" placeholder="Usuario" value="" />
                    <Input type="text" placeholder="Contraseña" value="" />
                    <Input type="text" placeholder="Base de datos" value="" />

                    <Button text="Agregar" variant="success" />
                </div>



            </div>

        </div>
    )
}