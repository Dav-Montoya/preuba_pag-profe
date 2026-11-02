import client from "./client"

const useProductos = () => {
    const execute = async () => {
        const data = await client();
        console.log(data);
    }

    return {
        execute,
    }
}

export default useProductos;