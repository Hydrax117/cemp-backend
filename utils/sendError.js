
const sendError = (res, errorMessage, statusCode, error) => {
    if (error){
        res.status(statusCode).json({
            success: "false",
            status: statusCode,
            errorMessage: errorMessage,
            error: error,
        });
    }else {
        res.status(statusCode).json({
            success: "true",
            status: statusCode,
            errorMessage: errorMessage,
        });
    }
}

export {sendError}
