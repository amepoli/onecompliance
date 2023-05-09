exports.handler = async () => {
    // 1 - Query the DB to pick the checklist to send
    // 2 - For loop in which create the object for the API
    //      Create the file excel and save the URL
    // 3 - Return all data
    return {
        statusCode: 200,
        body: JSON.stringify('OK')
    };
};