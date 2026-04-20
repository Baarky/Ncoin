const API_URL = "http://localhost:3000/api";

export async function sendCoin(amount, recipient) {
    try {
        const response = await fetch(`/api/sendCoin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, recipient })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in sendCoin:', error);
        return { success: false, message: error.message }; // Return error object
    }
}