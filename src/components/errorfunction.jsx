export function errorFunction(e) {
    try {
        alert(e.response.data.message);
    } catch(error) {
        console.log(e);
    }
}