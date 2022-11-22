
function isValidData(name: string, price: number) {
    console.log("fooooo");
    

    if (typeof name !== 'string' || typeof price !== 'number') return false;

    return true;
}

export default isValidData;