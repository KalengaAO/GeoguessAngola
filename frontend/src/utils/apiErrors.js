export function getApiErrorMessage(error, fallback) {
    const responseData = error?.response?.data;

    if (typeof responseData === "string") {
        return responseData;
    }

    if (responseData?.detail) {
        return Array.isArray(responseData.detail)
            ? responseData.detail.join(" ")
            : String(responseData.detail);
    }

    if (responseData && typeof responseData === "object") {
        const messages = Object.values(responseData)
            .flat()
            .filter((message) => typeof message === "string");

        if (messages.length > 0) {
            return messages.join(" ");
        }
    }

    return fallback;
}
