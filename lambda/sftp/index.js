exports.handler = (event) => {
    let Client = require('ssh2-sftp-client');
    let Path = '/path';

    let sftp = new Client();
    return sftp.connect({
        host: 'nikapov.dynu.net', 
        port: 5222,
        username: 'nikapov',
        privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    }).then(() => {
        return sftp.list(Path);
    }).then((list) => {
        // If you want to do something with the list, do it here 
        // else just return the list from the function above and remove this
        console.log(list);
        return list;
    }).catch((err) => {
        console.log('Catch Error: ', err);
        throw new Error(err);
    });
}; 